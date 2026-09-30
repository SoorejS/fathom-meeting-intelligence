import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "../src/server/db";
const base = process.env.VERIFY_URL || "http://localhost:3000";
const marker = "Parity " + randomUUID(),
  id = "test_" + randomUUID();
const lists: string[] = [],
  signals: string[] = [];
async function call(
  path: string,
  method = "GET",
  body?: unknown,
  status = 200,
) {
  const r = await fetch(base + "/api" + path, {
    method,
    headers: body ? { "content-type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json();
  assert.equal(r.status, status, `${method} ${path}: ${JSON.stringify(data)}`);
  return data;
}
async function main() {
  const sql = db();
  const [prior] =
    await sql`SELECT value FROM relay_state WHERE key='preferences'`;
  try {
    await call("/preferences", "PATCH", {
      defaultTemplate: "executive",
      autoExtractActions: false,
      defaultVisibility: "private",
      momentTypes: [{ name: "Parity label", color: "#123456" }],
    });
    assert.equal((await call("/preferences")).defaultTemplate, "executive");
    await call(
      "/meetings",
      "POST",
      {
        version: 1,
        id,
        title: marker,
        date: new Date().toISOString(),
        duration: 26,
        captureMode: "simulated",
        hasLocalAudio: false,
      },
      201,
    );
    const m = await call("/meetings/" + id);
    assert.equal(m.template, "executive");
    assert.equal(m.actionItems.length, 0);
    await call(`/meetings/${id}/preferences`, "PATCH", {
      template: "engineering",
      visibility: "personal",
    });
    await call("/preferences", "PATCH", { defaultTemplate: "sales" });
    const retainedPreferences = await call("/preferences");
    assert.equal(
      retainedPreferences.autoExtractActions,
      false,
      "Partial preference updates preserve unrelated values",
    );
    assert.equal(retainedPreferences.momentTypes[0].name, "Parity label");
    assert.equal((await call("/meetings/" + id)).template, "engineering");
    const a = await call(
      `/meetings/${id}/action-items`,
      "POST",
      { text: marker, owner: "Soorej", dueDate: "Friday", sourceTimestamp: 5 },
      201,
    );
    await call(`/action-items/${a.id}`, "PATCH", { status: "completed" });
    await call(`/action-items/${a.id}`, "PATCH", { status: "open" });
    assert.equal(
      (await call("/meetings/" + id)).actionItems[0].dueDate,
      "Friday",
    );
    const h = await call(
      `/meetings/${id}/highlights`,
      "POST",
      { text: marker, type: "Parity label", timestamp: 5 },
      201,
    );
    const c = await call(
      "/playlists",
      "POST",
      { title: marker, description: "Original" },
      201,
    );
    lists.push(c.id);
    await call(`/playlists/${c.id}`, "PATCH", {
      title: marker + " renamed",
      description: "Updated",
    });
    for (let i = 0; i < 2; i++)
      await call(
        `/playlists/${c.id}/items`,
        "POST",
        { highlightId: h.id },
        201,
      );
    const list = (await call("/playlists")).find(
      (v: { id: string }) => v.id === c.id,
    );
    assert.equal(list.items.length, 1);
    assert.equal(list.description, "Updated");
    await call(`/playlists/${c.id}`, "PATCH", { itemIds: [] }, 400);
    await call(`/playlists/${c.id}/items/${list.items[0].id}`, "DELETE");
    await call(`/playlists/${c.id}/items`, "POST", { highlightId: h.id }, 201);
    await call(`/highlights/${h.id}`, "DELETE");
    assert.equal(
      (await call("/playlists")).find((v: { id: string }) => v.id === c.id)
        .items.length,
      0,
    );
    const t = await call(
      "/trackers",
      "POST",
      { name: marker, keywords: ["migration"], meetingScope: [id] },
      201,
    );
    signals.push(t.id);
    let matches = (await call("/trackers/matches")).filter(
      (v: { trackerId: string }) => v.trackerId === t.id,
    );
    assert.ok(matches.length);
    assert.ok(matches.every((v: { meetingId: string }) => v.meetingId === id));
    await call(`/trackers/${t.id}`, "PATCH", {
      name: marker + " edited",
      keywords: ["permissions"],
      enabled: false,
    });
    assert.equal(
      (await call("/trackers/matches")).filter(
        (v: { trackerId: string }) => v.trackerId === t.id,
      ).length,
      0,
    );
    await call(`/trackers/${t.id}`, "PATCH", { enabled: true });
    matches = (await call("/trackers/matches")).filter(
      (v: { trackerId: string }) => v.trackerId === t.id,
    );
    assert.ok(matches.length);
    const share = await call(
      "/shares",
      "POST",
      { meetingId: id, timestamp: 5 },
      201,
    );
    assert.equal((await call("/shares/" + share.token)).timestamp, 5);
    await call("/shares/not-a-token", "GET", undefined, 404);
    const upcoming = await call("/upcoming");
    assert.equal(upcoming.length, 3);
    assert.ok(
      upcoming.every((v: { startTimeFormatted: string }) =>
        v.startTimeFormatted.includes("UTC"),
      ),
    );
    for (const question of [
      "What decisions were made?",
      "Who owns the actions?",
      "What risks were raised?",
    ]) {
      const answer = await call(`/meetings/${id}/ask`, "POST", { question });
      assert.ok(answer.citations.length, `${question}: ${answer.answer}`);
      assert.ok(
        answer.citations.every((c: { timestamp: number }) =>
          m.transcript.some(
            (t: { timestamp: number }) => t.timestamp === c.timestamp,
          ),
        ),
      );
    }
    await call(`/trackers/${t.id}`, "DELETE");
    await call(`/playlists/${c.id}`, "DELETE");
    console.log(
      "PASS: API parity — defaults/overrides, actions, labels, collection lifecycle/cascade, scoped signals, share, calendar, grounded citations.",
    );
  } finally {
    await sql`DELETE FROM trackers WHERE name LIKE ${marker + "%"}`;
    await sql`DELETE FROM playlists WHERE title LIKE ${marker + "%"}`;
    await sql`DELETE FROM meetings WHERE id=${id}`;
    await sql`DELETE FROM relay_state WHERE key=${"meeting:" + id} OR key IN ${sql(signals.map((v) => "tracker:" + v).concat("parity-unused"))}`;
    if (prior)
      await sql`INSERT INTO relay_state(key,value) VALUES('preferences',${sql.json(prior.value)}) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value`;
    else await sql`DELETE FROM relay_state WHERE key='preferences'`;
    await sql.end();
  }
}
main().catch((e) => {
  console.error(e.stack);
  process.exitCode = 1;
});
