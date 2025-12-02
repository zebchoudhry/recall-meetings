-- Drop the insecure SELECT policy
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.brainstorm_sessions;

-- Create secure SELECT policy - users can only view sessions matching their email
CREATE POLICY "Users can view their own sessions" 
ON public.brainstorm_sessions 
FOR SELECT 
USING (auth.jwt() ->> 'email' = user_email);

-- Also fix the INSERT policy to ensure users can only create sessions with their own email
DROP POLICY IF EXISTS "Anyone can create brainstorm sessions" ON public.brainstorm_sessions;

CREATE POLICY "Users can create their own sessions" 
ON public.brainstorm_sessions 
FOR INSERT 
WITH CHECK (auth.jwt() ->> 'email' = user_email);