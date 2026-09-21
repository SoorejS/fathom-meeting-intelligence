# Fathom AI — Meeting Intelligence Platform Clone

A polished, high-fidelity reproduction of **Fathom AI**, demonstrating the core meeting-intelligence workflow end-to-end: from multi-meeting dashboards and global search to synchronized audio/video playback, interactive transcripts, template-driven AI summaries, first-class action items, highlights, and conversational meeting AI ("Ask Fathom").

**Live Public Demo:** [https://f46c78820195d2.lhr.life](https://f46c78820195d2.lhr.life)  
**Agent Verification Report:** [CAPTURE-TEST.md](./CAPTURE-TEST.md)  
**Agent Session Logs:** [.agent-logs/](./.agent-logs/)

---

## 🚀 30-Second Reviewer Walkthrough

A reviewer can experience the full product workflow without setup in ~30 seconds:

1. **Meetings Dashboard:** Browse 6 realistic seeded meetings across product, client onboarding, engineering, sales, and interviews.
2. **Global Search (`Cmd+K`):** Search across meeting titles, attendee names, summary text, action items, and transcripts with deep-linking to exact timestamps.
3. **Meeting Detail Workspace:** Open any call (e.g., *Product Strategy & Q4 Roadmap Alignment*) to launch the two-column intelligence view.
4. **Playback & Scrubber:** Play/pause, adjust playback speed (1x, 1.25x, 1.5x, 2x), and scrub the timeline featuring highlight pip markers.
5. **Transcript Synchronization:** Click any timestamp in the transcript to seek the media player directly to that spoken segment.
6. **Summary Template Switcher:** Toggle between *Standard Intelligence*, *Executive Strategic Brief*, *Sales Follow-up*, and *Engineering Spec* to see the structured summary adapt in real time.
7. **Action Items:** Toggle tasks between *Open* and *Completed*, review owners/due dates, and jump to the exact moment an action was assigned.
8. **Highlights & Clips:** Browse categorized clips (*Positive Reaction*, *Needs Review*, *Feedback*) or create a new highlight from any transcript turn.
9. **Ask Fathom AI:** Ask natural questions (*"What did we decide about the launch?"*) and receive grounded answers with clickable citation timestamps.
10. **Share Interaction:** Generate a shareable link with optional timestamp anchoring and copy to clipboard.

---

## 🛠️ Architecture & Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack, Static Output Export)
- **Language:** TypeScript 5 with strict typings
- **Styling:** Tailwind CSS v4 with custom dark design tokens mirroring Fathom's professional near-black interface (`#090B0F`, `#11151F`, `#202736`, `#00D2FF` cyan accents)
- **Icons:** [Lucide React](https://lucide.dev/)
- **State Management:** React state with synchronous URL and timestamp coordination
- **Build Output:** Static HTML/CSS/JS exportable for zero-dependency edge hosting

---

## 🎯 Deliberate Scope Decisions

Per the Tier 1 assignment brief, this submission aggressively prioritizes **speed, product judgment, and UI polish** over non-essential infrastructure:

| In Scope (Fully Functional) | Deliberately Excluded (Stubbed / Mock-Backed) |
|---|---|
| Complete meeting-intelligence desktop workflow | Real-time Zoom / Google Meet recording bots |
| Realistic interactive media player with scrubber | Live WebRTC speech-to-text audio pipeline |
| Multi-template AI summary transformation | Complex multi-tenant auth / user account deletion |
| Timestamp-synchronized transcript navigation | Live Salesforce / HubSpot / Slack OAuth pipelines |
| First-class action items with state toggles | Production billing & referral payouts |
| Typed highlights (Feedback, Positive, Review) | Live calendar sync & Google Workspace permissions |
| Grounded "Ask Fathom" conversational Q&A | Heavyweight cloud RAG vector databases |
| Instant global search across all entities | Real backend user permission tiering |

---

## 📊 Seeded Meeting Data Model

The application launches with **6 internally consistent seeded meetings** covering distinct enterprise use cases:

1. **Product Strategy & Q4 Roadmap Alignment** (42:20) — Alex Rivera, Sarah Chen, Marcus Vance, Elena Rostova
2. **Enterprise Client Onboarding: Acme Corp** (30:50) — Alex Rivera, Jordan Miller, David Kim
3. **Core Platform Engineering Standup & Incident Post-Mortem** (18:40) — Sarah Chen, Dev Patel, Liam O'Connor, Priya Sharma
4. **Quarterly Sales Demo & Security Review: FinTech Global** (35:00) — Marcus Vance, Rachel Hayes, Alex Rivera
5. **Senior Frontend Lead Technical Interview: Maya Lin** (45:00) — Alex Rivera, Sarah Chen, Maya Lin
6. **Customer Feedback & NPS Discovery: HealthSync** (27:00) — Alex Rivera, Dr. Aris Thorne, Elena Rostova

### Internal Consistency Guarantee:
- Every speaker in the transcript exists in the meeting's participant metadata with corresponding roles and avatars.
- Action items are assigned to real participants and cite exact transcript timestamps where commitments occurred.
- Highlights correspond to specific timestamps on the playback scrubber.
- AI summaries and Q&A citations reflect the exact decisions agreed upon in the transcript.

---

## 💻 Local Development Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd "Fathom AI - Clone"

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open in browser
# Navigate to http://localhost:3000
```

### Production Build & Static Export

```bash
npm run build
# Generates optimized static output in /out
```

---

## 🤖 8x Agent Capture Setup

This repository was developed strictly adhering to the 8x agent prompt-response capture specification:
- **Hook mechanism:** Antigravity lifecycle hooks (`.agents/hooks.json` and user global config) executing `.agents/capture.py`.
- **Capture logs:** Maintained in `.agent-logs/` and committed interleaved with code commits.
- **Verification:** Completed and verified in [CAPTURE-TEST.md](./CAPTURE-TEST.md).
