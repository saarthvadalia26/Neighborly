-- Phase 6: Real-Time Notifications

-- 1. Create the notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'message',
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only SELECT their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can UPDATE (mark as read) their own notifications
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Users can DELETE their own notifications
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 2. Trigger function: notify receiver on new message
CREATE OR REPLACE FUNCTION public.notify_on_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_title TEXT;
BEGIN
  SELECT title INTO post_title FROM public.posts WHERE id = NEW.post_id;

  INSERT INTO public.notifications (user_id, type, message, related_post_id)
  VALUES (
    NEW.receiver_id,
    'message',
    'You have a new message regarding "' || COALESCE(post_title, 'a post') || '"',
    NEW.post_id
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_new_message();

-- 3. Trigger function: notify receiver on credit transfer
CREATE OR REPLACE FUNCTION public.notify_on_credit_transfer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_title TEXT;
BEGIN
  SELECT title INTO post_title FROM public.posts WHERE id = NEW.post_id;

  INSERT INTO public.notifications (user_id, type, message, related_post_id)
  VALUES (
    NEW.receiver_id,
    'credit_transfer',
    'You received ' || NEW.amount || ' Credits for "' || COALESCE(post_title, 'a post') || '"',
    NEW.post_id
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_credit_transfer
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_credit_transfer();

-- 4. Enable Realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
