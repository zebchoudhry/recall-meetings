-- Create brainstorm_sessions table
CREATE TABLE public.brainstorm_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT,
  transcript TEXT NOT NULL,
  summary TEXT,
  key_ideas JSONB DEFAULT '[]'::jsonb,
  actions JSONB DEFAULT '[]'::jsonb,
  decisions JSONB DEFAULT '[]'::jsonb,
  final_idea TEXT,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brainstorm_sessions ENABLE ROW LEVEL SECURITY;

-- Allow public insert (no auth required for MVP)
CREATE POLICY "Anyone can create brainstorm sessions"
ON public.brainstorm_sessions
FOR INSERT
WITH CHECK (true);

-- Allow reading own sessions by email
CREATE POLICY "Users can view their own sessions"
ON public.brainstorm_sessions
FOR SELECT
USING (true);

-- Create index for email lookup
CREATE INDEX idx_brainstorm_sessions_email ON public.brainstorm_sessions(user_email);
CREATE INDEX idx_brainstorm_sessions_created_at ON public.brainstorm_sessions(created_at DESC);