import { Pool } from 'pg';
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'anistic',
  user: 'postgres',
  password: 'yugiohgx121'
});

(async () => {
  try {
    const users = await pool.query('SELECT count(*) FROM users');
    console.log('users count:', users.rows[0].count);
    
    const searches = await pool.query('SELECT count(*) FROM ai_recommendation_searches');
    console.log('searches count:', searches.rows[0].count);
    
    const tables = await pool.query(
      "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
    );
    console.log('All tables:', tables.rows.map(r => r.tablename).join(', '));
    console.log('Total tables:', tables.rows.length);
    
    // Check new tables are empty
    const newTables = ['addon_reports','anime_episodes','anime_genres','anime_user_events','animes','user_addons','user_anime_lists','user_anime_progress','user_stream_history'];
    for (const t of newTables) {
      const r = await pool.query(`SELECT count(*) FROM "${t}"`);
      console.log(`${t} count:`, r.rows[0].count);
    }
    
    await pool.end();
  } catch (e) {
    console.error('Error:', e.message);
    await pool.end();
    process.exit(1);
  }
})();
