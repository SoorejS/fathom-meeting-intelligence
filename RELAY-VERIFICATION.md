# Relay migration verification

## Database origin

A new Neon free-plan PostgreSQL database was provisioned for the existing Vercel project. The seed command verified zero meetings before initialization and then reported 6 meetings, 20 participant records, 30 transcript segments, 16 action items, and 14 highlights.

## Implementation

The root route now renders Relay's original interface. Application records come from real API requests and normalized Postgres tables. The previous local storage and seed components remain in the repository as reusable/historical domain modules, but are not the active application's data source. Public sharing uses random database-backed tokens. Capture completion waits for transactional persistence and supports retries.

## Completed checks

- 33 unit/domain tests passed, including async database-save failure/retry behavior in capture.
- TypeScript and a production build passed with dynamic API and public-share routes.
- Local real-API verification passed: database list, transcript retrieval, capture idempotency, follow-up mutation, highlight creation/editing, direct SQL readback, backend search, share record/public route, collection item/reorder, signal matching/toggle, grounded answers, invalid inputs and cross-origin mutation rejection.
- The API verification cleans up only its own disposable fixtures.

Final local lint completed with zero errors/warnings. The production build passed with dynamic API/share routes and the new Relay icon. Public and video evidence follows below.

## Final connected-workspace verification

The production API test passed at `https://fathom-meeting-intelligence.vercel.app`, without authentication cookies. It verified application reads/writes against direct PostgreSQL reads, including public share records and disposable capture fixtures.

The browser walkthrough on the deployed application verified:

- The original Relay dashboard loads populated database records.
- A meeting opens, playback starts/pauses, speed changes, and transcript seeking sets 02:35.
- Completing a follow-up survives refresh and is visible from the public deployment after being changed locally against the same database.
- A new transcript moment survives refresh, appears in backend search, and opens at its source time.
- A created public share opens in a separate tab at 02:35; after refresh it retrieves the saved custom highlight. Its interface has no editing or share-creation controls.
- A collection was created through the public UI and populated with the saved highlight.
- A new keyword signal was saved and its configured keywords displayed; API tests also verified matching, toggling and collection reordering.
- Compact display preference survives refresh; comfortable spacing was restored afterward.
- At approximately 390px, navigation opens, the test-call panel fits, and the document has no horizontal page overflow.
- A 30-second simulated public test call continued while minimized and navigating the session library. It completed only after the API save. The resulting `test_19de45ad-c2f6-44fb-a1d2-572016e99586` record was confirmed directly in Postgres, then reopened after reload.

The public browser caught a decision-question parsing issue with the word “made”; this was fixed with a targeted regression test. The domain suite now contains 33 passing tests.

The browser used separate public pages, not an incognito profile. The independent HTTP/API verification used fresh requests without authentication or local browser data. Hardware microphone recording was not retested in this pass; the existing adapter tests pass. Simulated capture remains explicitly labeled.

## Intro video

[One-minute intro](public/relay-intro.mp4): 1920×1080 H.264, AAC audio, approximately 60 seconds. It uses actual public Relay screenshots, original captions and synthetic narration (Microsoft Zira Desktop). Frames were visually checked and audio presence/levels verified. This is a narrated product introduction, not an uninterrupted screen recording or a personal talking-head introduction.

## Integrity

Historical capture entry prefixes were compared with the previous commit. The inherited Antigravity log has not been edited or staged. Its SHA-256 remains `4B39070461F9B836FA2585B8538D6C7AC1156BF3BB1DB95F6BDE2BAEE5D5F61C`. The capture hooks and canary evidence remain tracked; source screenshot assets remain ignored/untracked. No Git history was rewritten. Database credentials are confined to ignored local environment files and Vercel's server environment.

