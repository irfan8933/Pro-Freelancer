import postgres from 'postgres';
async function run() {
  const connectionString = 'postgresql://postgres.eexgamwfrxehipmvkhut:Irfan%40%40199880%23%23@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true';
  const sql = postgres(connectionString);
  try {
    await sql.unsafe(`
      CREATE OR REPLACE FUNCTION public.auto_confirm_user()
      RETURNS trigger AS $$
      BEGIN
        NEW.email_confirmed_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      DROP TRIGGER IF EXISTS on_auth_user_created_confirm ON auth.users;
      CREATE TRIGGER on_auth_user_created_confirm
        BEFORE INSERT ON auth.users
        FOR EACH ROW EXECUTE PROCEDURE public.auto_confirm_user();
    `);
    console.log("Auto confirm trigger added!");
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}
run();
