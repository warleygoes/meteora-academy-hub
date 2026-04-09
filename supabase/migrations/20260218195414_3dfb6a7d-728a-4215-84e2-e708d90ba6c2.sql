ALTER TABLE public.diagnostics ADD COLUMN archived boolean NOT NULL DEFAULT false;

-- Allow admins to update diagnostics (needed for archiving)
CREATE POLICY "Admins can update diagnostics"
ON public.diagnostics
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
