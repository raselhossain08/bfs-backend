#!/usr/bin/env node

/**
 * Simple Migration Script - Local to Supabase
 * 
 * Run this after setting your local password below
 */

const { Client } = require('pg');
require('dotenv').config();

// Get local password from user input or env
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const LOCAL_DB = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '', // Will ask for this
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
  
  // Ask for local password
  rl.question('Enter your LOCAL database password: ', async (password) => {
    LOCAL_DB.password = password;
    rl.close();
    
    let localClient, supabaseClient;
    
    try {
      // Connect to local
      console.log('\n📡 Connecting to local database...');
      localClient = new Client(LOCAL_DB);
      await localClient.connect();
      console.log('✅ Connected to local database\n');
      
      // Connect to Supabase
      console.log('📡 Connecting to Supabase...');
      supabaseClient = new Client(SUPABASE_DB);
      await supabaseClient.connect();
      console.log('✅ Connected to Supabase\n');
      
      // Get list of tables
      console.log('🔍 Discovering tables...');
      const tablesResult = await localClient.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);
      
      const tables = tablesResult.rows.map(r => r.table_name);
      console.log(`Found ${tables.length} tables: ${tables.join(', ')}\n`);
      
      let totalMigrated = 0;
      let totalErrors = 0;
      
      for (const tableName of tables) {
        try {
          // Check if table has data
          const countResult = await localClient.query(`SELECT COUNT(*) FROM "${tableName}"`);
          const count = parseInt(countResult.rows[0].count);
          
          if (count === 0) {
            console.log(`⏭️  ${tableName}: Empty, skipping`);
            continue;
          }
          
          // Check if table exists in Supabase
          const checkResult = await supabaseClient.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_name = $1
            )
          `, [tableName]);
          
          if (!checkResult.rows[0].exists) {
            console.log(`⚠️  ${tableName}: Not found in Supabase (run sync first)`);
            continue;
          }
          
          // Get data
          const dataResult = await localClient.query(`SELECT * FROM "${tableName}"`);
          const rows = dataResult.rows;
          
          // Clear and insert
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
                
                await supabaseClient.query(
                  `INSERT INTO "${tableName}" (${colNames}) VALUES (${placeholders})`,
                  values
                );
                inserted++;
              } catch (err) {
                // Silent skip for individual row errors
              }
            }
            
            console.log(`✅ ${tableName}: Migrated ${inserted}/${rows.length} rows`);
            totalMigrated += inserted;
            if (inserted < rows.length) totalErrors += (rows.length - inserted);
          }
        } catch (error) {
          console.error(`❌ ${tableName}: ${error.message}`);
        }
      }
      
      console.log(`\n=====================================`);
      console.log(`✅ Migration Complete!`);
      console.log(`📊 Total rows migrated: ${totalMigrated}`);
      if (totalErrors > 0) console.log(`⚠️  Errors: ${totalErrors}`);
      console.log(`\n🎉 Done! Your data is now in Supabase.`);
      
    } catch (error) {
      console.error('\n❌ Migration failed:', error.message);
    } finally {
      if (localClient) await localClient.end();
      if (supabaseClient) await supabaseClient.end();
    }
  });
}

migrate();