-- Create forum_questions table
CREATE TABLE public.forum_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  views INTEGER NOT NULL DEFAULT 0,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  is_hot BOOLEAN NOT NULL DEFAULT false
);

-- Create forum_answers table
CREATE TABLE public.forum_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.forum_questions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_accepted BOOLEAN NOT NULL DEFAULT false,
  upvotes INTEGER NOT NULL DEFAULT 0
);

-- Create forum_question_tags junction table
CREATE TABLE public.forum_question_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.forum_questions(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  UNIQUE(question_id, tag_id)
);

-- Enable RLS
ALTER TABLE public.forum_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_question_tags ENABLE ROW LEVEL SECURITY;

-- RLS policies for forum_questions
CREATE POLICY "Authenticated users can view all questions"
ON public.forum_questions FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create questions"
ON public.forum_questions FOR INSERT
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own questions"
ON public.forum_questions FOR UPDATE
USING (auth.uid() = author_id OR has_role(auth.uid(), 'administrator'));

CREATE POLICY "Admins can delete questions"
ON public.forum_questions FOR DELETE
USING (has_role(auth.uid(), 'administrator'));

-- RLS policies for forum_answers
CREATE POLICY "Authenticated users can view all answers"
ON public.forum_answers FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create answers"
ON public.forum_answers FOR INSERT
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own answers"
ON public.forum_answers FOR UPDATE
USING (auth.uid() = author_id OR has_role(auth.uid(), 'administrator'));

CREATE POLICY "Admins can delete answers"
ON public.forum_answers FOR DELETE
USING (has_role(auth.uid(), 'administrator'));

-- RLS policies for forum_question_tags
CREATE POLICY "Authenticated users can view question tags"
ON public.forum_question_tags FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Question authors can manage tags"
ON public.forum_question_tags FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.forum_questions q
    WHERE q.id = question_id AND q.author_id = auth.uid()
  )
  OR has_role(auth.uid(), 'administrator')
);

-- Create triggers for updated_at
CREATE TRIGGER update_forum_questions_updated_at
BEFORE UPDATE ON public.forum_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_forum_answers_updated_at
BEFORE UPDATE ON public.forum_answers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert mock data as seed data
INSERT INTO public.tags (name, color) VALUES 
  ('Brandschutz', '#ef4444'),
  ('Elektrik', '#f59e0b'),
  ('Beton', '#6b7280'),
  ('Wetter', '#06b6d4'),
  ('Schallschutz', '#8b5cf6'),
  ('Bauvorschriften', '#3b82f6'),
  ('Sicherheit', '#ef4444'),
  ('Dacharbeiten', '#10b981'),
  ('VOB', '#3b82f6'),
  ('Recht', '#ec4899')
ON CONFLICT DO NOTHING;