# Final engineering audit

Audit date: 2026-09-21. Scope: hardening and submission preparation of the existing application; no product rebuild or new backend.

## Deployment

- Public demo: https://fathom-meeting-intelligence.vercel.app
- Repository: https://github.com/SoorejS/fathom-meeting-intelligence
- Verified production deployment: `dpl_5v7TmtdLPxNfaFYugahJDqjVg6tH` (Vercel READY).
- Static export hosted on Vercel, independent of the developer PC. No environment variables configured or needed.
- An anonymous HTTP request without cookies/authentication returned HTTP 200 with dashboard content. The timestamp share URL also returned HTTP 200.
- The first deployment failed because the Next.js framework adapter expected server manifests. Setting the Vercel framework preset to Other (`framework: null`) and serving `out/` resolved the mismatch, preserving static export.

## Build and automated checks

- `npm run build`: PASS, exit 0; TypeScript and static generation completed. Routes `/` and `/_not-found` exported.
- `npm run lint`: PASS, exit 0, no warnings/errors on the final application revision.
- `npm test`: PASS, 2 tests. Assertions cover all six distinct meetings, transcript speakers, action owners, action/highlight/Q&A timestamps, every prepared question, unsupported questions, and cross-meeting answer isolation.
- Dependency installation audit: 427 packages, zero reported vulnerabilities.
- `npm start -- --listen 3100`: production static output served successfully. The default port 3000 was occupied by the existing dev server; the additional listener was used for inspection.
- This workstation's npm shim was broken. Commands were run through the npm installation bundled with Node.js; no repository workaround or machine-specific npm path is needed by reviewers.

## Browser verification

Public tests used fresh Codex in-app browser tabs visiting the public origin for the first time, without local-development cookies, application state, or a Vercel browser login. This was a clean unauthenticated browser test, not a separately launched Chrome Incognito window. The app neither requires authentication nor uses persistent browser storage.

| Workflow | Observed result |
| --- | --- |
| Dashboard | Six seeded meetings visible; all six thumbnail images loaded. |
| Global search | Roadmap: 6 matches; Sarah: 13; retention: 6; quota: 1. Results covered titles/participants, summaries, transcripts, and action items. |
| Search navigation | Marcus Vance at 00:45 opened the Product meeting with playback at 45 seconds. |
| Player | Play advanced from 45 to 57 seconds; Pause stopped it. Keyboard Home/Right sought to 10 seconds. Speed control cycled through 1x, 1.25x, 1.5x, and 2x. Playback is explicitly a simulation. |
| Summaries | Enhanced, Executive Brief, Sales & Deals, and Engineering Spec rendered; template content changed. |
| Transcript | Ten Product-meeting utterances rendered; clicking the launch segment sought to 410 seconds. |
| Actions | Completing an open action changed the counter from 2/4 to 3/4. |
| Highlights | Clicking the transcript-search-latency highlight sought to 155 seconds. |
| Ask Fathom | Launch quick question returned the prepared Product answer; its 06:50 citation sought to 410 seconds. |
| Meeting isolation | Acme's client-concerns question returned its own cited answer. Asking Acme about Marcus's retention data returned an unsupported-question response. |
| Sharing | Current time displayed as 06:50; enabling timestamp and Copy Link placed the correct public URL in the browser clipboard. A separate recipient tab opened the Product meeting at 410 seconds. |
| Return/navigation | My Calls returned to all six meetings. Team Calls showed Product and Engineering; Playlists rendered two entries; Alerts and Deals showed deliberate scope explanations and a working return control. |
| Responsive layout | Desktop inspected at 1440px and 1280px. Public mobile dashboard/detail inspected at 390px; document width matched the viewport without horizontal page overflow. |
| Runtime | No warning/error console entries in the audited public meeting flows; no sign-in, hydration-error, or development-debug interface appeared. |

Local browser testing also exercised the same core flow before public deployment, including unsupported general questions and copied share links.

## Important fixes

- Replaced nonexistent `/share/...` destinations with working query-based meeting/timestamp links, including URL initialization and browser navigation.
- Passed the actual player time into sharing; wait for clipboard success and report failures honestly.
- Reset meeting-scoped view state when navigating between meetings/timestamps.
- Replaced arbitrary/generic AI fallback responses with conservative meeting-scoped retrieval and explicit unsupported answers; made quick questions match available answers.
- Removed an unsupported 62% memory-reduction claim and a claimed interview decision absent from the transcript excerpt.
- Derived dashboard answers from seeded data instead of unrelated hard-coded claims.
- Connected secondary navigation to actual views and honest empty states; corrected misleading integration/status messages.
- Fixed mobile header clipping, navigation overlap, and playback-control wrapping; added keyboard seeking and visible focus outlines.
- Removed duplicate summary-copy control so copying respects the selected template. Fixed the fullscreen handler, which previously toggled playback.
- Fixed lint failures, removed unused imports, and provided a static-export-compatible production preview command.
- Replaced tunnel URLs in reviewer documentation with the persistent deployment URL.

## Capture integrity and inherited discrepancy

- `.agent-logs/`, `.agents/`, `.codex/`, and `CAPTURE-TEST.md` remain present and tracked. Logs are not ignored. No capture hooks were disabled, and no historical commit was rewritten or squashed.
- Both Codex canary files retain their exact SHA-256 values recorded in `CAPTURE-TEST.md`: `c81c70d3763a07055cd476421b21e99306c9ad14aea4514824a9a8e3d94a746f` and `5a85d7964c2d1ef90649c26a721e807c436bc348218d7a6f9f48ceba213adfe2`.
- At takeover, the Antigravity working-tree log already replaced response 6 compared with commit `3430ac8`. During this audit, another process committed `ee82475` and the same response changed again. These changes were observed, not authored by this Codex audit. Existing Git versions are retained; the current log is not cleaned or rewritten to hide them.
- Consequently, the historical Antigravity record cannot honestly be certified as append-only. This is a documented evidence limitation, not a reason to delete or reconstruct any entry.
- Original local-path references inside historical capture artifacts remain verbatim. The public README contains no private machine paths or temporary tunnel URLs.

## Repository hygiene

Reference screenshots, dependencies, build output, local environments, Vercel account/project metadata, IDE folders, and local recordings are excluded. No reference screenshot files were modified. The final Git audit checks that none of those directories are tracked and that the capture evidence is committed.

## Known limitations

- Playback simulates a timeline and speaker visualization; no recorded audio/video or live recording bot.
- Six fictional meetings contain selected transcript excerpts rather than complete recordings.
- Actions/highlights persist only within the current page session. Shared links identify seeded meeting content and timestamp, not another user's ephemeral edits.
- Ask Fathom uses prepared answers and conservative matching; unsupported questions are declined.
- Unsplash photos require external network availability; core meeting data does not.
- Calendar/CRM/enterprise integrations, billing, authentication, full settings/admin, and custom summary editing remain out of scope.
- Historical Antigravity capture discrepancy noted above; Codex reboot/relaunch-hook behavior was not independently retested during this engineering pass.

## Final repository checks

The screenshot directory is ignored and absent from both the tracked-file list and Git path history. `.next/`, `out/`, `node_modules/`, `.vercel/`, and local environment files are not tracked. Required capture files and source/manifests are tracked. The obsolete tunnel helper was removed from the current checkout; all commits containing it remain in history. Git's whitespace check reports CRLF/trailing-whitespace in the inherited Antigravity log; those bytes were deliberately not cleaned.

The public README and deployment URL file were checked for private local paths and temporary tunnel links; none remain. Historical capture artifacts are excluded from that cleanup requirement and remain verbatim.
