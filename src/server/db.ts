import postgres from "postgres";

let connection: ReturnType<typeof postgres> | undefined;
export function db() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url)
    throw new Error(
      "Database is not configured. Set DATABASE_URL on the server.",
    );
  return (connection ??= postgres(url, {
    max: 3,
    idle_timeout: 20,
    connect_timeout: 15,
    prepare: false,
  }));
}
