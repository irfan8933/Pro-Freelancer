import postgres from 'postgres';
async function run() {
  const connectionString = 'postgresql://postgres.eexgamwfrxehipmvkhut:Irfan%40%40199880%23%23@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true';
  const sql = postgres(connectionString);
  try {
    await sql.unsafe(`DROP POLICY IF EXISTS "Admins can manage tasks" ON tasks`).catch(()=>console.log("no tasks"));
    await sql.unsafe(`DROP POLICY IF EXISTS "Admins can manage submissions" ON submissions`).catch(()=>console.log("no sub"));
    await sql.unsafe(`DROP POLICY IF EXISTS "Admins can manage deposit requests" ON deposit_requests`).catch(()=>console.log("no dep"));
    await sql.unsafe(`DROP POLICY IF EXISTS "Admins can manage withdraw requests" ON withdraw_requests`).catch(()=>console.log("no w"));
    await sql.unsafe(`DROP POLICY IF EXISTS "Admins can manage points ledger" ON points_ledger`).catch(()=>console.log("no p"));
    await sql.unsafe(`DROP POLICY IF EXISTS "Admins can manage conversion settings" ON conversion_settings`).catch(()=>console.log("no conv"));

    console.log("Deleted old recursive admin policies");
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}
run();
