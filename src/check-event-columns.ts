import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkDatabase() {
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
      WHERE table_name = 'event'
      ORDER BY ordinal_position
    `);

    console.log('Event table columns:');
    result.forEach((col: any) => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    const shortDescExists = result.some(
      (col: any) => col.column_name === 'shortDescription',
    );
    if (!shortDescExists) {
      console.log('\nshortDescription column is missing! Adding it...');
      await dataSource.query(`
        ALTER TABLE "event" ADD COLUMN IF NOT EXISTS "shortDescription" text DEFAULT NULL
      `);
      console.log('shortDescription column added');
    } else {
      console.log('\nshortDescription column exists');
    }

    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await dataSource.destroy().catch(() => {});
    process.exit(1);
  }
}

checkDatabase();
