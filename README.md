# Fathom-inspired Meeting Intelligence

## Overview

A meeting-intelligence demo that turns six realistic seeded conversations into searchable transcripts, structured summaries, action items, highlights, and grounded questions and answers. Open any meeting from the dashboard, or use Start Test Call to record a consented browser microphone test (with a clearly labeled simulated fallback) and generate a new meeting without signing in.

## Live Demo

[Open the public demo](https://fathom-meeting-intelligence.vercel.app)

[Source repository](https://github.com/SoorejS/fathom-meeting-intelligence)

Hosted as a static export on Vercel. The demo does not depend on a developer workstation or a tunnel.

## Stack

Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, and Lucide icons. Node.js 24 is used for builds. No database, API key, or environment variables are required.

## Architecture

- [MeetingWorkspace](src/components/MeetingWorkspace.tsx) coordinates the existing dashboard and detail views. [useMeetingStore](src/lib/useMeetingStore.ts) shares a versioned localStorage state between the dashboard and public share routes; saved data is validated before applying it to the seeds and generated test calls.
- [CaptureEngine](src/lib/captureEngine.ts) coordinates consent, recording, interruption recovery, and deterministic processing. Meeting metadata and preferences use localStorage; microphone blobs use IndexedDB and never leave the browser.
- [Share routes](src/app/share/[meetingId]/page.tsx) are generated for all six meetings at build time. `/share/m_prod_strategy?t=155` opens the product meeting at 02:35 without authentication. `/share/test` reconstructs generated scenario notes from validated URL-fragment metadata; audio is never embedded.
- [src/components](src/components) contains the dashboard, playback simulator, transcript, summaries, action items, highlights, search, sharing, and Ask Fathom views.
- [src/data/seededMeetings.ts](src/data/seededMeetings.ts) supplies typed meeting records to every view; [src/types/meeting.ts](src/types/meeting.ts) defines their relationships.
- [src/lib/meetingAnswers.ts](src/lib/meetingAnswers.ts) ranks transcript excerpts, notes, actions, highlights, and participant metadata from the selected meeting. Unsupported questions receive an explicit fallback instead of invented facts.
- Next.js builds static files into `out/`. [vercel.json](vercel.json) serves that export using Vercel's static framework preset.

## Core workflows

1. **Meetings dashboard:** Start with six meetings, filter by category or keyword, and sort by date or duration. Team Calls filters by teammate and local visibility. Upcoming presents seeded calendar events and launches the consented test-call flow. Playlists curate highlights into a timed, simulated reel; Trackers scan real transcript excerpts and open their timestamps. Settings persist locally, including the default summary template. Help provides FAQs and explicitly simulated feedback/support. Deals remains a scoped demo.
2. **Transcript and playback:** Play/pause locally recorded microphone audio when available, or the explicitly simulated timeline, seek with the scrubber or arrow keys, skip ten seconds, and cycle speeds from 1x to 2x. Transcript segments and timestamps seek the same clock and update the active speaker.
3. **Summaries:** Switch between Enhanced, Executive Brief, Sales & Deals, and Engineering Spec. Each presents a different structured view of the same meeting facts. Selection persists per meeting; copying includes the displayed key points.
4. **Action items:** Review owners and due dates, mark items complete, and jump to the source timestamp.
5. **Highlights:** Create highlights from transcript segments using any of the four types; they appear in the list, timeline, and global search. Change the type or remove your own highlights.
6. **Ask Fathom:** Ask about decisions, action owners, concerns, a named speaker, or a timestamp. Deterministic retrieval returns excerpts and note extracts with clickable sources; unsupported topics receive an explicit fallback. The dashboard overview derives answers from seeded records.
7. **Global search:** Open the header search or press Ctrl/Cmd+K. Search titles, participants, dates, all summary templates, transcript text, action items, highlights (including your new highlights), playlists, and trackers. Filter result types, navigate with the keyboard, and open the exact entity or matching moment.
8. **Sharing:** Copy a meeting URL, optionally including the current timestamp. Recipients can open it without an account. Clipboard failures produce a manual-copy fallback. Seeded meeting links use the public deployment and work without saved browser data. Invalid links show a recovery page; malformed or out-of-range timestamps show a notice and start at 00:00.

9. **Test capture:** Start Test Call → join → explicitly approve or decline → watch the recording clock → End Meeting → processing → open the new call. Microphone denial, unsupported capture, empty audio, and early stops still produce usable scenario notes. A remembered permission choice never bypasses fresh approval.

## Seeded data

The demo opens populated with product strategy, Acme onboarding, engineering incident review, a FinTech sales demo, Maya Lin's technical interview, and HealthSync customer feedback. All speakers, action owners, highlights, and Q&A citation timestamps reference the selected meeting's data.

These are fictional demo records with selected transcript excerpts, not complete recordings. Meeting durations are simulated. Action completion, created highlights, highlight types, and summary-template selection survive refresh in this browser. Personal edits are not synchronized across devices: share links expose the original seeded meeting and optional playback position. If browser storage is blocked or full, a visible warning explains that edits can only last for the page session. Photos load from Unsplash; meeting intelligence is bundled locally and needs no external API.

## Capture decision

The external conferencing bot is intentionally stubbed, as permitted by the assignment. The interactive test-call lifecycle uses real browser microphone capture through MediaRecorder when permission and browser support allow it. Audio stays in IndexedDB and can be played or downloaded locally. Simulated capture is available explicitly and as a fallback.

Transcripts and intelligence are deterministic release-readiness scenario notes, not speech recognition. Only cues reached on the actual recording clock are included; stopping early never invents later actions. Reloading interrupts capture safely and offers processing recovery. Generated meetings, action completion, highlights, and templates survive refresh. Shared test-call links contain title, date, duration, and scenario metadata, but neither audio nor personal edits. Clearing browser storage removes local recordings and edits.

This product decision is separate from required **agent prompt/response capture**, retained in [.agent-logs](.agent-logs/), [.agents](.agents/), [.codex](.codex/), and [CAPTURE-TEST.md](CAPTURE-TEST.md).

## Product decisions

Prioritized a populated first visit, fast client-side search, one playback clock, grounded answers, working share URLs, responsive layouts, and deployment without credentials or local services. Kept the existing component architecture and visual direction. The final pass fixed concrete failures rather than adding a new backend or redesigning the product.

## Deliberately excluded

External meeting bots, system/video capture, live transcription, calendar integrations, CRM and enterprise integrations, billing, authentication, persistent multi-user storage, and a full admin/settings system. Retrieval is deterministic and extractive, with limited keyword matching rather than unrestricted natural-language reasoning; no external LLM is called. Secondary demo controls explain their scope instead of claiming live integrations are connected.

## Local development

Use Node.js 24 and npm:

```bash
git clone https://github.com/SoorejS/fathom-meeting-intelligence.git
cd fathom-meeting-intelligence
npm ci
npm run dev
```

Open the local address printed by the development server.

```bash
npm run lint
npm test
npm run build
npm start
```

`npm start` serves the static export from `out/` on port 3000; stop the dev server first if it uses that port. To publish a revision after signing in to Vercel, run `npx vercel --prod`. Local Vercel project IDs and credentials are excluded from Git.

## Verification

See [FINAL-AUDIT.md](FINAL-AUDIT.md) for final build, browser checks, deployment evidence, and known limitations. Regression tests check all six meetings' participant/citation relationships, retrieval isolation and unsupported queries, named-speaker attribution, and storage round-trips/corruption recovery. See [FUNCTIONAL-DEPTH-AUDIT.md](FUNCTIONAL-DEPTH-AUDIT.md) for the subsequent persistence, retrieval, and public share-route pass.

See [CAPTURE-LIFECYCLE-AUDIT.md](CAPTURE-LIFECYCLE-AUDIT.md) for the interactive capture implementation and its verification limits.

The focused integrity regression suite additionally checks search coverage and entity IDs, public share timestamps, saved playlist order and membership, settings recovery, and deletion without reseeding removed objects. The existing versioned browser stores remain in use; custom workspace links require the same browser, while seeded meeting share links are public.

See [WALKTHROUGH-VERIFICATION.md](WALKTHROUGH-VERIFICATION.md) for the final Tier 2 regression pass, public browser checks, mobile checks, and remaining demo limitations.

## Agent capture integrity

The native Codex canaries belong to two different full session IDs, documented in [CAPTURE-TEST.md](CAPTURE-TEST.md). Original logs and all development commits are retained. The final audit also documents an inherited Antigravity response discrepancy; no claim is made that the earlier capture history was perfectly append-only. Historical log content is preserved verbatim, including original links. Reference screenshots and generated local build/deployment artifacts are excluded from the repository.
