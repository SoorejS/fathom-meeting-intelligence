import { db } from "./db";
import type { Meeting } from "@/types/meeting";
import { formatTime } from "@/lib/testCallMeeting";

export async function getMeetings(id?: string): Promise<Meeting[]> {
  const sql = db();
  const rows = id
    ? await sql`SELECT * FROM meetings WHERE id=${id}`
    : await sql`SELECT * FROM meetings ORDER BY date DESC LIMIT 200`;
  if (!rows.length) return [];
  const ids = rows.map((r) => String(r.id));
  const [people, transcript, actions, highlights] = await Promise.all([
    sql`SELECT * FROM participants WHERE meeting_id IN ${sql(ids)}`,
    sql`SELECT * FROM transcript_segments WHERE meeting_id IN ${sql(ids)} ORDER BY timestamp,id`,
    sql`SELECT * FROM action_items WHERE meeting_id IN ${sql(ids)} ORDER BY source_timestamp,id`,
    sql`SELECT * FROM highlights WHERE meeting_id IN ${sql(ids)} ORDER BY timestamp,id`,
  ]);
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    date: new Date(r.date).toISOString(),
    dateFormatted: new Date(r.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }),
    duration: r.duration,
    durationFormatted: formatTime(r.duration),
    category: r.category,
    thumbnail: "/test-call.svg",
    summary: r.summary,
    aiQnA: [],
    ...(r.test_call ? { testCall: r.test_call } : {}),
    participants: people
      .filter((p) => p.meeting_id === r.id)
      .map((p) => ({
        id: p.id,
        name: p.name,
        role: p.role,
        company: p.company,
        initials: p.initials,
        color: p.color,
      })),
    transcript: transcript
      .filter((t) => t.meeting_id === r.id)
      .map((t) => ({
        id: t.id,
        meetingId: r.id,
        speaker: t.speaker,
        timestamp: t.timestamp,
        timestampFormatted: formatTime(t.timestamp),
        text: t.text,
      })),
    actionItems: actions
      .filter((a) => a.meeting_id === r.id)
      .map((a) => ({
        id: a.id,
        meetingId: r.id,
        text: a.text,
        owner: a.owner,
        status: a.status,
        dueDate: a.due_date,
        sourceTimestamp: a.source_timestamp,
        sourceTimestampFormatted: formatTime(a.source_timestamp),
      })),
    highlights: highlights
      .filter((h) => h.meeting_id === r.id)
      .map((h) => ({
        id: h.id,
        meetingId: r.id,
        timestamp: h.timestamp,
        timestampFormatted: formatTime(h.timestamp),
        type: h.type,
        text: h.text,
        creator: h.creator,
      })),
  }));
}

// The transaction makes a completed capture visible only when all its records exist.
export async function insertMeeting(meeting: Meeting) {
  await db().begin(async (sql) => {
    const inserted =
      await sql`INSERT INTO meetings (id,title,date,duration,category,summary,test_call) VALUES (${meeting.id},${meeting.title},${meeting.date},${meeting.duration},${meeting.category},${sql.json(meeting.summary as never)},${meeting.testCall ? sql.json(meeting.testCall as never) : null}) ON CONFLICT(id) DO NOTHING RETURNING id`;
    if (!inserted.length) return;
    for (const p of meeting.participants)
      await sql`INSERT INTO participants(id,meeting_id,name,role,company,initials,color) VALUES(${p.id},${meeting.id},${p.name},${p.role},${p.company || null},${p.initials},${p.color})`;
    for (const t of meeting.transcript)
      await sql`INSERT INTO transcript_segments(id,meeting_id,speaker,timestamp,text) VALUES(${t.id},${meeting.id},${t.speaker},${t.timestamp},${t.text})`;
    for (const a of meeting.actionItems)
      await sql`INSERT INTO action_items(id,meeting_id,text,owner,status,due_date,source_timestamp) VALUES(${a.id},${meeting.id},${a.text},${a.owner},${a.status},${a.dueDate || null},${a.sourceTimestamp})`;
    for (const h of meeting.highlights)
      await sql`INSERT INTO highlights(id,meeting_id,timestamp,type,text,creator) VALUES(${h.id},${meeting.id},${h.timestamp},${h.type},${h.text},${h.creator})`;
  });
  return (await getMeetings(meeting.id))[0];
}

export async function getCollections() {
  const [lists, items] = await Promise.all([
    db()`SELECT * FROM playlists ORDER BY created_at DESC`,
    db()`SELECT p.*,h.meeting_id FROM playlist_items p JOIN highlights h ON h.id=p.highlight_id ORDER BY position,id`,
  ]);
  return lists.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    createdAt: p.created_at,
    items: items
      .filter((i) => i.playlist_id === p.id)
      .map((i) => ({
        id: i.id,
        highlightId: i.highlight_id,
        meetingId: i.meeting_id,
        order: i.position,
      })),
  }));
}
export async function getTrackers() {
  return (await db()`SELECT * FROM trackers ORDER BY created_at DESC`).map(
    (t) => ({
      id: t.id,
      name: t.name,
      keywords: t.keywords,
      enabled: t.enabled,
      meetingScope: "all" as const,
      createdAt: String(t.created_at),
      updatedAt: String(t.created_at),
    }),
  );
}
