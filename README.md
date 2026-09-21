# Fathom-inspired Meeting Intelligence

## Overview

A meeting-intelligence demo that turns six realistic seeded conversations into searchable transcripts, structured summaries, action items, highlights, and grounded questions and answers. Open any meeting from the dashboard to explore the complete workflow without signing in.

## Live Demo

[Open the public demo](https://fathom-meeting-intelligence.vercel.app)

[Source repository](https://github.com/SoorejS/fathom-meeting-intelligence)

Hosted as a static export on Vercel. The demo does not depend on a developer workstation or a tunnel.

## Stack

Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, and Lucide icons. Node.js 24 is used for builds. No database, API key, or environment variables are required.

## Architecture

- [src/app/page.tsx](src/app/page.tsx) coordinates dashboard navigation and session-local meeting state. Meeting IDs and optional timestamps live in URL query parameters so copied links open correctly after a reload.
- [src/components](src/components) contains the dashboard, playback simulator, transcript, summaries, action items, highlights, search, sharing, and Ask Fathom views.
- [src/data/seededMeetings.ts](src/data/seededMeetings.ts) supplies typed meeting records to every view; [src/types/meeting.ts](src/types/meeting.ts) defines their relationships.
- [src/lib/meetingAnswers.ts](src/lib/meetingAnswers.ts) retrieves prepared answers only from the selected meeting. Unsupported questions receive an explicit fallback instead of invented facts.
- Next.js builds static files into `out/`. [vercel.json](vercel.json) serves that export using Vercel's static framework preset.

## Core workflows

1. **Meetings dashboard:** Browse six meetings, filter by category or keyword, and sort by date or duration. Team Calls and two seeded playlist entry points provide alternate navigation. Alerts and Deals explicitly describe their demo scope.
2. **Transcript and playback:** Play/pause the simulated timeline, seek with the scrubber or arrow keys, skip ten seconds, and cycle speeds from 1x to 2x. Transcript segments and timestamps seek the same clock and update the active speaker.
3. **Summaries:** Switch between Enhanced, Executive Brief, Sales & Deals, and Engineering Spec; copy the selected template.
4. **Action items:** Review owners and due dates, mark items complete, and jump to the source timestamp.
5. **Highlights:** Jump to categorized moments or create a highlight from a transcript segment.
6. **Ask Fathom:** Use meeting-specific quick questions or similar wording to retrieve prepared answers with clickable transcript citations. The dashboard overview derives answers from seeded records.
7. **Global search:** Open the header search or press Ctrl/Cmd+K. Search titles, participants, default summary overviews/key points, transcript text, and action items; filter result types and open matching moments.
8. **Sharing:** Copy a meeting URL, optionally including the current timestamp. Recipients can open it without an account. Clipboard failures produce a manual-copy fallback.

## Seeded data

The demo opens populated with product strategy, Acme onboarding, engineering incident review, a FinTech sales demo, Maya Lin's technical interview, and HealthSync customer feedback. All speakers, action owners, highlights, and Q&A citation timestamps reference the selected meeting's data.

These are fictional demo records with selected transcript excerpts, not complete recordings. Meeting durations are simulated. Action/highlight changes last for the current page session and reset on reload. Photos load from Unsplash; meeting intelligence is bundled locally and needs no external API.

## Capture decision

The actual recording/capture layer was intentionally stubbed, as permitted by the assignment. Playback is a controllable timeline and speaker visualization, without recorded audio/video. Effort focused on the meeting-intelligence experience: finding information, understanding decisions, following citations, and acting on commitments.

This product decision is separate from required **agent prompt/response capture**, retained in [.agent-logs](.agent-logs/), [.agents](.agents/), [.codex](.codex/), and [CAPTURE-TEST.md](CAPTURE-TEST.md).

## Product decisions

Prioritized a populated first visit, fast client-side search, one playback clock, grounded answers, working share URLs, responsive layouts, and deployment without credentials or local services. Kept the existing component architecture and visual direction. The final pass fixed concrete failures rather than adding a new backend or redesigning the product.

## Deliberately excluded

Real meeting bots and capture, live transcription, calendar integrations, CRM and enterprise integrations, billing, authentication, persistent multi-user storage, and a full admin/settings system. Prepared Q&A does not provide unrestricted natural-language reasoning. Secondary demo controls explain their scope instead of claiming live integrations are connected.

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

See [FINAL-AUDIT.md](FINAL-AUDIT.md) for final build, browser checks, deployment evidence, and known limitations. Regression tests check all six meetings' participant/citation relationships and meeting-scoped answer retrieval.

## Agent capture integrity

The native Codex canaries belong to two different full session IDs, documented in [CAPTURE-TEST.md](CAPTURE-TEST.md). Original logs and all development commits are retained. The final audit also documents an inherited Antigravity response discrepancy; no claim is made that the earlier capture history was perfectly append-only. Historical log content is preserved verbatim, including original links. Reference screenshots and generated local build/deployment artifacts are excluded from the repository.
