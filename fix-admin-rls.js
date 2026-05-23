import postgres from 'postgres';
async function run() {
  const connectionString = 'postgresql://postgres.eexgamwfrxehipmvkhut:Irfan%40%40199880%23%23@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true';
  const sql = postgres(connectionString);
  try {
    await sql.unsafe(`DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles`);
    // Need to drop for all tables since I copied it to others too
    const tables = ['tasks', 'submissions', 'deposit_requests', 'withdraw_requests', 'points_ledger', 'conversion_settings'];
    for (const t of tables) {
      await sql.unsafe(`DROP POLICY IF EXISTS "Admins can manage all tasks" ON tasks`).catch(() => {});
      await sql.unsafe(`DROP POLICY IF EXISTS "Admins can manage all submissions" ON submissions`).catch(() => {});
      // wait let's just drop them simply
    }

    await sql.unsafe(`
      CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean AS $$
      DECLARE
        v_role text;
      BEGIN
        SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
        RETURN v_role = 'admin';
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    await sql.unsafe(`CREATE POLICY "Admins can manage profiles" ON profiles AS PERMISSIVE FOR ALL TO public USING (public.is_admin())`);
    
    // update policies for other tables
    await sql.unsafe(`DROP POLICY IF EXISTS "Admins can manage all" ON tasks`);
    await sql.unsafe(`CREATE POLICY "Admins can manage all" ON tasks AS PERMISSIVE FOR ALL TO public USING (public.is_admin())`);

    await sql.unsafe(`DROP POLICY IF EXISTS "Admins can manage all" ON submissions`);
    await sql.unsafe(`CREATE POLICY "Admins can manage all" ON submissions AS PERMISSIVE FOR ALL TO public USING (public.is_admin())`);

    await sql.unsafe(`DROP POLICY IF EXISTS "Admins can manage all" ON deposit_requests`);
    await sql.unsafe(`CREATE POLICY "Admins can manage all" ON deposit_requests AS PERMISSIVE FOR ALL TO public USING (public.is_admin())`);

    await sql.unsafe(`DROP POLICY IF EXISTS "Admins can manage all" ON withdraw_requests`);
    await sql.unsafe(`CREATE POLICY "Admins can manage all" ON withdraw_requests AS PERMISSIVE FOR ALL TO public USING (public.is_admin())`);

    await sql.unsafe(`DROP POLICY IF EXISTS "Admins can manage all" ON points_ledger`);
    await sql.unsafe(`CREATE POLICY "Admins can manage all" ON points_ledger AS PERMISSIVE FOR ALL TO public USING (public.is_admin())`);

    await sql.unsafe(`DROP POLICY IF EXISTS "Admins can manage all" ON conversion_settings`);
    await sql.unsafe(`CREATE POLICY "Admins can manage all" ON conversion_settings AS PERMISSIVE FOR ALL TO public USING (public.is_admin())`);

    console.log("Admin policies updated");
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}
run();
