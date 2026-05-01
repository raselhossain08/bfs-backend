import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { AddCauseTagsColumn1746090613000 } from './migrations/1746090613000-AddCauseTagsColumn';

dotenv.config();

async function runMigration() {
  console.log('Running cause tags migration...');
  
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'bfs',
    ssl: process.env.DATABASE_SSL === 'true'
      ? { rejectUnauthorized: false }
      : false,
    entities: [],
  });

  try {
    await dataSource.initialize();
    console.log('Database connection established');

    const queryRunner = dataSource.createQueryRunner();
    const migration = new AddCauseTagsColumn1746090613000();
    
    await migration.up(queryRunner);
    console.log('Migration completed: tags column added to cause table');

    await queryRunner.release();
    await dataSource.destroy();
    console.log('Migration runner completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error running migration:', error);
    await dataSource.destroy().catch(() => {});
    process.exit(1);
  }
}

runMigration();
