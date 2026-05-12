CREATE POLICY "Users can update their own sessions"
ON public.brainstorm_sessions
FOR UPDATE
TO authenticated
USING ((auth.jwt() ->> 'email'::text) = user_email)
WITH CHECK ((auth.jwt() ->> 'email'::text) = user_email);

CREATE POLICY "Users can delete their own sessions"
ON public.brainstorm_sessions
FOR DELETE
TO authenticated
USING ((auth.jwt() ->> 'email'::text) = user_email);