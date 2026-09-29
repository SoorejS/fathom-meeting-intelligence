import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "../src/server/db";

const base = process.env.VERIFY_URL || "http://localhost:3000";
const id = `test_${randomUUID()}`;
const marker = `Relay verification ${randomUUID().slice(0, 8)}`;
const createdLists: string[] = [],
  createdTrackers: string[] = [];
async function call(
  path: string,
  method = "GET",
  body?: unknown,
  expected = 200,
) {
  const response = await fetch(base + "/api" + path, {
    method,
    headers: body === undefined ? {} : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  assert.equal(
    response.status,
    expected,
    `${method} ${path}: ${JSON.stringify(data)}`,
  );
  return data;
}
async function main() {
  const sql = db();
  try {
    const meetings = await call("/meetings");
    assert.ok(meetings.length >= 6);
    const direct = await sql`SELECT count(*)::int AS count FROM meetings`;
    assert.equal(meetings.length, direct[0].count);
    await call(
      "/meetings",
      "POST",
      {
        version: 1,
        id,
        title: marker,
        date: new Date().toISOString(),
        duration: 26.45,
        captureMode: "simulated",
        hasLocalAudio: false,
      },
      201,
    );
    // Replaying completion is idempotent, including all child records.
    await call(
      "/meetings",
      "POST",
      {
        version: 1,
        id,
        title: marker,
        date: new Date().toISOString(),
        duration: 26.45,
        captureMode: "simulated",
        hasLocalAudio: false,
      },
      201,
    );
    const m = await call(`/meetings/${id}`);
    assert.equal(m.duration, 26.45);
    assert.equal(m.transcript.length, 6);
    assert.equal((await call(`/meetings/${id}/transcript`)).length, 6);
    const [a] = await call(`/meetings/${id}/action-items`);
    assert.ok(a);
    await call(`/action-items/${a.id}`, "PATCH", { status: "completed" });
    assert.equal(
      (await call(`/meetings/${id}`)).actionItems.find(
        (x: { id: string }) => x.id === a.id,
      ).status,
      "completed",
    );
    assert.equal(
      (await sql`SELECT status FROM action_items WHERE id=${a.id}`)[0].status,
      "completed",
    );
    await call(
      `/meetings/${id}/action-items`,
      "POST",
      {
        text: "Database-created follow-up",
        owner: "Reviewer",
        sourceTimestamp: 10,
      },
      201,
    );
    const h = await call(
      `/meetings/${id}/highlights`,
      "POST",
      { text: marker + " saved insight", type: "Decision", timestamp: 5 },
      201,
    );
    await call(`/highlights/${h.id}`, "PATCH", {
      text: marker + " edited insight",
      type: "Insight",
    });
    assert.equal(
      (await sql`SELECT text FROM highlights WHERE id=${h.id}`)[0].text,
      marker + " edited insight",
    );
    assert.ok(
      (await call("/search?q=" + encodeURIComponent(marker))).some(
        (x: { type: string; meetingId: string }) =>
          x.type === "highlight" && x.meetingId === id,
      ),
    );
    for (const q of ["Soorej", "migration", "Database-created follow-up"])
      assert.ok(
        (await call("/search?q=" + encodeURIComponent(q))).some(
          (x: { meetingId: string }) => x.meetingId === id,
        ),
      );
    const share = await call(
      "/shares",
      "POST",
      { meetingId: id, timestamp: 5 },
      201,
    );
    assert.equal(
      (await sql`SELECT meeting_id FROM shares WHERE token=${share.token}`)[0]
        .meeting_id,
      id,
    );
    const shared = await call("/shares/" + share.token);
    assert.equal(shared.meeting.id, id);
    assert.equal(shared.timestamp, 5);
    assert.ok(
      shared.meeting.highlights.some((x: { id: string }) => x.id === h.id),
    );
    const publicResponse = await fetch(base + share.path);
    assert.equal(publicResponse.status, 200);
    const list = await call("/playlists", "POST", { title: marker }, 201);
    createdLists.push(list.id);
    await call(
      `/playlists/${list.id}/items`,
      "POST",
      { highlightId: h.id },
      201,
    );
    const fetched = (await call("/playlists")).find(
      (x: { id: string }) => x.id === list.id,
    );
    assert.equal(fetched.items[0].highlightId, h.id);
    await call("/playlists/" + list.id, "PATCH", {
      itemIds: fetched.items.map((x: { id: string }) => x.id),
    });
    const tracker = await call(
      "/trackers",
      "POST",
      { name: marker, keywords: ["migration"] },
      201,
    );
    createdTrackers.push(tracker.id);
    assert.ok(
      (await call("/trackers/matches")).some(
        (x: { meetingId: string; trackerId: string }) =>
          x.meetingId === id && x.trackerId === tracker.id,
      ),
    );
    await call("/trackers/" + tracker.id, "PATCH", { enabled: false });
    assert.ok(
      !(await call("/trackers/matches")).some(
        (x: { trackerId: string }) => x.trackerId === tracker.id,
      ),
    );
    const answer = await call(`/meetings/${id}/ask`, "POST", {
      question: "Who owns the API migration checklist?",
    });
    assert.ok(
      answer.citations.some((x: { timestamp: number }) => x.timestamp === 10),
    );
    await call(
      `/meetings/${id}/highlights`,
      "POST",
      { text: "Invalid time", type: "Insight", timestamp: 9999 },
      400,
    );
    await call("/action-items/" + a.id, "PATCH", { status: "invalid" }, 400);
    await call("/shares/nonexistent-token", "GET", undefined, 404);
    const cross = await fetch(base + "/api/shares", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://unrelated.example",
      },
      body: JSON.stringify({ meetingId: id, timestamp: 0 }),
    });
    assert.equal(cross.status, 403);
    console.log(
      JSON.stringify(
        {
          result: "PASS",
          base,
          checks: [
            "database-backed list",
            "capture transaction and idempotency",
            "transcript endpoint",
            "action persistence and SQL readback",
            "highlight edit and SQL readback",
            "search title/people/transcript/actions/highlights",
            "share token database record and public route",
            "collections add/reorder",
            "signals matching/toggle",
            "grounded answers",
            "validation and origin rejection",
          ],
        },
        null,
        2,
      ),
    );
  } finally {
    // Delete only the disposable records created by this test run, never seed/user data.
    for (const list of createdLists)
      await sql`DELETE FROM playlists WHERE id=${list}`;
    for (const tracker of createdTrackers)
      await sql`DELETE FROM trackers WHERE id=${tracker}`;
    await sql`DELETE FROM meetings WHERE id=${id}`;
    await sql.end();
  }
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
