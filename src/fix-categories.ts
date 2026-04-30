import { createConnection } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

async function fixCategories() {
  console.log('Fixing categories...');
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

    // Check current categories
    const categories = await connection.query('SELECT id, name FROM cause_category');
    console.log('Current categories:', categories);

    // Check causes with their categoryId
    const causes = await connection.query('SELECT id, title, "categoryId" FROM cause');
    console.log('Current causes with categoryId:', causes);

    // If category with id 1 doesn't exist, create it
    const cat1 = await connection.query('SELECT * FROM cause_category WHERE id = 1');
    if (cat1.length === 0) {
      console.log('Creating category with id 1...');
      await connection.query(`
        INSERT INTO cause_category (id, name, slug, status, "order", "createdAt", "updatedAt")
        VALUES (1, 'General', 'general', 'active', 0, NOW(), NOW())
      `);
      console.log('✓ Created category with id 1');
    } else {
      console.log('Category with id 1 already exists:', cat1[0]);
    }

    // Check if there are any causes with NULL categoryId that should be assigned
    const causesNullCat = await connection.query('SELECT id, title FROM cause WHERE "categoryId" IS NULL');
    if (causesNullCat.length > 0) {
      console.log(`Found ${causesNullCat.length} causes with NULL categoryId`);
    }

    await connection.close();
    console.log('\n✓ Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixCategories();
