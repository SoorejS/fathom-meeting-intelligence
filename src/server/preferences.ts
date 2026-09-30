import { db } from "./db";
import { defaultPreferences, preferencesSchema } from "@/lib/relayPreferences";
export async function readState<T>(key: string, fallback: T): Promise<T> {
  const [row] = await db()`SELECT value FROM relay_state WHERE key=${key}`;
  return row ? (row.value as T) : fallback;
}
export async function writeState(key: string, value: unknown) {
  await db()`INSERT INTO relay_state(key,value) VALUES(${key},${db().json(value as never)}) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value`;
}
export async function getPreferences() {
  return preferencesSchema.parse(
    await readState("preferences", defaultPreferences()),
  );
}
