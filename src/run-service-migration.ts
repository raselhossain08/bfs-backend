import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { AddServiceFields1746092800001 } from './migrations/1746092800001-AddServiceFields';

dotenv.config();

async function runMigration() {
  console.log('Running service fields migration...');

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'bfs',
    ssl:
      process.env.DATABASE_SSL === 'true'
        ? { rejectUnauthorized: false }
        : false,
    entities: [],
  });

  try {
    await dataSource.initialize();
    console.log('Database connection established');

    const queryRunner = dataSource.createQueryRunner();
    const migration = new AddServiceFields1746092800001();

    await migration.up(queryRunner);
    console.log('Migration completed: service fields added');

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
