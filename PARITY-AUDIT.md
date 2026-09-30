# Relay functional integration

Reference: `Fathom-submission-2026-09-22_11-12-40.zip` (Downloads), extracted only into ignored `artifacts/parity-reference/`. Historical captures are not modified.

## Source inventory and mapping

| ZIP implementation | Behavior to preserve | Relay surface / status |
| --- | --- | --- |
| MeetingsDashboard, seededMeetings | Six examples, generated calls, title/person/summary/category filtering, date grouping, newest/duration ordering, overview questions | Sessions / Overview; integrated |
| MeetingPlayer, useLocalAudio, localRecording | Shared playback clock, restart, seek/skip, speed 1/1.25/1.5/2, mute, fullscreen, moment markers, local audio playback/download, error feedback | Session listening bar; integrated |
| TranscriptView | Speaker/time rendering, active line and scrolling, text/speaker search, segment navigation, create highlight at source | Conversation; integrated |
| SummaryView / meetingStorage | Four actual variants, copy/reset, per-session selection, default for unselected sessions | Brief / Preferences; integrated |
| ActionItemsView | Add text/owner/due date, filter all/open/completed, complete/reopen, counts and source timestamps | Follow-through / Action desk; integrated |
| HighlightsView | Add/edit/delete, custom labels, source seek, add to playlist | Moments; integrated |
| meetingAnswers / AskAiView | Session-scoped deterministic retrieval, decisions/actions/risks, named speakers, evidence, unsupported question fallback | Ask this session; existing API uses same retrieval |
| workspaceSearch / GlobalSearchModal | All summary variants, dates, people, transcripts, actions, moments, collections/signals, category filters, keyboard and entity navigation | Find the thread; integrated |
| ShareModal / shareLinks / share routes | Copy with fallback, optional timestamp, public playback, malformed/missing recovery | Existing token-backed public shares retained; integrated |
| playlistService / PlaylistsView | Create/rename/description/delete, deduplicated add/remove/reorder, source navigation, entity URL/copy, 15-second bounded simulated reel with pause/previous/next | Collections; integrated |
| trackerService / TrackersView | Create/edit/delete/toggle, deduplicated keywords, scoped matching, filters, source navigation | Signals; integrated |
| seededUpcoming / upcomingService | Three provider examples, participants, duration/date, arm/disarm, simulated join and consented test-call launch | Sessions / Capture studio; integrated |
| teamService / TeamCallsView | Owner/attendee filter, team/personal library visibility | Sessions; integrated |
| settingsService / SettingsModal | Summary default; label name/color/order CRUD; capture/sharing preferences | Preferences; integrated |
| supportAnswers / HelpFeedbackModal | Searchable FAQ, grounded help answers, feedback/rating form, demo support reference | Quick guide; integrated |
| captureEngine / TestCallPanel / FloatingNotetaker | Join/approve/decline/remember, microphone/fallback/timeout, clock/cues, draggable/minimized recorder, early stop, processing/retry/recovery, generated call, idempotence, cleanup | Existing Relay capture lifecycle retained |
| testCallMeeting | Single release-readiness scenario, two people, targets 30/60/120/300 seconds; only elapsed cues included | Existing generator retained; no 8-person/hour-long scenario exists in ZIP |
| tests (six suites) | Retrieval, storage corruption, capture races, audio, clip order, tracker matching, settings and visibility | 34 regression tests retained; original and expanded API checks added |

## Explicit source limitations

The ZIP contains no API, external LLM, real conferencing/calendar integration, speech recognition, authentication or permission enforcement. Its recording policy, bot name, automatic action extraction and sharing-access settings were stored preferences, with these limitations stated in the UI. Its support/feedback submission was simulated. Its core persistence was browser-local; this integration uses Postgres. No transcript density setting or active-call manual highlight creation was implemented in the ZIP; new work must not claim these were recovered capabilities.

## Verification

Verified September 30, 2026 against the integrated source, a running local Next.js application, and the configured Neon database:

- `npm test`: 34/34 passed. Tests cover consent/decline, timing, early stop, microphone races, final audio chunk/track cleanup, interrupted recovery, persistence failure/retry, retrieval, search, collection lifecycle, signal matching, preferences, team visibility and themes.
- `npm run lint`: passed without errors or warnings.
- `npm run build`: passed, including TypeScript and route generation.
- `npm run test:api`: passed; direct SQL checks confirm capture idempotence, saved action/moment edits, search, shares, collection order, signals, grounded answers and validation.
- `npm run test:parity`: passed for preferences/overrides, action owner/due date, labels, collection rename/remove/delete/cascade, scoped/editable signals, shares, scheduled data and citations. Fixtures are removed and preferences restored in `finally`.

Browser walkthrough used DOM/accessibility inspection, not screenshots. Confirmed Sessions filters/sort/date groups; playback/pause/speed; transcript speaker search and seeking; saved Brief selection across reload; action completion/reopen; moment creation; participant/global search, category filters and Enter navigation; scoped signal matches to 00:45; collection create/add/reorder/reel/pause/next/source; copied public share at 00:45 and invalid-link recovery; preference save/reload and its changed Notetaker name in the consent prompt; searchable help and database feedback reference.

Capture walkthrough: `Relay final parity capture` (`test_a3bf1345-77fc-4b38-83e9-29d0d3f776d9`) entered through a scheduled session, required approval, ran in explicit simulation, displayed the live clock and reached cues, minimized while Sessions remained usable, restored, completed, and appeared in database search. Its token-backed public share opened at 00:15 with generated Brief/actions/Moments. The browser-created walkthrough records are intentionally retained as reviewable examples.

At 390px, the dashboard and session had document widths below the viewport, mobile navigation worked, transcript seeking remained usable, and the share dialog stayed within viewport bounds (approximately 362px wide). Light and Dark changed computed colors, Auto restored system preference, and Dark persisted across reload. No application errors were present in the inspected browser console.

## Canonical implementation and adapters

`Meeting` remains the canonical domain shape. The repository reads relational data; the API owns validation, writes, tokens and transactional capture completion. `MeetingPane` owns active playback. `captureEngine`, `testCallMeeting`, local audio storage, `workspaceSearch`, `meetingAnswers`, `scanTranscriptMatches`, `resolvePlaylistClips`, team metadata and FAQ retrieval retain the prior tested logic. Summary selection, visibility, signal scope, calendar overrides and preferences are adapted to Postgres metadata rather than browser stores.

Unused old presentation components and the competing workspace store were removed from active source. Historical local-storage decoders remain only as compatibility test fixtures. Core data has no localStorage fallback. The two old capture/audio storage key names are intentionally retained to avoid losing local recordings or recovery state; they are not visible branding. Existing fictional participants already used by Relay remain; account/workspace identity is Soorej/Relay. A read adapter translates legacy product references in stored seed text without rewriting database history.

## Limits and integrity notes

- No discovered working ZIP capability was omitted. Its nonfunctional integration previews, disabled legacy consent option, external capture, authentication and live transcription remain explicitly unsupported. There was no eight-person/hour scenario, live speech transcription or active-call manual moment control to port. Scenario-generated moments are retained; manual moments can be created from the saved Conversation.
- Microphone acquisition, final chunk handling, local audio isolation, permission failure and cleanup were verified through the retained automated tests; this pass did not record the user's physical microphone. Fullscreen and audio download controls are integrated but were not exercised with a physical recording in the browser.
- Core meeting intelligence, collections, signals, shares, capture results, preferences and scheduled examples are backed by Postgres. The metadata migration is additive and idempotent. Its DDL was checked in a rolled-back transaction before application; a separate Neon branch was not used in this pass.
- Existing serialized/static legacy share URLs are not generated by Relay; current public sharing uses saved database tokens. Local audio is never included in a share.
- No external model is configured; answers use supported excerpts and citations, with an explicit unsupported-question fallback.
- The staged Antigravity log change predates this work and replaces RESPONSE 14's timestamp/text. It is left untouched and excluded from the integration commit. All prior Git commits remain. The current Codex log's old entry block is an unchanged prefix; only new entries and metadata are added automatically.
