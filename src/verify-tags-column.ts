import { createConnection } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

async function verifyAndFixTagsColumn() {
  console.log('Verifying tags column in database...');
  try {
    const connection = await createConnection({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'bfs',
      entities: [],
    });

    // Check if tags column exists
    const result = await connection.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'cause' 
      AND column_name = 'tags'
    `);

    if (result.length === 0) {
      console.log('Tags column not found. Adding it now...');

      // Add tags column
      await connection.query(`
        ALTER TABLE cause 
        ADD COLUMN "tags" text NULL
      `);
      console.log('✓ Added tags column');

      // Migrate old tag data
      await connection.query(`
        UPDATE cause 
        SET "tags" = CASE 
          WHEN "tag" IS NOT NULL AND "tag" != '' 
          THEN json_build_array("tag")::text 
          ELSE NULL 
        END
        WHERE "tags" IS NULL AND "tag" IS NOT NULL
      `);
      console.log('✓ Migrated tag data');
    } else {
      console.log('✓ Tags column already exists:', result[0]);
    }

    // Verify the table structure
    const allColumns = await connection.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'cause'
      ORDER BY ordinal_position
    `);

    console.log('\nCause table columns:');
    allColumns.forEach((col: any) => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    await connection.close();
    console.log('\n✓ Verification complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyAndFixTagsColumn();
