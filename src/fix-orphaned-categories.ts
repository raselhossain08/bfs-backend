import { createConnection } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

async function fixOrphanedCategories() {
  console.log('Checking for orphaned category references...');
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

    // Check if category with id 1 exists
    const category1 = await connection.query(
      'SELECT * FROM cause_category WHERE id = 1',
    );
    console.log('Category with id 1:', category1);

    // Check causes that reference categoryId 1
    const causesWithCat1 = await connection.query(
      'SELECT id, title, categoryId FROM cause WHERE categoryId = 1',
    );
    console.log('Causes referencing category 1:', causesWithCat1);

    // Check all categories
    const allCategories = await connection.query(
      'SELECT id, name FROM cause_category ORDER BY id',
    );
    console.log('All categories:', allCategories);

    // Check causes with invalid categoryId
    const orphanedCauses = await connection.query(`
      SELECT c.id, c.title, c.categoryId 
      FROM cause c 
      LEFT JOIN cause_category cc ON c.categoryId = cc.id 
      WHERE c.categoryId IS NOT NULL AND cc.id IS NULL
    `);
    console.log('Orphaned causes (invalid categoryId):', orphanedCauses);

    // Fix orphaned causes by setting categoryId to NULL
    if (orphanedCauses.length > 0) {
      console.log(`\nFixing ${orphanedCauses.length} orphaned causes...`);
      await connection.query(`
        UPDATE cause 
        SET categoryId = NULL 
        WHERE categoryId IS NOT NULL 
        AND categoryId NOT IN (SELECT id FROM cause_category)
      `);
      console.log('✓ Fixed orphaned causes');
    }

    // If no category exists, create a default one
    if (allCategories.length === 0) {
      console.log('\nNo categories found. Creating default category...');
      await connection.query(`
        INSERT INTO cause_category (name, slug, status, "order", "createdAt", "updatedAt")
        VALUES ('General', 'general', 'active', 0, NOW(), NOW())
      `);
      console.log('✓ Created default category');
    }

    await connection.close();
    console.log('\n✓ Verification complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixOrphanedCategories();
