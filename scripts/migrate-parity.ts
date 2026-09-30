import postgres from "postgres";
import { readFile } from "node:fs/promises";
import { SEEDED_UPCOMING_MEETINGS } from "../src/data/seededUpcoming";
async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED;
  if (!url) throw new Error("DATABASE_URL_UNPOOLED is required for migration");
  const sql = postgres(url, { max: 1, prepare: false });
  try {
    const migration = await readFile(
      "db/migrations/002-relay-state.sql",
      "utf8",
    );
    if (process.argv.includes("--check")) {
      await sql
        .begin(async (tx) => {
          await tx.unsafe(migration);
          throw new Error("ROLLBACK_VERIFIED");
        })
        .catch((e) => {
          if (e.message !== "ROLLBACK_VERIFIED") throw e;
        });
      console.log("Additive migration validated and rolled back.");
    } else {
      await sql.begin(async (tx) => {
        await tx.unsafe(migration);
        await tx`INSERT INTO relay_state(key,value) VALUES('scheduled-sessions',${tx.json(SEEDED_UPCOMING_MEETINGS as never)}) ON CONFLICT DO NOTHING`;
      });
      console.log("Relay metadata migration applied.");
    }
  } finally {
    await sql.end();
  }
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
