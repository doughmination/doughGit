-- migrations/0004_crawler_opt_in.sql
-- LICENCED DASL-1.0 (c) Clove Twilight

ALTER TABLE user_settings
  ADD COLUMN allow_crawlers INTEGER NOT NULL DEFAULT 0 CHECK (allow_crawlers IN (0, 1));
