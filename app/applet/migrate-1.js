import postgres from 'postgres';
async function run() {
  const connectionString = 'postgresql://postgres.eexgamwfrxehipmvkhut:Irfan%40%40199880%23%23@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true';
  const sql = postgres(connectionString);
  try {
    await sql.unsafe(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text`);
    await sql.unsafe(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username text`);
    
    await sql.unsafe(`ALTER TABLE conversion_settings ADD COLUMN IF NOT EXISTS notice_text text DEFAULT ''`);
    await sql.unsafe(`ALTER TABLE conversion_settings ADD COLUMN IF NOT EXISTS notice_active boolean DEFAULT false`);
    
    console.log("Migration complete");
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}
run();
