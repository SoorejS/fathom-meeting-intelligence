const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');

const { SEEDED_MEETINGS: meetings } = load('src/data/seededMeetings.ts');
const { SEEDED_PLAYLISTS: initialPlaylists } = load('src/data/seededPlaylists.ts');
const playlistService = load('src/services/playlistService.ts');

test('playlist resolves clips against real seeded meeting and highlight records', () => {
  const p1 = initialPlaylists[0];
  const resolved = playlistService.resolvePlaylistClips(p1, meetings);

  assert.equal(resolved.length, p1.items.length);
  for (const clip of resolved) {
    const matchingMeeting = meetings.find(m => m.id === clip.meetingId);
    assert.ok(matchingMeeting, 'Clip references real meeting');
    assert.equal(clip.meetingTitle, matchingMeeting.title);
    const matchingHighlight = matchingMeeting.highlights.find(h => h.id === clip.highlightId);
    assert.ok(matchingHighlight, 'Clip references real highlight in meeting');
    assert.equal(clip.highlightText, matchingHighlight.text);
    assert.equal(clip.timestamp, matchingHighlight.timestamp);
    assert.equal(clip.highlightType, matchingHighlight.type);
  }
});

test('playlist lifecycle: create, rename, add clips, reorder, remove, and delete', () => {
  // 1. Create
  let pl = playlistService.createPlaylist('Executive Highlights', 'Curated leadership takeaways');
  assert.equal(pl.title, 'Executive Highlights');
  assert.equal(pl.items.length, 0);

  // 2. Add clips from seeded meetings
  const m0 = meetings[0];
  const m1 = meetings[1];
  pl = playlistService.addHighlightToPlaylist(pl, m0.id, m0.highlights[0].id);
  pl = playlistService.addHighlightToPlaylist(pl, m1.id, m1.highlights[0].id);
  assert.equal(pl.items.length, 2);
  assert.equal(pl.items[0].order, 0);
  assert.equal(pl.items[1].order, 1);

  // Prevent duplicate additions
  const duplicate = playlistService.addHighlightToPlaylist(pl, m0.id, m0.highlights[0].id);
  assert.equal(duplicate.items.length, 2);

  // 3. Rename
  pl = playlistService.renamePlaylist(pl, 'Executive & Board Reel', 'Updated description');
  assert.equal(pl.title, 'Executive & Board Reel');
  assert.equal(pl.description, 'Updated description');

  // 4. Reorder
  const firstClipId = pl.items[0].id;
  const secondClipId = pl.items[1].id;
  pl = playlistService.reorderClips(pl, firstClipId, 'down');
  assert.equal(pl.items[0].id, secondClipId);
  assert.equal(pl.items[1].id, firstClipId);
  assert.equal(pl.items[0].order, 0);
  assert.equal(pl.items[1].order, 1);

  // 5. Remove clip
  pl = playlistService.removeClipFromPlaylist(pl, firstClipId);
  assert.equal(pl.items.length, 1);
  assert.equal(pl.items[0].id, secondClipId);
  assert.equal(pl.items[0].order, 0);

  // 6. Delete playlist
  const list = [pl, initialPlaylists[0]];
  const remaining = playlistService.deletePlaylist(list, pl.id);
  assert.equal(remaining.length, 1);
  assert.equal(remaining[0].id, initialPlaylists[0].id);
});
