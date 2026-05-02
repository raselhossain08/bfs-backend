import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'bfs',
  ssl:
    process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [],
  migrations: [],
  synchronize: false,
});

async function runMigrations() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    // Run the migration directly using queryRunner
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    console.log('Adding failedLoginAttempts column...');
    const failedLoginColumnInfo = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user' AND column_name = 'failedLoginAttempts'
    `);

    if (failedLoginColumnInfo.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "user" 
        ADD COLUMN "failedLoginAttempts" integer DEFAULT 0
      `);
      console.log('✓ failedLoginAttempts column added');
    } else {
      console.log('✓ failedLoginAttempts column already exists');
    }

    console.log('Adding lockedUntil column...');
    const lockedUntilColumnInfo = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user' AND column_name = 'lockedUntil'
    `);

    if (lockedUntilColumnInfo.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "user" 
        ADD COLUMN "lockedUntil" timestamp DEFAULT NULL
      `);
      console.log('✓ lockedUntil column added');
    } else {
      console.log('✓ lockedUntil column already exists');
    }

    await queryRunner.release();
    await AppDataSource.destroy();
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error running migration:', error);
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(1);
  }
}

runMigrations();
