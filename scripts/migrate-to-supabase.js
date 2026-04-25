#!/usr/bin/env node

/**
 * Database Migration Script: Local PostgreSQL → Supabase
 * 
 * This script migrates all data from your local PostgreSQL database to Supabase.
 * 
 * Usage:
 * 1. Set up your Supabase project and get connection details
 * 2. Update .env with Supabase credentials (see below)
 * 3. Run: node migrate-to-supabase.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load local env
require('dotenv').config();

// Configuration
const LOCAL_DB = {
  host: process.env.LOCAL_DATABASE_HOST || 'localhost',
  port: parseInt(process.env.LOCAL_DATABASE_PORT || '5432'),
  user: process.env.LOCAL_DATABASE_USER || 'postgres',
  password: process.env.LOCAL_DATABASE_PASSWORD || '',
  database: process.env.LOCAL_DATABASE_NAME || 'bfs',
};

// Supabase connection (using DATABASE_* variables)
const SUPABASE_DB = {
  host: process.env.DATABASE_HOST || '',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  user: process.env.DATABASE_USER || '',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'postgres',
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

// Tables to migrate (in order of dependencies)
const TABLES = [
  // Core tables (no dependencies)
  'users',
  'cms_items',
  'categories',
  'event_types',
  'service_categories',
  'cause_categories',
  'payment_methods',
  'chat_agents',
  
  // Tables with dependencies
  'sessions',
  'two_factor_auth',
  'audit_logs',
  
  // Content tables
  'articles',
  'events',
  'event_registrations',
  'services',
  'service_inquiries',
  'pages',
  'sections',
  'causes',
  'donations',
  'volunteers',
  'volunteer_applications',
  'programs',
  'success_stories',
  'comments',
  'goals',
  'recurring_donations',
  'referrals',
  'saved_campaigns',
  
  // Chat/Support tables
  'chat_sessions',
  'chat_messages',
  'chat_message_entities',
  'chat_analytics',
  'support_tickets',
];

async function connectToDatabase(config, name) {
  const client = new Client(config);
  try {
    await client.connect();
    console.log(`✓ Connected to ${name}`);
    return client;
  } catch (error) {
    console.error(`✗ Failed to connect to ${name}:`, error.message);
    throw error;
  }
}

async function getTableColumns(client, tableName) {
  const query = `
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = $1 
    AND table_schema = 'public'
    ORDER BY ordinal_position
  `;
  const result = await client.query(query, [tableName]);
  return result.rows;
}

async function getPrimaryKey(client, tableName) {
  const query = `
    SELECT kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_name = $1
  `;
  const result = await client.query(query, [tableName]);
  return result.rows[0]?.column_name;
}

async function getForeignKeys(client, tableName) {
  const query = `
    SELECT
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = $1
  `;
  const result = await client.query(query, [tableName]);
  return result.rows;
}

async function migrateTable(localClient, supabaseClient, tableName) {
  console.log(`\n📦 Migrating table: ${tableName}`);
  
  try {
    // Get columns
    const columns = await getTableColumns(localClient, tableName);
    if (columns.length === 0) {
      console.log(`  ⚠️ Table ${tableName} not found or empty, skipping...`);
      return { skipped: true };
    }
    
    // Get data from local
    const dataResult = await localClient.query(`SELECT * FROM "${tableName}"`);
    const rows = dataResult.rows;
    
    if (rows.length === 0) {
      console.log(`  ℹ️ No data in ${tableName}, skipping...`);
      return { skipped: true };
    }
    
    console.log(`  📊 Found ${rows.length} rows`);
    
    // Check if table exists in Supabase
    const checkTable = await supabaseClient.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = $1
      )
    `, [tableName]);
    
    if (!checkTable.rows[0].exists) {
      console.log(`  ⚠️ Table ${tableName} doesn't exist in Supabase. Run TypeORM sync first!`);
      return { error: 'Table not found' };
    }
    
    // Truncate table in Supabase (clear existing data)
    await supabaseClient.query(`TRUNCATE TABLE "${tableName}" CASCADE`);
    console.log(`  🗑️  Cleared existing data`);
    
    // Build insert query
    const columnNames = columns.map(c => `"${c.column_name}"`).join(', ');
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    
    let inserted = 0;
    let errors = 0;
    
    // Insert data in batches
    const BATCH_SIZE = 100;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      
      for (const row of batch) {
        try {
          const values = columns.map(col => {
            const val = row[col.column_name];
            // Handle special types
            if (val === null || val === undefined) return null;
            if (typeof val === 'object') return JSON.stringify(val);
            return val;
          });
          
          await supabaseClient.query(
            `INSERT INTO "${tableName}" (${columnNames}) VALUES (${placeholders})`,
            values
          );
          inserted++;
        } catch (error) {
          errors++;
          if (errors <= 5) {
            console.error(`  ❌ Error inserting row:`, error.message);
          }
        }
      }
      
      process.stdout.write(`  ⏳ ${inserted}/${rows.length} rows migrated...\r`);
    }
    
    console.log(`  ✅ Migrated ${inserted}/${rows.length} rows (${errors} errors)`);
    return { success: true, inserted, errors };
    
  } catch (error) {
    console.error(`  ❌ Failed to migrate ${tableName}:`, error.message);
    return { error: error.message };
  }
}

async function verifyMigration(localClient, supabaseClient) {
  console.log('\n🔍 Verifying migration...\n');
  
  let allMatch = true;
  
  for (const tableName of TABLES) {
    try {
      const localCount = await localClient.query(`SELECT COUNT(*) FROM "${tableName}"`);
      const supabaseCount = await supabaseClient.query(`SELECT COUNT(*) FROM "${tableName}"`);
      
      const localRows = parseInt(localCount.rows[0].count);
      const supabaseRows = parseInt(supabaseCount.rows[0].count);
      
      const match = localRows === supabaseRows;
      if (!match) allMatch = false;
      
      const status = match ? '✅' : '⚠️';
      console.log(`${status} ${tableName}: ${localRows} → ${supabaseRows} rows`);
    } catch (error) {
      console.log(`⚠️  ${tableName}: Error checking - ${error.message}`);
    }
  }
  
  return allMatch;
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     Database Migration: Local → Supabase              ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  // Validate Supabase config
  if (!SUPABASE_DB.host || !SUPABASE_DB.password) {
    console.error('❌ Error: Please set SUPABASE_HOST and SUPABASE_PASSWORD environment variables');
    console.log('\nAdd these to your .env file:');
    console.log('SUPABASE_HOST=db.xxxxxxxxxx.supabase.co');
    console.log('SUPABASE_USER=postgres');
    console.log('SUPABASE_PASSWORD=your-supabase-db-password');
    process.exit(1);
  }
  
  let localClient, supabaseClient;
  
  try {
    // Connect to databases
    localClient = await connectToDatabase(LOCAL_DB, 'Local PostgreSQL');
    supabaseClient = await connectToDatabase(SUPABASE_DB, 'Supabase PostgreSQL');
    
    console.log('\n📋 Tables to migrate:', TABLES.length);
    console.log('=====================================\n');
    
    // Migrate each table
    const results = [];
    for (const tableName of TABLES) {
      const result = await migrateTable(localClient, supabaseClient, tableName);
      results.push({ table: tableName, ...result });
    }
    
    // Summary
    console.log('\n=====================================');
    console.log('📊 Migration Summary\n');
    
    const successful = results.filter(r => r.success).length;
    const skipped = results.filter(r => r.skipped).length;
    const failed = results.filter(r => r.error).length;
    
    console.log(`✅ Successful: ${successful}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📦 Total tables: ${TABLES.length}\n`);
    
    // Verify
    const verified = await verifyMigration(localClient, supabaseClient);
    
    if (verified && failed === 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('\nNext steps:');
      console.log('1. Update your .env DATABASE_* variables to point to Supabase');
      console.log('2. Test your application');
      console.log('3. Update your frontend API_URL if needed');
    } else {
      console.log('\n⚠️  Migration completed with some issues.');
      console.log('Please review the errors above.');
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    // Close connections
    if (localClient) await localClient.end();
    if (supabaseClient) await supabaseClient.end();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { migrateTable, verifyMigration };