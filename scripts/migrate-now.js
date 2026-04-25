const { Client } = require('pg');

const LOCAL_DB = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '',
  database: 'bfs',
};

const SUPABASE_DB = {
  host: 'aws-0-eu-west-1.pooler.supabase.com',
  port: 5432,
  user: 'postgres.bltbwjzqvgeajfodvvvw',
  password: '3Xje^%JKinNi&Uj',
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
};

async function migrate() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     Database Migration: Local → Supabase              ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  let localClient, supabaseClient;
  
  try {
    console.log('📡 Connecting to local database...');
    localClient = new Client(LOCAL_DB);
    await localClient.connect();
    console.log('✅ Connected to local\n');
    
    console.log('📡 Connecting to Supabase...');
    supabaseClient = new Client(SUPABASE_DB);
    await supabaseClient.connect();
    console.log('✅ Connected to Supabase\n');
    
    const tablesResult = await localClient.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    const tables = tablesResult.rows.map(r => r.table_name).filter(t => !t.startsWith('pg_') && !t.startsWith('sql_'));
    console.log(`Found ${tables.length} tables\n`);
    
    let totalMigrated = 0;
    
    for (const tableName of tables) {
      try {
        const countResult = await localClient.query(`SELECT COUNT(*) FROM "${tableName}"`);
        const count = parseInt(countResult.rows[0].count);
        
        if (count === 0) {
          console.log(`⏭️  ${tableName}: Empty`);
          continue;
        }
        
        const checkResult = await supabaseClient.query(`
          SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)
        `, [tableName]);
        
        if (!checkResult.rows[0].exists) {
          console.log(`⚠️  ${tableName}: Not in Supabase`);
          continue;
        }
        
        const dataResult = await localClient.query(`SELECT * FROM "${tableName}"`);
        const rows = dataResult.rows;
        
        await supabaseClient.query(`TRUNCATE TABLE "${tableName}" CASCADE`);
        
        if (rows.length > 0) {
          const columns = Object.keys(rows[0]);
          const colNames = columns.map(c => `"${c}"`).join(', ');
          const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
          
          let inserted = 0;
          for (const row of rows) {
            try {
              const values = columns.map(col => {
                const val = row[col];
                if (val === null || val === undefined) return null;
                if (typeof val === 'object') return JSON.stringify(val);
                return val;
              });
              
              await supabaseClient.query(`INSERT INTO "${tableName}" (${colNames}) VALUES (${placeholders})`, values);
              inserted++;
            } catch (err) {}
          }
          
          console.log(`✅ ${tableName}: ${inserted}/${rows.length} rows`);
          totalMigrated += inserted;
        }
      } catch (error) {
        console.error(`❌ ${tableName}: ${error.message}`);
      }
    }
    
    console.log(`\n=====================================`);
    console.log(`✅ Migration Complete!`);
    console.log(`📊 Total rows migrated: ${totalMigrated}`);
    console.log(`\n🎉 Done! Check your Supabase dashboard.`);
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
  } finally {
    if (localClient) await localClient.end();
    if (supabaseClient) await supabaseClient.end();
  }
}

migrate();