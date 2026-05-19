-- Phase 5: Categories & Advanced Filtering

-- Add category column to posts table
ALTER TABLE public.posts ADD COLUMN category TEXT DEFAULT 'other' NOT NULL;
ALTER TABLE public.posts ADD CONSTRAINT posts_category_check CHECK (category IN ('items', 'services', 'errands', 'other'));
