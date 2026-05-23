import postgres from 'postgres';
async function run() {
  const connectionString = 'postgresql://postgres.eexgamwfrxehipmvkhut:Irfan%40%40199880%23%23@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true';
  const sql = postgres(connectionString);
  try {
    await sql.unsafe(`
      DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
      CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
    `);
    console.log("Policy added!");
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}
run();
