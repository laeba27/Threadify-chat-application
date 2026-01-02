-- Add rich text support to threads table
-- This migration updates the threads table to properly support HTML content
-- Add body_html column if it doesn't exist, or we can keep using body as TEXT
-- The body column can store both plain text and HTML content
-- Add content_type to track if body contains HTML or plain text
ALTER TABLE threads
ADD COLUMN IF NOT EXISTS content_type VARCHAR(20) DEFAULT 'html';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_threads_content_type ON threads (content_type);