import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { requiredEnv } from "@/lib/env";
import * as schema from "./schema";

// Reuse one client across hot reloads in dev, otherwise each reload opens new connections.
// postgres() connects lazily, on the first query.
const globalForDb = globalThis as unknown as { pgClient?: postgres.Sql };
const client = globalForDb.pgClient ?? postgres(requiredEnv("DATABASE_URL"));
if (process.env.NODE_ENV !== "production") globalForDb.pgClient = client;

export const db = drizzle(client, { schema });
