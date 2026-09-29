# Relay — Make the next step count

Relay is an original meeting-intelligence workspace built around what happens after a conversation: decisions, commitments, and the moments worth keeping. Its editorial layout, quiet green palette, session shelf, action desk, and conversation workspace replace the earlier Fathom reconstruction.

[Live application](https://fathom-meeting-intelligence.vercel.app/) · [Public repository](https://github.com/SoorejS/fathom-meeting-intelligence)

The existing deployment address is retained for continuity. The application is now Relay.

## Stack and architecture

Next.js 16 App Router, React 19, TypeScript, CSS/Tailwind, PostgreSQL on Neon, Postgres.js, and Zod. Vercel runs the frontend and server API; this is no longer a static export.

The browser calls `/api/*`. Route handlers validate requests and use parameterized SQL through a server-only connection. Meetings and their participant, transcript, action, and highlight records are assembled from relational tables. Collections, collection items, signals, and public share tokens also live in Postgres. There is no browser-storage fallback for application data.

- [Relay interface](src/components/relay): overview, library, action desk, meeting workspace, collections, signals, capture studio, preferences and public view.
- [API](src/app/api/[...path]/route.ts): actual request handlers used by the interface.
- [Repository](src/server/repository.ts): database reads and transactional capture persistence.
- [Schema](db/schema.sql): foreign keys, validation constraints and indexes.
- [Seed command](scripts/seed-database.ts): the original fictional domain examples are inserted into the database once. Seed modules are not imported by the active frontend.
- [Capture engine](src/lib/captureEngine.ts): retained consent, timing, interruption recovery and local-audio logic. Completion waits for a successful API save.

## Core workflow

Open a session from the shelf. Read its Brief, switch the summary lens, and explore the Conversation. Timestamps seek the playback timeline. Complete a follow-up or add one with its source time. Save and edit a Moment from a transcript excerpt. Search for the new text, then create a share link and open its read-only public view. Reloading fetches the database state again.

The Action desk combines commitments across sessions. Collections curate saved moments with persistent ordering. Signals match keywords against database-backed transcripts and link to their sources. The question panel uses extractive retrieval over the selected meeting's saved records, not canned Q&A entries or an external LLM. Unsupported questions receive an explicit no-evidence response.

## Real data and API

The initial empty database is populated by the seed command with six fictional meetings, 20 participant records, 30 selected transcript excerpts, 16 action items, and 14 highlights. These are real database rows, not claims of real customer recordings.

Implemented endpoints:

| Method | Route | Purpose |
| --- | --- | --- |
| GET / POST | `/api/meetings` | List records / persist completed test capture |
| GET | `/api/meetings/:id` | Retrieve a complete meeting |
| GET | `/api/meetings/:id/transcript` | Retrieve transcript segments |
| GET / POST | `/api/meetings/:id/action-items` | Read / create follow-ups |
| PATCH | `/api/action-items/:id` | Save completion state |
| GET / POST | `/api/meetings/:id/highlights` | Read / create moments |
| PATCH | `/api/highlights/:id` | Edit a moment |
| GET | `/api/search?q=...` | Search current database records |
| POST | `/api/meetings/:id/ask` | Retrieve grounded notes and citations |
| POST | `/api/shares` | Create a random token-backed share |
| GET | `/api/shares/:token` | Retrieve the shared meeting and starting time |
| GET / POST | `/api/playlists` | Read / create collections |
| POST | `/api/playlists/:id/items` | Add a saved highlight |
| PATCH | `/api/playlists/:id` | Reorder collection items |
| GET / POST | `/api/trackers` | Read / create keyword signals |
| PATCH | `/api/trackers/:id` | Pause / resume a signal |
| GET | `/api/trackers/matches` | Find transcript matches |
| GET | `/api/health` | Check database connectivity |

Search currently ranks and filters database-fetched records on the server, bounded to the newest 200 meetings. There is no separate stale client index. Public links store a random token and meeting foreign key; they never serialize a meeting into the URL.

## Capture decision

The capture layer remains intentionally simulated, as the assignment permits. A test session can use browser microphone audio or an explicit simulated clock. Transcripts, summaries, and actions come from the disclosed scenario cues reached on that clock; they are not speech recognition. The completed meeting is posted to the real API and inserted transactionally into Postgres. Repeating a completion is idempotent.

Microphone audio remains in IndexedDB on the recording device and is not uploaded or shared. Capture-recovery state and purely visual preferences may use localStorage; meetings and edits do not. Seed meetings use a simulated playback timeline.

## Local development

Use Node.js 24 and a PostgreSQL database:

```sh
npm ci
cp .env.example .env.local
# Set DATABASE_URL in .env.local to your PostgreSQL connection string.
npm run db:seed
npm run dev
```

The seed command creates missing tables and inserts missing examples without clearing existing data. For an empty-database verification, use a new database or Neon branch; do not reset a populated workspace.

```sh
npm test
npm run lint
npm run build
npm start
npm run test:api
```

`test:api` expects the application at port 3000 and the same database in `.env.local`. Set `VERIFY_URL` to test another deployment. It creates uniquely identified disposable fixtures, verifies API results against direct SQL reads, and cleans up only those fixtures. Unit tests also retain coverage for the original reusable domain logic; historical local-storage tests describe that legacy module, not the current application data source.

## Deployment

Set the server-only `DATABASE_URL` variable in Vercel. Select the Next.js framework preset with no static output-directory override. Run the schema/seed command against the target database before deployment, then deploy with Vercel. Never expose the connection string through a `NEXT_PUBLIC_` variable or commit local environment files.

This is an intentionally shared, publicly writable demonstration workspace containing fictional data. There is no authentication or private tenancy. Share views are read-only interfaces, not a confidentiality boundary around otherwise public demo data. Do not enter confidential information.

## Product decisions and scope

We prioritized one connected meeting-to-action workflow over integrations. The original business rules, meeting data shape, capture lifecycle, source timestamps, retrieval, and tracker logic remain useful foundations. The frontend and persistence boundary were rebuilt for the revised assignment.

Deliberately excluded: external meeting bots, OAuth/SSO, live transcription, cloud audio storage, calendars, CRM, billing, enterprise administration, and unrestricted generative AI. The current release is a small shared workspace rather than a production multi-tenant service.

## Agent capture and history

The assignment's agent-capture evidence remains in [.agent-logs](.agent-logs/), [.agents](.agents/), [.codex](.codex/), and [CAPTURE-TEST.md](CAPTURE-TEST.md). Historical logs and Git commits are preserved. Earlier audit documents describe earlier versions and remain as development evidence. Reference screenshots are excluded from Git and are no longer design specifications for Relay.
