import { createConnection } from 'typeorm';
import * as dotenv from 'dotenv';
import { AddSuccessStoryAmount1746093900000 } from './migrations/1746093900000-AddSuccessStoryAmount';

dotenv.config();

async function runMigrations() {
  console.log('Running migrations...');
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

    const migration = new AddSuccessStoryAmount1746093900000();
    await migration.up(connection.createQueryRunner());
    console.log('Migration completed: SuccessStory amount added');

    console.log('All migrations completed successfully!');
    await connection.close();
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

runMigrations();
