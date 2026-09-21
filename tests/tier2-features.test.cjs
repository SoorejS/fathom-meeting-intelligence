const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');

const { SEEDED_MEETINGS: meetings } = load('src/data/seededMeetings.ts');
const { SEEDED_PLAYLISTS: initialPlaylists } = load('src/data/seededPlaylists.ts');
const { SEEDED_TRACKERS: initialTrackers } = load('src/data/seededTrackers.ts');
const { SEEDED_UPCOMING_MEETINGS: initialUpcoming } = load('src/data/seededUpcoming.ts');
const playlistService = load('src/services/playlistService.ts');
const trackerService = load('src/services/trackerService.ts');
const settingsService = load('src/services/settingsService.ts');
const upcomingService = load('src/services/upcomingService.ts');
const teamService = load('src/services/teamService.ts');

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

test('tracker scans transcripts for keyword matches with speaker, excerpt, and timestamp', () => {
  const matches = trackerService.scanTranscriptMatches(initialTrackers, meetings);
  assert.ok(matches.length > 0, 'Finds keyword matches across transcripts');

  // Verify match attributes
  for (const match of matches) {
    const meeting = meetings.find(m => m.id === match.meetingId);
    assert.ok(meeting, 'Match references real meeting');
    assert.equal(match.meetingTitle, meeting.title);
    const seg = meeting.transcript.find(t => t.id === match.segmentId);
    assert.ok(seg, 'Match references real transcript segment');
    assert.equal(match.speaker, seg.speaker);
    assert.equal(match.timestamp, seg.timestamp);
    assert.equal(match.timestampFormatted, seg.timestampFormatted);
    assert.ok(seg.text.toLowerCase().includes(match.keyword.toLowerCase()), 'Excerpt contains keyword');
  }

  // Verify specific known mentions in seeded transcripts
  const crmMatches = matches.filter(m => m.trackerId === 'tr_crm');
  assert.ok(crmMatches.some(m => m.keyword.toLowerCase() === 'salesforce' || m.keyword.toLowerCase() === 'slack'));

  const launchMatches = matches.filter(m => m.trackerId === 'tr_launch');
  assert.ok(launchMatches.some(m => m.keyword.toLowerCase() === 'november' || m.keyword.toLowerCase() === 'latency'));
});

test('tracker lifecycle: create, update, enable/disable toggle, meeting scoping, and delete', () => {
  // 1. Create tracker
  let tracker = trackerService.createTracker('AI Summaries Feedback', ['summary', 'accuracy'], 'all');
  assert.equal(tracker.name, 'AI Summaries Feedback');
  assert.equal(tracker.enabled, true);
  assert.deepEqual(tracker.keywords, ['summary', 'accuracy']);

  // Initial matches
  let matches = trackerService.scanTranscriptMatches([tracker], meetings);
  assert.ok(matches.length > 0, 'Found summary/accuracy mentions');

  // 2. Disable tracker -> should yield 0 matches
  tracker = trackerService.toggleTrackerEnabled(tracker);
  assert.equal(tracker.enabled, false);
  matches = trackerService.scanTranscriptMatches([tracker], meetings);
  assert.equal(matches.length, 0, 'Disabled tracker yields zero matches');

  // 3. Re-enable and update keywords
  tracker = trackerService.toggleTrackerEnabled(tracker);
  tracker = trackerService.updateTracker(tracker, { keywords: ['glossary', 'medical'] });
  assert.deepEqual(tracker.keywords, ['glossary', 'medical']);
  matches = trackerService.scanTranscriptMatches([tracker], meetings);
  assert.ok(matches.length > 0);
  assert.ok(matches.every(m => m.meetingId === 'm_healthsync_feedback'), 'Matches only the medical feedback meeting');

  // 4. Meeting Scoping: restrict to m_prod_strategy only
  tracker = trackerService.updateTracker(tracker, { meetingScope: ['m_prod_strategy'] });
  matches = trackerService.scanTranscriptMatches([tracker], meetings);
  assert.equal(matches.length, 0, 'Scoped out meeting yields zero matches');

  // 5. Delete tracker
  const trackerList = [tracker, initialTrackers[0]];
  const remaining = trackerService.deleteTracker(trackerList, tracker.id);
  assert.equal(remaining.length, 1);
  assert.equal(remaining[0].id, initialTrackers[0].id);
});

test('settings service: updates recording, summary, sharing, and custom highlight types', () => {
  let settings = settingsService.defaultSettings();
  assert.equal(settings.recording.autoRecordMode, 'external');
  assert.equal(settings.recording.botDisplayName, 'Fathom Notetaker');
  assert.equal(settings.summaries.defaultTemplate, 'default');
  assert.equal(settings.summaries.autoExtractActions, true);
  assert.equal(settings.sharing.defaultVisibility, 'team');
  assert.equal(settings.highlights.types.length, 4);

  // 1. Update Recording Settings
  settings = settingsService.updateRecordingSettings(settings, {
    autoRecordMode: 'all',
    consentPreference: 'required',
    botDisplayName: 'Acme Intelligence Bot',
  });
  assert.equal(settings.recording.autoRecordMode, 'all');
  assert.equal(settings.recording.consentPreference, 'required');
  assert.equal(settings.recording.botDisplayName, 'Acme Intelligence Bot');

  // 2. Update Summaries Settings
  settings = settingsService.updateSummarySettings(settings, {
    defaultTemplate: 'executive',
    autoExtractActions: false,
  });
  assert.equal(settings.summaries.defaultTemplate, 'executive');
  assert.equal(settings.summaries.autoExtractActions, false);

  // 3. Update Sharing Settings
  settings = settingsService.updateSharingSettings(settings, {
    defaultVisibility: 'private',
  });
  assert.equal(settings.sharing.defaultVisibility, 'private');

  // 4. Highlight Types: Add, Edit, Reorder, Delete
  settings = settingsService.addHighlightType(settings, 'Risk & Blockers', '#EF4444');
  assert.equal(settings.highlights.types.length, 5);
  const newType = settings.highlights.types[4];
  assert.equal(newType.name, 'Risk & Blockers');
  assert.equal(newType.color, '#EF4444');

  // Edit
  settings = settingsService.updateHighlightType(settings, newType.id, 'Critical Blockers', '#DC2626');
  assert.equal(settings.highlights.types.find(t => t.id === newType.id).name, 'Critical Blockers');

  // Reorder up
  settings = settingsService.reorderHighlightTypes(settings, newType.id, 'up');
  assert.equal(settings.highlights.types[3].id, newType.id);

  // Delete
  settings = settingsService.deleteHighlightType(settings, newType.id);
  assert.equal(settings.highlights.types.length, 4);
});

test('upcoming meetings: supports provider metadata and toggles notetaker arming', () => {
  assert.equal(initialUpcoming.length, 3);
  assert.ok(initialUpcoming.some(m => m.provider === 'zoom'));
  assert.ok(initialUpcoming.some(m => m.provider === 'google_meet'));
  assert.ok(initialUpcoming.some(m => m.provider === 'teams'));

  // Provider label formatting
  const zoomLabel = upcomingService.formatProviderLabel('zoom');
  assert.equal(zoomLabel.label, 'Zoom');

  const meetLabel = upcomingService.formatProviderLabel('google_meet');
  assert.equal(meetLabel.label, 'Google Meet');

  // Toggle notetaker
  const first = initialUpcoming[0];
  const toggled = upcomingService.toggleUpcomingNotetaker(initialUpcoming, first.id);
  assert.equal(toggled.find(m => m.id === first.id).notetakerEnabled, !first.notetakerEnabled);
});

test('team calls: resolves meeting owners, visibility, and teammate filters', () => {
  assert.equal(teamService.TEAM_MEMBERS.length, 5);

  // Owner resolution
  const prodOwner = teamService.getMeetingOwner('m_prod_strategy');
  assert.equal(prodOwner.name, 'Alex Rivera');

  const engOwner = teamService.getMeetingOwner('m_eng_standup');
  assert.equal(engOwner.name, 'Sarah Chen');

  // Default visibility
  assert.equal(teamService.getDefaultMeetingVisibility('m_prod_strategy'), 'team');
  assert.equal(teamService.getDefaultMeetingVisibility('m_acme_onboarding'), 'personal');

  // Teammate filtering
  const allTeamCalls = teamService.filterMeetingsByTeammate(meetings, 'All', {});
  assert.ok(allTeamCalls.length >= 4);
  assert.ok(!allTeamCalls.some(m => m.id === 'm_acme_onboarding'));

  const sarahCalls = teamService.filterMeetingsByTeammate(meetings, 'Sarah Chen', {});
  assert.ok(sarahCalls.length >= 2);
  assert.ok(sarahCalls.some(m => m.id === 'm_eng_standup'));

  // Toggle visibility of m_acme_onboarding to "team"
  const visibilities = { m_acme_onboarding: 'team' };
  const updatedTeamCalls = teamService.filterMeetingsByTeammate(meetings, 'All', visibilities);
  assert.ok(updatedTeamCalls.some(m => m.id === 'm_acme_onboarding'));
});
