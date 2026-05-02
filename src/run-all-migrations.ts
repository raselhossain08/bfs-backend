import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

async function runAllMigrations() {
  console.log('Running all pending migrations...');

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
    migrations: [path.join(__dirname, 'migrations/*.ts')],
    migrationsRun: false,
  });

  try {
    await dataSource.initialize();
    console.log('Database connection established');

    // Run all pending migrations
    const migrations = await dataSource.runMigrations({ transaction: 'all' });
    console.log(`Executed ${migrations.length} migrations:`);
    migrations.forEach((migration) => {
      console.log(`  - ${migration.name}`);
    });

    await dataSource.destroy();
    console.log('All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error running migrations:', error);
    await dataSource.destroy().catch(() => {});
    process.exit(1);
  }
}

runAllMigrations();
