import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { requiredEnv } from "@/lib/env";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  // Google is the only way in. The first sign-in creates the account.
  socialProviders: {
    google: {
      clientId: requiredEnv("GOOGLE_CLIENT_ID"),
      clientSecret: requiredEnv("GOOGLE_CLIENT_SECRET"),
    },
  },
  // nextCookies must be the last plugin so Server Actions can set the session cookie.
  plugins: [admin(), nextCookies()],
});

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
};

// Reads the session from the request. Callers must sit inside a <Suspense> boundary,
// because with Cache Components a request read cannot be prerendered.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const { id, name, email, role } = session.user;
  return { id, name, email, role: role === "admin" ? "admin" : "user" };
}

export async function requireUser(returnTo: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(returnTo)}`);
  return user;
}

// Non-admins get a 404, so the admin area does not even reveal that it exists.
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (user?.role !== "admin") notFound();
  return user;
}
