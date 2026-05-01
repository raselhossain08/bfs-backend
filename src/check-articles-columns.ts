import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkArticlesColumns() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'bfs',
    ssl: false,
    entities: [],
  });

  try {
    await dataSource.initialize();
    console.log('Database connected\n');

    const result = await dataSource.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'article'
      ORDER BY ordinal_position
    `);

    console.log('Article table columns:');
    result.forEach((col: any) => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    const requiredColumns = [
      'shortDescription',
      'metaKeywords'
    ];

    const missingColumns = requiredColumns.filter(col => 
      !result.some((r: any) => r.column_name === col)
    );

    if (missingColumns.length > 0) {
      console.log(`\nMissing columns: ${missingColumns.join(', ')}`);
      
      for (const col of missingColumns) {
        if (col === 'shortDescription') {
          await dataSource.query(`
            ALTER TABLE "article" ADD COLUMN IF NOT EXISTS "shortDescription" text DEFAULT NULL
          `);
          console.log(`✓ Added ${col}`);
        } else if (col === 'metaKeywords') {
          await dataSource.query(`
            ALTER TABLE "article" ADD COLUMN IF NOT EXISTS "metaKeywords" jsonb DEFAULT NULL
          `);
          console.log(`✓ Added ${col}`);
        }
      }
    } else {
      console.log('\nAll required columns exist!');
    }

    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await dataSource.destroy().catch(() => {});
    process.exit(1);
  }
}

checkArticlesColumns();
