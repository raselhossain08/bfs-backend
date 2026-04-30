import { createConnection } from 'typeorm';
import * as dotenv from 'dotenv';
import { AddCauseTagsColumn1746090613000 } from './migrations/1746090613000-AddCauseTagsColumn';

dotenv.config();

async function runMigration() {
  console.log('Running causes tags column migration...');
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

    const migration = new AddCauseTagsColumn1746090613000();
    await migration.up(connection.createQueryRunner());
    
    console.log('Migration completed successfully!');
    await connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

runMigration();
