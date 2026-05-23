import { fileURLToPath } from 'url';
import fs from 'fs';
import { migrationSQL } from './db-migration.js';
import postgres from 'postgres';

async function run() {
  console.log("Starting database migration...");
  // Connect explicitly omitting env file to use script param if necessary; in this case we have to pass it
  const connectionString = 'postgresql://postgres.eexgamwfrxehipmvkhut:Irfan%40%40199880%23%23@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true';
  const sql = postgres(connectionString);

  try {
    const result = await sql.unsafe(migrationSQL);
    console.log("Migration successful!", result);
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await sql.end();
  }
}

run();
