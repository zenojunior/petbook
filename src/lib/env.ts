import { PHASE_PRODUCTION_BUILD } from "next/constants";

// The Docker image is built without secrets, and `next build` still imports server modules.
// So required variables are enforced when the server runs, not while it is being built.
const isBuilding = process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD;

export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (value) return value;
  if (isBuilding) return "";
  throw new Error(`${name} is not set. See .env.example.`);
}
