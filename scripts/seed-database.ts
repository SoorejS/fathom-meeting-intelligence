import { readFile } from "node:fs/promises";
import { db } from "../src/server/db";
import { insertMeeting } from "../src/server/repository";
import { SEEDED_MEETINGS } from "../src/data/seededMeetings";
import { SEEDED_UPCOMING_MEETINGS } from "../src/data/seededUpcoming";

async function seed() {
  const sql = db();
  await sql.unsafe(
    await readFile(new URL("../db/schema.sql", import.meta.url), "utf8"),
  );
  const before = await sql`SELECT count(*)::int AS count FROM meetings`;
  await sql`INSERT INTO relay_state(key,value) VALUES('scheduled-sessions',${sql.json(SEEDED_UPCOMING_MEETINGS as never)}) ON CONFLICT DO NOTHING`;
  for (const meeting of SEEDED_MEETINGS) await insertMeeting(meeting);
  await sql`INSERT INTO playlists(id,title,description) VALUES('collection_decisions','Decisions worth revisiting','A shared reading list of important moments.') ON CONFLICT DO NOTHING`;
  await sql`INSERT INTO trackers(id,name,keywords) VALUES('signal_risks','Delivery risks',ARRAY['risk','latency','concern']) ON CONFLICT DO NOTHING`;
  const counts =
    await sql`SELECT (SELECT count(*) FROM meetings)::int AS meetings,(SELECT count(*) FROM participants)::int AS participants,(SELECT count(*) FROM transcript_segments)::int AS segments,(SELECT count(*) FROM action_items)::int AS actions,(SELECT count(*) FROM highlights)::int AS highlights`;
  console.log(
    JSON.stringify({ meetingsBefore: before[0].count, after: counts[0] }),
  );
  await sql.end();
}
seed().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
