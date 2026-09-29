# Relay migration verification

## Database origin

A new Neon free-plan PostgreSQL database was provisioned for the existing Vercel project. The seed command verified zero meetings before initialization and then reported 6 meetings, 20 participant records, 30 transcript segments, 16 action items, and 14 highlights.

## Implementation

The root route now renders Relay's original interface. Application records come from real API requests and normalized Postgres tables. The previous local storage and seed components remain in the repository as reusable/historical domain modules, but are not the active application's data source. Public sharing uses random database-backed tokens. Capture completion waits for transactional persistence and supports retries.

## Completed checks

- 32 unit/domain tests passed, including async database-save failure/retry behavior in capture.
- TypeScript and a production build passed with dynamic API and public-share routes.
- Local real-API verification passed: database list, transcript retrieval, capture idempotency, follow-up mutation, highlight creation/editing, direct SQL readback, backend search, share record/public route, collection item/reorder, signal matching/toggle, grounded answers, invalid inputs and cross-origin mutation rejection.
- The API verification cleans up only its own disposable fixtures.

Browser, final deployment, and video evidence will be appended after those checks finish.
