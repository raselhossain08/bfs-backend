/**
 * Migration Script: Migrate CMS JSONB data to proper entities
 *
 * This script migrates:
 * - Categories from cms_items (key: 'categories') to categories table
 * - Articles from cms_items (key: 'articles') to articles table
 *
 * Run with: ts-node src/migrations/migrate-cms-to-entities.ts
 */

import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

// Database configuration
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'bfs',
  synchronize: false,
});

interface CmsItem {
  id: string;
  key: string;
  data: any;
}

interface OldCategory {
  id?: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  color?: string;
  order?: number;
  parent?: { name: string };
}

interface OldArticle {
  id?: number;
  title: string;
  slug?: string;
  description?: string;
  image?: string;
  author?: string;
  authorImage?: string;
  category?: { name: string };
  content?: string;
  date?: string;
  views?: number;
  likes?: number;
  featured?: boolean;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
}

async function migrate() {
  console.log('🚀 Starting CMS to Entities migration...\n');

  try {
    await dataSource.initialize();
    console.log('✅ Connected to database\n');

    // Step 1: Migrate Categories
    console.log('📂 Step 1: Migrating Categories...');
    await migrateCategories();
    console.log('');

    // Step 2: Migrate Articles
    console.log('📄 Step 2: Migrating Articles...');
    await migrateArticles();
    console.log('');

    console.log('✨ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

async function migrateCategories() {
  // Get existing categories from CMS
  const cmsItems = await dataSource.query(
    `SELECT data FROM cms_items WHERE key = 'categories'`,
  );

  if (!cmsItems || cmsItems.length === 0) {
    console.log('  No existing categories found in CMS.');
    return;
  }

  const oldCategories: OldCategory[] = cmsItems[0].data || [];
  console.log(`  Found ${oldCategories.length} categories in CMS.`);

  // Check if categories already exist
  const existingCount = await dataSource.query(`SELECT COUNT(*) FROM category`);

  if (parseInt(existingCount[0].count) > 0) {
    console.log('  Categories table already has data. Skipping migration.');
    return;
  }

  // Create category name to ID mapping
  const categoryNameToId: Map<string, number> = new Map();

  // Insert categories (first pass - without parent relationships)
  for (const oldCat of oldCategories) {
    if (!oldCat.name) continue;

    const slug = oldCat.slug || generateSlug(oldCat.name);

    const result = await dataSource.query(
      `INSERT INTO category (name, slug, description, image, color, "iconColor", "order", status, "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
             RETURNING id`,
      [
        oldCat.name,
        slug,
        oldCat.description || null,
        oldCat.image || null,
        oldCat.color || '#0d9488',
        oldCat.color || '#0d9488', // iconColor defaults to color
        oldCat.order || 0,
        'active',
      ],
    );

    const newId = result[0].id;
    categoryNameToId.set(oldCat.name, newId);
    console.log(`  ✓ Created category: ${oldCat.name} (ID: ${newId})`);
  }

  // Update parent relationships (second pass)
  for (const oldCat of oldCategories) {
    if (oldCat.parent?.name) {
      const childId = categoryNameToId.get(oldCat.name);
      const parentId = categoryNameToId.get(oldCat.parent.name);

      if (childId && parentId) {
        await dataSource.query(
          `UPDATE category SET "parentId" = $1 WHERE id = $2`,
          [parentId, childId],
        );
        console.log(
          `  ✓ Set parent for "${oldCat.name}": ${oldCat.parent.name}`,
        );
      }
    }
  }

  console.log(`  ✅ Migrated ${categoryNameToId.size} categories.`);
}

async function migrateArticles() {
  // Get existing articles from CMS
  const cmsItems = await dataSource.query(
    `SELECT data FROM cms_items WHERE key = 'articles'`,
  );

  if (!cmsItems || cmsItems.length === 0) {
    console.log('  No existing articles found in CMS.');
    return;
  }

  const oldArticles: OldArticle[] = cmsItems[0].data || [];
  console.log(`  Found ${oldArticles.length} articles in CMS.`);

  // Check if articles already exist
  const existingCount = await dataSource.query(`SELECT COUNT(*) FROM article`);

  if (parseInt(existingCount[0].count) > 0) {
    console.log('  Articles table already has data. Skipping migration.');
    return;
  }

  // Get category name to ID mapping
  const categories = await dataSource.query(`SELECT id, name FROM category`);
  const categoryNameToId: Map<string, number> = new Map();
  categories.forEach((cat: any) => {
    categoryNameToId.set(cat.name, cat.id);
  });

  let migrated = 0;
  let skipped = 0;

  for (const oldArticle of oldArticles) {
    if (!oldArticle.title) {
      skipped++;
      continue;
    }

    const slug = oldArticle.slug || generateSlug(oldArticle.title);
    const categoryName = oldArticle.category?.name;
    const categoryId = categoryName ? categoryNameToId.get(categoryName) : null;

    try {
      await dataSource.query(
        `INSERT INTO article (
                    title, slug, description, content, image, author, "authorImage", "authorBio",
                    "categoryId", "categoryName", views, likes, status, featured, tags,
                    "metaTitle", "metaDescription", "publishedAt", "createdAt", "updatedAt"
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())`,
        [
          oldArticle.title,
          slug,
          oldArticle.description || null,
          oldArticle.content || null,
          oldArticle.image || null,
          oldArticle.author || null,
          oldArticle.authorImage || null,
          null, // authorBio
          categoryId || null,
          categoryName || null, // Keep legacy category name
          oldArticle.views || 0,
          oldArticle.likes || 0,
          'published', // Default status
          oldArticle.featured || false,
          oldArticle.tags ? JSON.stringify(oldArticle.tags) : null,
          oldArticle.metaTitle || null,
          oldArticle.metaDescription || null,
          oldArticle.date ? new Date(oldArticle.date) : new Date(),
        ],
      );

      migrated++;
      console.log(`  ✓ Migrated: ${oldArticle.title}`);
    } catch (error: any) {
      if (error.code === '23505') {
        // Duplicate slug
        console.log(`  ⚠ Skipped duplicate slug: ${slug}`);
        skipped++;
      } else {
        console.log(
          `  ❌ Error migrating "${oldArticle.title}": ${error.message}`,
        );
      }
    }
  }

  console.log(`  ✅ Migrated ${migrated} articles, skipped ${skipped}.`);
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Run migration
migrate();
