-- Add social media columns to vendors table
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS tiktok_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS youtube_url TEXT,
ADD COLUMN IF NOT EXISTS pinterest_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendors_social_media ON vendors(id) WHERE 
  facebook_url IS NOT NULL OR 
  instagram_url IS NOT NULL OR 
  tiktok_url IS NOT NULL OR 
  twitter_url IS NOT NULL OR 
  youtube_url IS NOT NULL OR 
  pinterest_url IS NOT NULL OR 
  linkedin_url IS NOT NULL;
