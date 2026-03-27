-- Allow admins to INSERT, UPDATE, DELETE groups
CREATE POLICY "Admins can insert groups"
ON public.groups FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Admins can update groups"
ON public.groups FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Admins can delete groups"
ON public.groups FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'administrator'::app_role));