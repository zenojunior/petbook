// Gives the admin role to an existing account: pnpm admin:grant you@example.com
import postgres from "postgres";

const email = process.argv[2];
const databaseUrl = process.env.DATABASE_URL;
if (!email || !databaseUrl) {
  console.error("Usage: pnpm admin:grant <email>  (DATABASE_URL must be set)");
  process.exit(1);
}

const sql = postgres(databaseUrl);
const rows = await sql`update "user" set role = 'admin' where email = ${email} returning email`;
await sql.end();

if (rows.length === 0) {
  console.error(`No account with email ${email}. Sign in with Google first.`);
  process.exit(1);
}
console.log(`${email} is now an admin.`);
