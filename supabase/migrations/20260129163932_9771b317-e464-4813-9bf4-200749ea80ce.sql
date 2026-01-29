-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a new restrictive SELECT policy
-- Users can only see their own profile OR admins can see all
CREATE POLICY "Users can view own profile or admins see all" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = id 
  OR has_role(auth.uid(), 'administrator')
);

-- Create a public view with limited profile info for document attribution
-- This exposes only non-sensitive data (id, name, avatar_url) for showing uploader names
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT 
  id,
  name,
  avatar_url
FROM public.profiles;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.profiles_public TO authenticated;