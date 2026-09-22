const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');
const { SEEDED_MEETINGS: meetings } = load('src/data/seededMeetings.ts');
const { SEEDED_PLAYLISTS: playlists } = load('src/data/seededPlaylists.ts');
const { SEEDED_TRACKERS: trackers } = load('src/data/seededTrackers.ts');
const { searchWorkspace } = load('src/lib/workspaceSearch.ts');
const { meetingShareUrl, readPlaybackTimestamp, PUBLIC_APP_URL } = load('src/lib/shareLinks.ts');
const { decodeTier2State, defaultTier2State } = load('src/lib/workspaceStorage.ts');
const { decodeState, applySavedState, emptyState } = load('src/lib/meetingStorage.ts');
const pl = load('src/services/playlistService.ts');
const tr = load('src/services/trackerService.ts');
const settings = load('src/services/settingsService.ts');
const json = value => JSON.parse(JSON.stringify(value));

test('search covers dates, participants and every intelligence category with source context', () => {
  for (const m of meetings) {
    for (const query of [m.title, m.date, m.dateFormatted, m.participants[0].name]) {
      assert.ok(searchWorkspace(query, meetings).some(r => r.type === 'meeting' && r.meetingId === m.id), query);
    }
    const cases = [
      ['summary', m.summary.executive.overview], ['transcript', m.transcript[1].text],
      ['actionItem', m.actionItems[0].text], ['highlight', m.highlights[0].text],
    ];
    for (const [type, query] of cases) {
      const r = searchWorkspace(query, meetings).find(r => r.type === type && r.meetingId === m.id);
      assert.ok(r, type); assert.equal(r.meetingTitle, m.title); assert.ok(r.snippet);
      if (type !== 'summary') assert.ok(m.transcript.some(t => t.timestamp === r.timestamp && t.timestampFormatted === r.timestampFormatted));
    }
  }
  for (const p of playlists) assert.equal(searchWorkspace(p.title, meetings, playlists, trackers).find(r => r.type === 'playlist').entityId, p.id);
  for (const t of trackers) assert.equal(searchWorkspace(t.name, meetings, playlists, trackers).find(r => r.type === 'tracker').entityId, t.id);
  assert.deepEqual(searchWorkspace('  ', meetings, playlists, trackers), []);
  assert.deepEqual(searchWorkspace('not-a-real-workspace-term-908721', meetings, playlists, trackers), []);
  assert.doesNotThrow(() => searchWorkspace('[', meetings, playlists, trackers));
});

test('search and playlists reflect persisted highlight edits, deletion and action completion', () => {
  const immutable = JSON.stringify(meetings), m = meetings[0], segment = m.transcript[1];
  const state = emptyState();
  state.meetings[m.id] = { statuses: {[m.actionItems[0].id]:'completed'}, highlights: [{
    id:'integrity-highlight', meetingId:m.id, timestamp:segment.timestamp,
    timestampFormatted:segment.timestampFormatted, type:'Feedback', text:'Integrity review marker', creator:'You',
  }] };
  let current = applySavedState(meetings, decodeState(JSON.stringify(state), meetings));
  let playlist = pl.addHighlightToPlaylist(pl.createPlaylist('Integrity reel'), m.id, 'integrity-highlight');
  assert.equal(searchWorkspace('Integrity review marker', current)[0].timestamp, segment.timestamp);
  assert.equal(pl.resolvePlaylistClips(playlist, current)[0].highlightType, 'Feedback');
  assert.match(searchWorkspace(m.actionItems[0].text, current).find(r => r.type === 'actionItem').snippet, /completed/);
  state.meetings[m.id].highlights[0].type = 'Needs Review';
  current = applySavedState(meetings, decodeState(JSON.stringify(state), meetings));
  assert.equal(pl.resolvePlaylistClips(playlist, current)[0].highlightType, 'Needs Review');
  state.meetings[m.id].highlights = [];
  state.meetings[m.id].statuses[m.actionItems[0].id] = 'open';
  current = applySavedState(meetings, decodeState(JSON.stringify(state), meetings));
  assert.equal(searchWorkspace('Integrity review marker', current).length, 0);
  assert.equal(pl.resolvePlaylistClips(playlist, current).length, 0);
  assert.match(searchWorkspace(m.actionItems[0].text, current).find(r => r.type === 'actionItem').snippet, /open/);
  assert.equal(JSON.stringify(meetings), immutable);
});

test('public share links identify bundled meetings and validate absent, valid and malformed times', () => {
  for (const m of meetings) {
    const plain = new URL(meetingShareUrl(m));
    assert.equal(plain.origin, PUBLIC_APP_URL); assert.equal(plain.pathname, '/share/' + m.id); assert.equal(plain.search, '');
    const timed = new URL(meetingShareUrl(m, m.transcript[1].timestamp));
    assert.equal(readPlaybackTimestamp(timed.searchParams.get('t'), m.duration).seconds, m.transcript[1].timestamp);
  }
  assert.deepEqual(readPlaybackTimestamp(null, 100), {seconds:0, invalid:false});
  assert.deepEqual(readPlaybackTimestamp('0', 100), {seconds:0, invalid:false});
  assert.deepEqual(readPlaybackTimestamp('99.8', 100), {seconds:99, invalid:false});
  for (const value of ['', '-1', 'NaN', 'Infinity', '00:35', '1e2', '1000', '0x10', ' 2 ']) {
    assert.deepEqual(readPlaybackTimestamp(value, 100), {seconds:0, invalid:true}, value);
  }
});

test('workspace reload retains edited records, order, settings and Notetaker preferences without mutating seeds', () => {
  const before = JSON.stringify({playlists, trackers, defaults:defaultTier2State()});
  const state = defaultTier2State();
  let reel = pl.createPlaylist('Integrity custom');
  reel = pl.addHighlightToPlaylist(reel, meetings[0].id, meetings[0].highlights[0].id);
  reel = pl.addHighlightToPlaylist(reel, meetings[1].id, meetings[1].highlights[0].id);
  reel = pl.reorderClips(reel, reel.items[0].id, 'down');
  reel = pl.renamePlaylist(reel, 'Integrity renamed');
  state.playlists = [reel];
  state.trackers = [tr.updateTracker(tr.createTracker('Integrity tracker', ['latency']), {enabled:false, keywords:['search'], meetingScope:[meetings[0].id]})];
  state.settings = settings.updateRecordingSettings(state.settings, {botDisplayName:'Integrity Bot', autoRecordMode:'manual', consentPreference:'required'});
  state.settings = settings.updateSummarySettings(state.settings, {defaultTemplate:'engineering', autoExtractActions:false});
  state.settings = settings.updateSharingSettings(state.settings, {defaultVisibility:'private'});
  state.settings = settings.addHighlightType(state.settings, 'Integrity type');
  state.upcomingMeetings = state.upcomingMeetings.map(m => ({...m, notetakerEnabled:false}));
  state.visibilities = {[meetings[0].id]:'personal'};
  assert.deepEqual(json(decodeTier2State(JSON.stringify(state))), json(state));
  state.playlists = []; state.trackers = [];
  state.settings = settings.deleteHighlightType(state.settings, state.settings.highlights.types.at(-1).id);
  const restored = decodeTier2State(JSON.stringify(state));
  assert.deepEqual(restored.playlists, []); assert.deepEqual(restored.trackers, []);
  assert.equal(restored.settings.highlights.types.some(t => t.name === 'Integrity type'), false);
  assert.equal(JSON.stringify({playlists, trackers, defaults:defaultTier2State()}), before);
});

test('corrupted, partial and old workspace storage recover without crashing or resurrecting deleted lists', () => {
  for (const raw of ['{broken', 'null', '[]', '{"version":0}', '{"version":99}']) assert.deepEqual(decodeTier2State(raw), defaultTier2State());
  const restored = decodeTier2State(JSON.stringify({version:1, playlists:[null, {id:'bad',items:[null]}], trackers:[{id:'bad',keywords:null}], settings:{recording:{botDisplayName:'Retain me'}, summaries:{defaultTemplate:'invalid'}, highlights:{types:[null]}}, upcomingMeetings:[null], visibilities:{a:'invalid', b:'team'}}));
  assert.deepEqual(restored.playlists, []); assert.deepEqual(restored.trackers, []);
  assert.equal(restored.settings.recording.botDisplayName, 'Retain me');
  assert.equal(restored.settings.summaries.defaultTemplate, 'default');
  assert.equal(restored.settings.sharing.defaultVisibility, 'team');
  assert.deepEqual(restored.visibilities, {b:'team'});
  assert.deepEqual(restored.upcomingMeetings, defaultTier2State().upcomingMeetings);
  assert.doesNotThrow(() => searchWorkspace('test', meetings, restored.playlists, restored.trackers));
});
