-- CineTier Row Level Security (RLS) Policies
-- Run this after the initial schema

-- ============================================
-- PROFILES RLS
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can view profiles
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- MEDIA RLS
-- ============================================
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Everyone can view media
CREATE POLICY "Media is viewable by everyone" ON media
  FOR SELECT USING (true);

-- Only authenticated users can insert (caching TMDB data)
CREATE POLICY "Authenticated users can insert media" ON media
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- USER_MEDIA RLS
-- ============================================
ALTER TABLE user_media ENABLE ROW LEVEL SECURITY;

-- Users can view their own user_media
CREATE POLICY "Users can view own user_media" ON user_media
  FOR SELECT USING (auth.uid() = user_id);

-- Public can view based on profile privacy settings
CREATE POLICY "Public can view user_media based on privacy" ON user_media
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = user_media.user_id
      AND (
        (user_media.watched = true AND p.watched_privacy = 'public')
        OR (user_media.watchlist = true AND p.watchlist_privacy = 'public')
      )
    )
  );

-- Users can manage their own user_media
CREATE POLICY "Users can insert own user_media" ON user_media
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own user_media" ON user_media
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own user_media" ON user_media
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- TIER_LISTS RLS
-- ============================================
ALTER TABLE tier_lists ENABLE ROW LEVEL SECURITY;

-- Public lists are viewable by everyone
CREATE POLICY "Public tier lists are viewable by everyone" ON tier_lists
  FOR SELECT USING (visibility = 'public' OR visibility = 'unlisted' OR auth.uid() = user_id);

-- Users can manage their own tier lists
CREATE POLICY "Users can insert own tier lists" ON tier_lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tier lists" ON tier_lists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tier lists" ON tier_lists
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- REVIEWS RLS
-- ============================================
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Reviews are viewable by everyone
CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

-- Users can manage their own reviews
CREATE POLICY "Users can insert own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" ON reviews
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- COMMENTS RLS
-- ============================================
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Comments are viewable by everyone
CREATE POLICY "Comments are viewable by everyone" ON comments
  FOR SELECT USING (true);

-- Users can manage their own comments
CREATE POLICY "Users can insert own comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- LIKES RLS
-- ============================================
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Likes are viewable by everyone
CREATE POLICY "Likes are viewable by everyone" ON likes
  FOR SELECT USING (true);

-- Users can manage their own likes
CREATE POLICY "Users can insert own likes" ON likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" ON likes
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- FOLLOWS RLS
-- ============================================
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Follows are viewable by everyone
CREATE POLICY "Follows are viewable by everyone" ON follows
  FOR SELECT USING (true);

-- Users can manage their own follows
CREATE POLICY "Users can insert own follows" ON follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete own follows" ON follows
  FOR DELETE USING (auth.uid() = follower_id);

-- ============================================
-- VS_MATCHES RLS
-- ============================================
ALTER TABLE vs_matches ENABLE ROW LEVEL SECURITY;

-- VS matches are viewable by everyone
CREATE POLICY "VS matches are viewable by everyone" ON vs_matches
  FOR SELECT USING (true);

-- Authenticated users can insert VS matches
CREATE POLICY "Authenticated users can insert VS matches" ON vs_matches
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- REPORTS RLS
-- ============================================
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Users can view their own reports
CREATE POLICY "Users can view own reports" ON reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- Users can create reports
CREATE POLICY "Users can create reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- ============================================
-- BLOCKS RLS
-- ============================================
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- Users can view their own blocks
CREATE POLICY "Users can view own blocks" ON blocks
  FOR SELECT USING (auth.uid() = blocker_id);

-- Users can manage their own blocks
CREATE POLICY "Users can insert own blocks" ON blocks
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete own blocks" ON blocks
  FOR DELETE USING (auth.uid() = blocker_id);

-- ============================================
-- ACTIVITIES RLS
-- ============================================
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Activities are viewable by everyone (feed)
CREATE POLICY "Activities are viewable by everyone" ON activities
  FOR SELECT USING (true);

-- System/triggers insert activities (use service role)
CREATE POLICY "Service role can insert activities" ON activities
  FOR INSERT WITH CHECK (true);
