-- CineTier Database Schema Update
-- External Ratings and Anime Support
-- Run this in Supabase SQL Editor

-- ============================================
-- ADD EXTERNAL RATINGS COLUMNS TO MEDIA TABLE
-- ============================================

-- Add IMDb rating (1-10 scale)
ALTER TABLE media ADD COLUMN IF NOT EXISTS imdb_rating DECIMAL(3,1);

-- Add Rotten Tomatoes rating (0-100 percent)
ALTER TABLE media ADD COLUMN IF NOT EXISTS rt_rating INTEGER;

-- Add Metascore rating (0-100)
ALTER TABLE media ADD COLUMN IF NOT EXISTS metascore INTEGER;

-- Add IMDb ID for OMDb API lookups
ALTER TABLE media ADD COLUMN IF NOT EXISTS imdb_id VARCHAR(20);

-- Add media source to track where data came from
-- 'tmdb' = The Movie Database, 'jikan' = Jikan/MyAnimeList
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_source_enum') THEN
        CREATE TYPE media_source_enum AS ENUM ('tmdb', 'jikan');
    END IF;
END $$;

ALTER TABLE media ADD COLUMN IF NOT EXISTS media_source media_source_enum DEFAULT 'tmdb';

-- Add external ratings updated timestamp for cache invalidation (7 day cache)
ALTER TABLE media ADD COLUMN IF NOT EXISTS ratings_updated_at TIMESTAMPTZ;

-- Update media_type check constraint to include 'anime'
ALTER TABLE media DROP CONSTRAINT IF EXISTS media_media_type_check;
ALTER TABLE media ADD CONSTRAINT media_media_type_check
    CHECK (media_type IN ('movie', 'tv', 'anime'));

-- ============================================
-- INDEXES FOR NEW COLUMNS
-- ============================================

-- Index for IMDb ID lookups
CREATE INDEX IF NOT EXISTS idx_media_imdb_id ON media(imdb_id) WHERE imdb_id IS NOT NULL;

-- Index for media source filtering
CREATE INDEX IF NOT EXISTS idx_media_source ON media(media_source);

-- Index for IMDb rating sorting (for rankings page)
CREATE INDEX IF NOT EXISTS idx_media_imdb_rating ON media(imdb_rating DESC NULLS LAST);

-- Composite index for ranking queries
CREATE INDEX IF NOT EXISTS idx_media_ranking ON media(media_type, imdb_rating DESC NULLS LAST);

-- ============================================
-- ANIME-SPECIFIC TABLE (Optional - for extended anime data)
-- ============================================

CREATE TABLE IF NOT EXISTS anime_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    mal_id INTEGER UNIQUE NOT NULL,
    mal_score DECIMAL(3,2),
    mal_rank INTEGER,
    mal_popularity INTEGER,
    episodes INTEGER,
    status VARCHAR(50),
    airing BOOLEAN DEFAULT false,
    aired_from DATE,
    aired_to DATE,
    duration VARCHAR(50),
    rating VARCHAR(50), -- e.g., "PG-13", "R - 17+"
    source VARCHAR(50), -- e.g., "Manga", "Light novel", "Original"
    season VARCHAR(20),
    year INTEGER,
    studios JSONB DEFAULT '[]',
    themes JSONB DEFAULT '[]',
    demographics JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for MAL ID lookups
CREATE INDEX IF NOT EXISTS idx_anime_mal_id ON anime_details(mal_id);
CREATE INDEX IF NOT EXISTS idx_anime_media_id ON anime_details(media_id);

-- ============================================
-- FUNCTION: Check if ratings need refresh (7 day cache)
-- ============================================

CREATE OR REPLACE FUNCTION needs_ratings_refresh(p_media_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_ratings_updated_at TIMESTAMPTZ;
BEGIN
    SELECT ratings_updated_at INTO v_ratings_updated_at
    FROM media WHERE id = p_media_id;

    -- If never updated or older than 7 days, needs refresh
    RETURN v_ratings_updated_at IS NULL OR
           v_ratings_updated_at < (NOW() - INTERVAL '7 days');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Update media ratings
-- ============================================

CREATE OR REPLACE FUNCTION update_media_ratings(
    p_media_id UUID,
    p_imdb_id VARCHAR(20),
    p_imdb_rating DECIMAL(3,1),
    p_rt_rating INTEGER,
    p_metascore INTEGER
)
RETURNS VOID AS $$
BEGIN
    UPDATE media
    SET
        imdb_id = COALESCE(p_imdb_id, imdb_id),
        imdb_rating = p_imdb_rating,
        rt_rating = p_rt_rating,
        metascore = p_metascore,
        ratings_updated_at = NOW(),
        updated_at = NOW()
    WHERE id = p_media_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN media.imdb_rating IS 'IMDb rating from OMDb API (1-10 scale)';
COMMENT ON COLUMN media.rt_rating IS 'Rotten Tomatoes rating from OMDb API (0-100%)';
COMMENT ON COLUMN media.metascore IS 'Metacritic score from OMDb API (0-100)';
COMMENT ON COLUMN media.imdb_id IS 'IMDb ID (e.g., tt1234567) for OMDb API lookups';
COMMENT ON COLUMN media.media_source IS 'Source of media data: tmdb or jikan';
COMMENT ON COLUMN media.ratings_updated_at IS 'Timestamp of last ratings update for cache invalidation';
COMMENT ON TABLE anime_details IS 'Extended anime-specific data from Jikan/MyAnimeList';
