-- Notifications sistemi
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'follow', 'like_tier_list', 'like_review', 'comment', 'reply'
    actor_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    tier_list_id UUID REFERENCES public.tier_lists(id) ON DELETE CASCADE,
    review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    media_id UUID REFERENCES public.media(id) ON DELETE CASCADE,
    message TEXT,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, read) WHERE read = FALSE;

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi bildirimlerini görebilir
CREATE POLICY "notifications_user_read" ON public.notifications
FOR SELECT USING (auth.uid() = user_id);

-- Kullanıcılar sadece kendi bildirimlerini güncelleyebilir (okundu işareti)
CREATE POLICY "notifications_user_update" ON public.notifications
FOR UPDATE USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Notification trigger fonksiyonu
CREATE OR REPLACE FUNCTION public.create_notification()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Follow notification
    IF TG_TABLE_NAME = 'follows' THEN
        INSERT INTO public.notifications (user_id, type, actor_id)
        VALUES (NEW.following_id, 'follow', NEW.follower_id);
        RETURN NEW;
    END IF;

    -- Tier list like notification
    IF TG_TABLE_NAME = 'tier_list_likes' THEN
        SELECT user_id INTO target_user_id FROM public.tier_lists WHERE id = NEW.tier_list_id;
        IF target_user_id IS NOT NULL AND target_user_id != NEW.user_id THEN
            INSERT INTO public.notifications (user_id, type, actor_id, tier_list_id)
            VALUES (target_user_id, 'like_tier_list', NEW.user_id, NEW.tier_list_id);
        END IF;
        RETURN NEW;
    END IF;

    -- Review like notification
    IF TG_TABLE_NAME = 'review_likes' THEN
        SELECT user_id INTO target_user_id FROM public.reviews WHERE id = NEW.review_id;
        IF target_user_id IS NOT NULL AND target_user_id != NEW.user_id THEN
            INSERT INTO public.notifications (user_id, type, actor_id, review_id)
            VALUES (target_user_id, 'like_review', NEW.user_id, NEW.review_id);
        END IF;
        RETURN NEW;
    END IF;

    -- Comment notification
    IF TG_TABLE_NAME = 'comments' THEN
        -- Get target user based on comment target
        IF NEW.tier_list_id IS NOT NULL THEN
            SELECT user_id INTO target_user_id FROM public.tier_lists WHERE id = NEW.tier_list_id;
        ELSIF NEW.review_id IS NOT NULL THEN
            SELECT user_id INTO target_user_id FROM public.reviews WHERE id = NEW.review_id;
        END IF;

        IF target_user_id IS NOT NULL AND target_user_id != NEW.user_id THEN
            INSERT INTO public.notifications (user_id, type, actor_id, comment_id, tier_list_id, review_id)
            VALUES (target_user_id, 'comment', NEW.user_id, NEW.id, NEW.tier_list_id, NEW.review_id);
        END IF;

        -- Reply notification
        IF NEW.parent_id IS NOT NULL THEN
            SELECT user_id INTO target_user_id FROM public.comments WHERE id = NEW.parent_id;
            IF target_user_id IS NOT NULL AND target_user_id != NEW.user_id THEN
                INSERT INTO public.notifications (user_id, type, actor_id, comment_id)
                VALUES (target_user_id, 'reply', NEW.user_id, NEW.id);
            END IF;
        END IF;

        RETURN NEW;
    END IF;

    RETURN NEW;
END $$;

-- Notification triggers
DO $$ BEGIN
    CREATE TRIGGER trg_follows_notification
    AFTER INSERT ON public.follows
    FOR EACH ROW EXECUTE FUNCTION public.create_notification();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TRIGGER trg_tier_list_likes_notification
    AFTER INSERT ON public.tier_list_likes
    FOR EACH ROW EXECUTE FUNCTION public.create_notification();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TRIGGER trg_review_likes_notification
    AFTER INSERT ON public.review_likes
    FOR EACH ROW EXECUTE FUNCTION public.create_notification();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TRIGGER trg_comments_notification
    AFTER INSERT ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.create_notification();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
