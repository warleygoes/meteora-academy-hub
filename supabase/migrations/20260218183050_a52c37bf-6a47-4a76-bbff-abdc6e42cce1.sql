-- Allow anonymous users to insert into diagnostic_lead_tracking (created during diagnostic flow)
CREATE POLICY "Anyone can insert lead tracking"
ON public.diagnostic_lead_tracking
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow anonymous users to select their own diagnostic (needed for flow)  
CREATE POLICY "Anyone can select diagnostics by email"
ON public.diagnostics
FOR SELECT
TO anon
USING (true);