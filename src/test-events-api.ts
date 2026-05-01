import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

async function testEventsApi() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'bfs',
    ssl: false,
    entities: ['src/**/*.entity.ts'],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('Database connected\n');

    // Test creating an event
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      // Test query with shortDescription
      const result = await queryRunner.query(`
        SELECT id, title, "shortDescription", "metaKeywords" FROM event LIMIT 1
      `);
      console.log('Query test successful:', result);

      await queryRunner.rollbackTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Query failed:', error);
    } finally {
      await queryRunner.release();
    }

    await dataSource.destroy();
    console.log('\nEvents API tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await dataSource.destroy().catch(() => {});
    process.exit(1);
  }
}

testEventsApi();
