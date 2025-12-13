-- Person Ratings / Oyuncu Radar Sistemi
-- Trait'ler: acting, charisma, voice, range

-- Person tablosu (TMDB'den)
CREATE TABLE IF NOT EXISTS public.persons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tmdb_id INT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    profile_path TEXT,
    known_for_department TEXT,
    popularity NUMERIC(10, 2),
    biography TEXT,
    birthday DATE,
    place_of_birth TEXT,
    tmdb_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_persons_name ON public.persons USING gin(to_tsvector('simple', name));
CREATE INDEX IF NOT EXISTS idx_persons_pop ON public.persons(popularity DESC);

-- Kullanıcı başına person değerlendirmesi
CREATE TABLE IF NOT EXISTS public.person_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES public.persons(id) ON DELETE CASCADE,
    acting INT CHECK (acting >= 0 AND acting <= 10),
    charisma INT CHECK (charisma >= 0 AND charisma <= 10),
    voice INT CHECK (voice >= 0 AND voice <= 10),
    range_score INT CHECK (range_score >= 0 AND range_score <= 10),
    overall_comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, person_id)
);

CREATE INDEX IF NOT EXISTS idx_person_ratings_person ON public.person_ratings(person_id);
CREATE INDEX IF NOT EXISTS idx_person_ratings_user ON public.person_ratings(user_id);

-- Topluluk ortalaması için view
CREATE OR REPLACE VIEW public.person_aggregate_ratings AS
SELECT
    person_id,
    COUNT(*) AS rating_count,
    ROUND(AVG(acting), 1) AS avg_acting,
    ROUND(AVG(charisma), 1) AS avg_charisma,
    ROUND(AVG(voice), 1) AS avg_voice,
    ROUND(AVG(range_score), 1) AS avg_range,
    ROUND((AVG(acting) + AVG(charisma) + AVG(voice) + AVG(range_score)) / 4, 1) AS avg_overall
FROM public.person_ratings
GROUP BY person_id;

-- RLS
ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_ratings ENABLE ROW LEVEL SECURITY;

-- Persons herkes okuyabilir
CREATE POLICY "persons_read_all" ON public.persons
FOR SELECT USING (true);

-- Person ratings - kullanıcı kendi değerlendirmelerini yönetebilir
CREATE POLICY "person_ratings_owner_crud" ON public.person_ratings
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Herkes başkalarının değerlendirmelerini okuyabilir
CREATE POLICY "person_ratings_read_all" ON public.person_ratings
FOR SELECT USING (true);

-- Updated at trigger
DO $$ BEGIN
    CREATE TRIGGER trg_persons_updated_at
    BEFORE UPDATE ON public.persons
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TRIGGER trg_person_ratings_updated_at
    BEFORE UPDATE ON public.person_ratings
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
