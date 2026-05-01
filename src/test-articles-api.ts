import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

async function testArticles() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'bfs',
    ssl: false,
    entities: ['src/**/*.entity.ts'],
  });

  try {
    await dataSource.initialize();
    console.log('Database connected\n');

    // Test article query
    const result = await dataSource.query(`
      SELECT id, title, slug, "shortDescription", "metaKeywords", keywords 
      FROM article 
      WHERE status = 'published'
      LIMIT 2
    `);

    console.log('Sample articles:');
    console.log(JSON.stringify(result, null, 2));

    await dataSource.destroy();
    console.log('\nArticles API test passed!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await dataSource.destroy().catch(() => {});
    process.exit(1);
  }
}

testArticles();
