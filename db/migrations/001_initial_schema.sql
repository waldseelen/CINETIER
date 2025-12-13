-- CineTier Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(20) UNIQUE NOT NULL,
  display_name VARCHAR(50) NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  watchlist_privacy VARCHAR(20) DEFAULT 'public' CHECK (watchlist_privacy IN ('public', 'followers', 'private')),
  watched_privacy VARCHAR(20) DEFAULT 'public' CHECK (watched_privacy IN ('public', 'followers', 'private')),
  show_elo_stats BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MEDIA TABLE (cached TMDB data)
-- ============================================
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tmdb_id INTEGER NOT NULL,
  media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('movie', 'tv')),
  title VARCHAR(500) NOT NULL,
  original_title VARCHAR(500),
  poster_path TEXT,
  backdrop_path TEXT,
  release_date DATE,
  overview TEXT,
  vote_average DECIMAL(3,1) DEFAULT 0,
  genres JSONB DEFAULT '[]',
  global_elo INTEGER DEFAULT 1200,
  global_match_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tmdb_id, media_type)
);

-- Index for faster lookups
CREATE INDEX idx_media_tmdb ON media(tmdb_id, media_type);
CREATE INDEX idx_media_elo ON media(global_elo DESC);

-- ============================================
-- USER_MEDIA TABLE (watched, watchlist, ratings)
-- ============================================
CREATE TABLE user_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  watched BOOLEAN DEFAULT false,
  watchlist BOOLEAN DEFAULT false,
  rating DECIMAL(3,1) CHECK (rating >= 0 AND rating <= 10),
  short_note VARCHAR(280),
  user_elo INTEGER DEFAULT 1200,
  user_match_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, media_id)
);

CREATE INDEX idx_user_media_user ON user_media(user_id);
CREATE INDEX idx_user_media_watched ON user_media(user_id) WHERE watched = true;
CREATE INDEX idx_user_media_watchlist ON user_media(user_id) WHERE watchlist = true;

-- ============================================
-- TIER_LISTS TABLE
-- ============================================
CREATE TABLE tier_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  slug VARCHAR(150) UNIQUE NOT NULL,
  visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'unlisted', 'private')),
  media_type VARCHAR(10) DEFAULT 'mixed' CHECK (media_type IN ('movie', 'tv', 'mixed')),
  tiers JSONB NOT NULL DEFAULT '[]',
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tier_lists_user ON tier_lists(user_id);
CREATE INDEX idx_tier_lists_public ON tier_lists(visibility, created_at DESC) WHERE visibility = 'public';
CREATE INDEX idx_tier_lists_slug ON tier_lists(slug);

-- ============================================
-- REVIEWS TABLE
-- ============================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  has_spoilers BOOLEAN DEFAULT false,
  rating DECIMAL(3,1) CHECK (rating >= 0 AND rating <= 10),
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, media_id)
);

CREATE INDEX idx_reviews_media ON reviews(media_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);

-- ============================================
-- COMMENTS TABLE
-- ============================================
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('tier_list', 'media', 'review')),
  target_id UUID NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_target ON comments(target_type, target_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);

-- ============================================
-- LIKES TABLE
-- ============================================
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('tier_list', 'review', 'comment')),
  target_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id)
);

CREATE INDEX idx_likes_target ON likes(target_type, target_id);

-- ============================================
-- FOLLOWS TABLE
-- ============================================
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- ============================================
-- VS_MATCHES TABLE
-- ============================================
CREATE TABLE vs_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  winner_media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  loser_media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  scope VARCHAR(10) DEFAULT 'global' CHECK (scope IN ('global', 'user')),
  tier_list_id UUID REFERENCES tier_lists(id) ON DELETE SET NULL,
  winner_rating_before INTEGER NOT NULL,
  loser_rating_before INTEGER NOT NULL,
  winner_rating_after INTEGER NOT NULL,
  loser_rating_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vs_matches_user ON vs_matches(user_id);
CREATE INDEX idx_vs_matches_media ON vs_matches(winner_media_id);
CREATE INDEX idx_vs_matches_created ON vs_matches(created_at DESC);

-- ============================================
-- REPORTS TABLE
-- ============================================
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('tier_list', 'review', 'comment', 'user')),
  target_id UUID NOT NULL,
  reason VARCHAR(50) NOT NULL,
  details TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_status ON reports(status);

-- ============================================
-- BLOCKS TABLE
-- ============================================
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

CREATE INDEX idx_blocks_blocker ON blocks(blocker_id);

-- ============================================
-- ACTIVITIES TABLE (for feed)
-- ============================================
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('watched', 'watchlist', 'rating', 'review', 'tier_list', 'like', 'follow')),
  target_type VARCHAR(50) NOT NULL,
  target_id UUID NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activities_user ON activities(user_id, created_at DESC);
CREATE INDEX idx_activities_created ON activities(created_at DESC);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_media_updated_at BEFORE UPDATE ON media FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_user_media_updated_at BEFORE UPDATE ON user_media FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_tier_lists_updated_at BEFORE UPDATE ON tier_lists FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Like count increment function
CREATE OR REPLACE FUNCTION update_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.target_type = 'tier_list' THEN
      UPDATE tier_lists SET like_count = like_count + 1 WHERE id = NEW.target_id;
    ELSIF NEW.target_type = 'review' THEN
      UPDATE reviews SET like_count = like_count + 1 WHERE id = NEW.target_id;
    ELSIF NEW.target_type = 'comment' THEN
      UPDATE comments SET like_count = like_count + 1 WHERE id = NEW.target_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.target_type = 'tier_list' THEN
      UPDATE tier_lists SET like_count = like_count - 1 WHERE id = OLD.target_id;
    ELSIF OLD.target_type = 'review' THEN
      UPDATE reviews SET like_count = like_count - 1 WHERE id = OLD.target_id;
    ELSIF OLD.target_type = 'comment' THEN
      UPDATE comments SET like_count = like_count - 1 WHERE id = OLD.target_id;
    END IF;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_like_counts
AFTER INSERT OR DELETE ON likes
FOR EACH ROW EXECUTE FUNCTION update_like_count();

-- Comment count increment function
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.target_type = 'tier_list' THEN
      UPDATE tier_lists SET comment_count = comment_count + 1 WHERE id = NEW.target_id;
    ELSIF NEW.target_type = 'review' THEN
      UPDATE reviews SET comment_count = comment_count + 1 WHERE id = NEW.target_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.target_type = 'tier_list' THEN
      UPDATE tier_lists SET comment_count = comment_count - 1 WHERE id = OLD.target_id;
    ELSIF OLD.target_type = 'review' THEN
      UPDATE reviews SET comment_count = comment_count - 1 WHERE id = OLD.target_id;
    END IF;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_comment_counts
AFTER INSERT OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION update_comment_count();

-- Create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'username', 'User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();
