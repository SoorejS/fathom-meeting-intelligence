import { readState, writeState, getPreferences } from "@/server/preferences";
import {
  preferencesSchema,
  sessionPreferencesSchema,
} from "@/lib/relayPreferences";
import type { UpcomingMeeting } from "@/types/upcoming";
import { z } from "zod";
import { db } from "@/server/db";
import {
  getMeetings,
  insertMeeting,
  getCollections,
  getTrackers,
} from "@/server/repository";
import { createTestMeeting, isTestCall } from "@/lib/testCallMeeting";
import { searchWorkspace } from "@/lib/workspaceSearch";
import { findMeetingAnswer } from "@/lib/meetingAnswers";
import { scanTranscriptMatches } from "@/services/trackerService";
import { randomUUID, randomBytes } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const text = z.string().trim().min(1).max(2000);
const label = z.string().trim().min(1).max(120);
const moment = z.number().int().nonnegative().max(86400);
const json = (value: unknown, status = 200) =>
  Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
async function meeting(id: string) {
  const m = (await getMeetings(id))[0];
  if (!m) throw new ApiError(404, "Meeting not found");
  return m;
}
async function body(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new ApiError(415, "Send JSON");
  const raw = await request.text();
  if (raw.length > 24000) throw new ApiError(413, "Request is too large");
  try {
    return JSON.parse(raw);
  } catch {
    throw new ApiError(400, "Invalid JSON");
  }
}
type Context = { params: Promise<{ path: string[] }> };
async function handle(request: Request, { params }: Context) {
  try {
    const p = (await params).path,
      method = request.method,
      url = new URL(request.url),
      sql = db();
    if (method !== "GET") {
      const origin = request.headers.get("origin");
      if (origin && new URL(origin).host !== url.host)
        throw new ApiError(403, "Cross-origin writes are not allowed");
    }
    if (p[0] === "health" && method === "GET") {
      await sql`SELECT 1`;
      return json({ status: "connected", database: "PostgreSQL" });
    }
    if (p[0] === "preferences") {
      if (method === "GET") return json(await getPreferences());
      if (method === "PATCH") {
        const supplied = z
          .record(z.string(), z.unknown())
          .parse(await body(request));
        // Zod applies inner defaults even for optional fields. A PATCH must
        // change only explicitly supplied preferences.
        const parsed = preferencesSchema.partial().parse(supplied);
        const patch = Object.fromEntries(
          Object.entries(parsed).filter(([key]) =>
            Object.hasOwn(supplied, key),
          ),
        );
        await sql.begin(async (tx) => {
          await tx`SELECT pg_advisory_xact_lock(982347)`;
          const [row] =
            await tx`SELECT value FROM relay_state WHERE key='preferences'`;
          const value = preferencesSchema.parse({ ...row?.value, ...patch });
          await tx`INSERT INTO relay_state(key,value) VALUES('preferences',${tx.json(value)}) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value`;
        });
        return json(await getPreferences());
      }
    }
    if (p[0] === "upcoming") {
      const scheduled = await readState<UpcomingMeeting[]>(
        "scheduled-sessions",
        [],
      );
      if (method === "GET") {
        const prefs = await getPreferences();
        const overrides =
          await sql`SELECT key,value FROM relay_state WHERE key LIKE 'upcoming:%'`;
        return json(
          scheduled.map((m) => ({
            ...m,
            startTimeFormatted:
              new Date(m.startTime).toLocaleString("en-US", {
                timeZone: "UTC",
              }) + " UTC",
            notetakerEnabled:
              overrides.find((r) => r.key === "upcoming:" + m.id)?.value
                .enabled ??
              (prefs.autoRecordMode === "all" ||
                (prefs.autoRecordMode === "external" &&
                  m.id === "up_fintech_followup") ||
                (prefs.autoRecordMode === "internal" &&
                  m.id !== "up_fintech_followup")),
          })),
        );
      }
      if (method === "PATCH" && p[1]) {
        if (!scheduled.some((m) => m.id === p[1]))
          throw new ApiError(404, "Scheduled session not found");
        const b = z.object({ enabled: z.boolean() }).parse(await body(request));
        await writeState("upcoming:" + p[1], b);
        return json({ saved: true });
      }
    }
    if (p[0] === "feedback" && method === "POST") {
      const b = z
        .object({
          kind: z.enum(["idea", "bug", "other", "support"]),
          message: text,
          rating: z.number().int().min(1).max(5),
          topic: label.optional(),
        })
        .parse(await body(request));
      const id = "RELAY-" + randomUUID();
      await writeState("feedback:" + id, {
        ...b,
        createdAt: new Date().toISOString(),
      });
      return json({ id }, 201);
    }
    if (method === "DELETE" && p.length >= 2) {
      let rows;
      if (p[0] === "highlights")
        rows = await sql`DELETE FROM highlights WHERE id=${p[1]} RETURNING id`;
      else if (p[0] === "trackers")
        rows = await sql.begin(async (tx) => {
          const deleted =
            await tx`DELETE FROM trackers WHERE id=${p[1]} RETURNING id`;
          await tx`DELETE FROM relay_state WHERE key=${"tracker:" + p[1]}`;
          return deleted;
        });
      else if (p[0] === "playlists" && p[2] === "items" && p[3])
        rows =
          await sql`DELETE FROM playlist_items WHERE playlist_id=${p[1]} AND id=${p[3]} RETURNING id`;
      else if (p[0] === "playlists" && p.length === 2)
        rows = await sql`DELETE FROM playlists WHERE id=${p[1]} RETURNING id`;
      if (rows) {
        if (!rows.length) throw new ApiError(404, "Record not found");
        return json({ deleted: true });
      }
    }
    if (p[0] === "meetings") {
      if (p.length === 1 && method === "GET") return json(await getMeetings());
      if (p.length === 1 && method === "POST") {
        const data = await body(request);
        if (!isTestCall(data) || !/^test_[\w-]{1,80}$/.test(data.id))
          throw new ApiError(
            400,
            "A valid completed test-call descriptor is required",
          );
        // Capture is simulated; all resulting entities are persisted transactionally in Postgres.
        const prefs = await getPreferences();
        const generated = createTestMeeting(data);
        if (!prefs.autoExtractActions) generated.actionItems = [];
        return json(await insertMeeting(generated), 201);
      }
      const m = await meeting(p[1]);
      if (p[2] === "preferences" && method === "PATCH") {
        const b = sessionPreferencesSchema.parse(await body(request));
        await sql.begin(async (tx) => {
          await tx`SELECT id FROM meetings WHERE id=${m.id} FOR UPDATE`;
          const key = "meeting:" + m.id;
          const [row] =
            await tx`SELECT value FROM relay_state WHERE key=${key}`;
          await tx`INSERT INTO relay_state(key,value) VALUES(${key},${tx.json({ ...row?.value, ...b })}) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value`;
        });
        return json(await meeting(m.id));
      }
      if (p.length === 2 && method === "GET") return json(m);
      if (p[2] === "transcript" && method === "GET") return json(m.transcript);
      if (p[2] === "action-items" && method === "GET")
        return json(m.actionItems);
      if (p[2] === "highlights" && method === "GET") return json(m.highlights);
      if (p[2] === "action-items" && method === "POST") {
        const b = z
          .object({
            text,
            owner: label,
            sourceTimestamp: moment,
            dueDate: z.string().max(100).optional(),
          })
          .parse(await body(request));
        if (b.sourceTimestamp > m.duration)
          throw new ApiError(400, "Timestamp is outside the meeting");
        const id = randomUUID();
        await sql`INSERT INTO action_items(id,meeting_id,text,owner,source_timestamp,due_date) VALUES(${id},${m.id},${b.text},${b.owner},${b.sourceTimestamp},${b.dueDate || null})`;
        return json(
          (await meeting(m.id)).actionItems.find((a) => a.id === id),
          201,
        );
      }
      if (p[2] === "highlights" && method === "POST") {
        const b = z
          .object({ text, type: label, timestamp: moment })
          .parse(await body(request));
        if (b.timestamp > m.duration)
          throw new ApiError(400, "Timestamp is outside the meeting");
        const id = randomUUID();
        await sql`INSERT INTO highlights(id,meeting_id,text,type,timestamp,creator) VALUES(${id},${m.id},${b.text},${b.type},${b.timestamp},'You')`;
        return json(
          (await meeting(m.id)).highlights.find((h) => h.id === id),
          201,
        );
      }
      if (p[2] === "ask" && method === "POST") {
        const b = z.object({ question: text }).parse(await body(request));
        return json(
          findMeetingAnswer(b.question, m) || {
            answer:
              "There is no supported answer in this meeting’s recorded notes. Try a participant, decision, action, or exact topic.",
            citations: [],
          },
        );
      }
    }
    if (p[0] === "action-items" && p[1] && method === "PATCH") {
      const b = z
        .object({ status: z.enum(["open", "completed"]) })
        .parse(await body(request));
      const changed =
        await sql`UPDATE action_items SET status=${b.status} WHERE id=${p[1]} RETURNING meeting_id`;
      if (!changed.length) throw new ApiError(404, "Action not found");
      return json(
        (await meeting(changed[0].meeting_id)).actionItems.find(
          (a) => a.id === p[1],
        ),
      );
    }
    if (p[0] === "highlights" && p[1] && method === "PATCH") {
      const b = z.object({ text, type: label }).parse(await body(request));
      const rows =
        await sql`UPDATE highlights SET text=${b.text},type=${b.type} WHERE id=${p[1]} RETURNING meeting_id`;
      if (!rows.length) throw new ApiError(404, "Highlight not found");
      return json(
        (await meeting(rows[0].meeting_id)).highlights.find(
          (h) => h.id === p[1],
        ),
      );
    }
    if (p[0] === "search" && method === "GET") {
      const q = z
        .string()
        .max(160)
        .parse(url.searchParams.get("q") || "");
      return json(
        searchWorkspace(
          q,
          await getMeetings(),
          (await getCollections()) as never,
          await getTrackers(),
        ),
      );
    }
    if (p[0] === "shares") {
      if (method === "POST" && p.length === 1) {
        const b = z
          .object({ meetingId: label, timestamp: moment.default(0) })
          .parse(await body(request));
        const m = await meeting(b.meetingId);
        if (b.timestamp > m.duration)
          throw new ApiError(400, "Timestamp is outside the meeting");
        const token = randomBytes(24).toString("base64url");
        await sql`INSERT INTO shares(token,meeting_id,timestamp) VALUES(${token},${m.id},${b.timestamp})`;
        return json(
          { token, path: `/share/${token}`, timestamp: b.timestamp },
          201,
        );
      }
      if (method === "GET" && p[1]) {
        const [share] = await sql`SELECT * FROM shares WHERE token=${p[1]}`;
        if (!share) throw new ApiError(404, "This share link does not exist");
        return json({
          meeting: await meeting(share.meeting_id),
          timestamp: share.timestamp,
        });
      }
    }
    if (p[0] === "playlists") {
      if (method === "GET") return json(await getCollections());
      if (method === "POST" && p.length === 1) {
        const b = z
          .object({
            title: label,
            description: z.string().max(400).default(""),
          })
          .parse(await body(request));
        const id = randomUUID();
        await sql`INSERT INTO playlists(id,title,description) VALUES(${id},${b.title},${b.description})`;
        return json({ id }, 201);
      }
      if (method === "POST" && p[2] === "items") {
        const b = z.object({ highlightId: label }).parse(await body(request));
        await sql.begin(async (tx) => {
          const [parent] =
            await tx`SELECT id FROM playlists WHERE id=${p[1]} FOR UPDATE`;
          if (!parent) throw new ApiError(404, "Collection not found");
          await tx`INSERT INTO playlist_items(id,playlist_id,highlight_id,position) VALUES(${randomUUID()},${p[1]},${b.highlightId},(SELECT COALESCE(MAX(position),-1)+1 FROM playlist_items WHERE playlist_id=${p[1]})) ON CONFLICT(playlist_id,highlight_id) DO NOTHING`;
        });
        return json({ saved: true }, 201);
      }
      if (method === "PATCH" && p[1]) {
        const data = await body(request);
        if (!data || typeof data !== "object" || Array.isArray(data))
          throw new ApiError(400, "Invalid collection update");
        if (!Object.hasOwn(data, "itemIds")) {
          const b = z
            .object({
              title: label,
              description: z.string().max(400).default(""),
            })
            .parse(data);
          const rows =
            await sql`UPDATE playlists SET title=${b.title},description=${b.description} WHERE id=${p[1]} RETURNING id`;
          if (!rows.length) throw new ApiError(404, "Collection not found");
          return json({ saved: true });
        }
        const b = z.object({ itemIds: z.array(label).max(500) }).parse(data);
        await sql.begin(async (tx) => {
          const [parent] =
            await tx`SELECT id FROM playlists WHERE id=${p[1]} FOR UPDATE`;
          if (!parent) throw new ApiError(404, "Collection not found");
          const rows =
            await tx`SELECT id FROM playlist_items WHERE playlist_id=${p[1]}`;
          if (
            rows.length !== b.itemIds.length ||
            new Set(b.itemIds).size !== rows.length ||
            rows.some((r) => !b.itemIds.includes(r.id))
          )
            throw new ApiError(400, "Reorder must include every item once");
          for (let i = 0; i < b.itemIds.length; i++)
            await tx`UPDATE playlist_items SET position=${i} WHERE id=${b.itemIds[i]} AND playlist_id=${p[1]}`;
        });
        return json({ saved: true });
      }
    }
    if (p[0] === "trackers") {
      if (method === "GET" && p[1] === "matches")
        return json(
          scanTranscriptMatches(await getTrackers(), await getMeetings()),
        );
      if (method === "GET") return json(await getTrackers());
      if (method === "POST") {
        const b = z
          .object({
            name: label,
            keywords: z
              .array(z.string().trim().min(1).max(80))
              .min(1)
              .max(20)
              .transform((v) => [...new Set(v)]),
            meetingScope: z
              .union([z.literal("all"), z.array(label).min(1).max(200)])
              .default("all"),
          })
          .parse(await body(request));
        const id = randomUUID();
        await sql.begin(async (tx) => {
          await tx`INSERT INTO trackers(id,name,keywords) VALUES(${id},${b.name},${b.keywords})`;
          await tx`INSERT INTO relay_state(key,value) VALUES(${"tracker:" + id},${tx.json({ meetingScope: b.meetingScope })})`;
        });
        return json({ id }, 201);
      }
      if (method === "PATCH" && p[1]) {
        const b = z
          .object({
            enabled: z.boolean().optional(),
            name: label.optional(),
            keywords: z
              .array(z.string().trim().min(1).max(80))
              .min(1)
              .max(20)
              .optional(),
            meetingScope: z
              .union([z.literal("all"), z.array(label).min(1).max(200)])
              .optional(),
          })
          .parse(await body(request));
        await sql.begin(async (tx) => {
          const [old] =
            await tx`SELECT * FROM trackers WHERE id=${p[1]} FOR UPDATE`;
          if (!old) throw new ApiError(404, "Signal not found");
          await tx`UPDATE trackers SET enabled=${b.enabled ?? old.enabled}, name=${b.name ?? old.name}, keywords=${b.keywords ? [...new Set(b.keywords)] : old.keywords} WHERE id=${p[1]}`;
          if (b.meetingScope)
            await tx`INSERT INTO relay_state(key,value) VALUES(${"tracker:" + p[1]},${tx.json({ meetingScope: b.meetingScope })}) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value`;
        });
        return json({ saved: true });
      }
    }
    throw new ApiError(404, "Endpoint not found");
  } catch (error) {
    if (error instanceof z.ZodError)
      return json(
        {
          error: "Invalid input",
          details: error.issues.map((i) => ({
            path: i.path,
            message: i.message,
          })),
        },
        400,
      );
    if (error instanceof ApiError)
      return json({ error: error.message }, error.status);
    const code = (error as { code?: string }).code;
    if (code === "23503")
      return json({ error: "The referenced record does not exist" }, 404);
    console.error(
      "API failure",
      error instanceof Error ? error.message : "Unknown error",
    );
    return json(
      { error: "The database could not complete this request. Please retry." },
      503,
    );
  }
}
export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };
