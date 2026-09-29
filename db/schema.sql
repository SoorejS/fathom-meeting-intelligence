CREATE TABLE IF NOT EXISTS meetings (
 id text PRIMARY KEY, title text NOT NULL, date timestamptz NOT NULL,
 duration double precision NOT NULL CHECK(duration >= 0), category text NOT NULL,
 summary jsonb NOT NULL, test_call jsonb, created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS participants (
 id text NOT NULL, meeting_id text NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
 name text NOT NULL, role text NOT NULL DEFAULT '', company text, initials text NOT NULL,
 color text NOT NULL DEFAULT '', PRIMARY KEY(meeting_id,id)
);
CREATE TABLE IF NOT EXISTS transcript_segments (
 id text PRIMARY KEY, meeting_id text NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
 speaker text NOT NULL, timestamp integer NOT NULL CHECK(timestamp >= 0), text text NOT NULL
);
CREATE TABLE IF NOT EXISTS action_items (
 id text PRIMARY KEY, meeting_id text NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
 text text NOT NULL, owner text NOT NULL, status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','completed')),
 due_date text, source_timestamp integer NOT NULL CHECK(source_timestamp >= 0)
);
CREATE TABLE IF NOT EXISTS highlights (
 id text PRIMARY KEY, meeting_id text NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
 timestamp integer NOT NULL CHECK(timestamp >= 0), type text NOT NULL, text text NOT NULL, creator text NOT NULL
);
CREATE TABLE IF NOT EXISTS playlists (
 id text PRIMARY KEY, title text NOT NULL, description text NOT NULL DEFAULT '', created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS playlist_items (
 id text PRIMARY KEY, playlist_id text NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
 highlight_id text NOT NULL REFERENCES highlights(id) ON DELETE CASCADE, position integer NOT NULL,
 UNIQUE(playlist_id,highlight_id)
);
CREATE TABLE IF NOT EXISTS trackers (
 id text PRIMARY KEY, name text NOT NULL, keywords text[] NOT NULL, enabled boolean NOT NULL DEFAULT true,
 created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS shares (
 token text PRIMARY KEY, meeting_id text NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
 timestamp integer NOT NULL DEFAULT 0 CHECK(timestamp >= 0), created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS transcript_meeting ON transcript_segments(meeting_id,timestamp);
CREATE INDEX IF NOT EXISTS actions_meeting ON action_items(meeting_id);
CREATE INDEX IF NOT EXISTS highlights_meeting ON highlights(meeting_id);
CREATE INDEX IF NOT EXISTS participants_meeting ON participants(meeting_id);
