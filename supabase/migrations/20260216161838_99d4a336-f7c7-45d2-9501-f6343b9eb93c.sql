
-- Webhooks configuration table
CREATE TABLE public.webhook_endpoints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage webhooks" ON public.webhook_endpoints
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Event types we want to notify
CREATE TABLE public.webhook_event_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_event_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage event types" ON public.webhook_event_types
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Seed default event types
INSERT INTO public.webhook_event_types (event_key, label, enabled) VALUES
  ('user.registered', 'Nuevo usuario registrado', false),
  ('user.approved', 'Usuario aprobado', false),
  ('user.rejected', 'Usuario rechazado', false),
  ('user.deleted', 'Usuario eliminado', false),
  ('payment.completed', 'Pago completado', false),
  ('payment.failed', 'Pago fallido', false),
  ('enrollment.created', 'Nueva inscripción', false),
  ('lesson.completed', 'Lección completada', false),
  ('course.completed', 'Curso completado', false),
  ('plan.activated', 'Plan activado', false),
  ('plan.expired', 'Plan expirado', false),
  ('diagnostic.submitted', 'Diagnóstico enviado', false);

-- Trigger for updated_at
CREATE TRIGGER update_webhook_endpoints_updated_at
  BEFORE UPDATE ON public.webhook_endpoints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
