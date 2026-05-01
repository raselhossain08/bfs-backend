import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const migrations = [
  {
    name: 'AddServiceFields1746092800001',
    sql: [
      `ALTER TABLE "service" ADD COLUMN IF NOT EXISTS "shortDescription" text DEFAULT NULL`,
      `ALTER TABLE "service" ADD COLUMN IF NOT EXISTS "categories" jsonb DEFAULT NULL`
    ]
  },
  {
    name: 'AddCategoryIdToProgram1746092800000',
    sql: [
      `ALTER TABLE "program" ADD COLUMN IF NOT EXISTS "categoryId" integer DEFAULT NULL`
    ]
  },
  {
    name: 'RenameCauseTagToTags1746067200000',
    sql: [
      `ALTER TABLE "cause" ADD COLUMN IF NOT EXISTS "tags" jsonb DEFAULT '[]'::jsonb`,
      `UPDATE "cause" SET "tags" = CASE WHEN "tag" IS NOT NULL AND "tag" != '' THEN ('["' || "tag" || '"]')::jsonb ELSE '[]'::jsonb END WHERE "tags" = '[]'::jsonb`,
      `ALTER TABLE "cause" DROP COLUMN IF EXISTS "tag"`
    ]
  },
  {
    name: 'RenameMetaKeywordsToArray1746067201000',
    sql: [
      `ALTER TABLE "service" ADD COLUMN IF NOT EXISTS "metaKeywords" jsonb DEFAULT NULL`,
      `ALTER TABLE "event" ADD COLUMN IF NOT EXISTS "metaKeywords" jsonb DEFAULT NULL`,
      `ALTER TABLE "article" ADD COLUMN IF NOT EXISTS "metaKeywords" jsonb DEFAULT NULL`,
      `ALTER TABLE "page" ADD COLUMN IF NOT EXISTS "metaKeywords" jsonb DEFAULT NULL`
    ]
  },
  {
    name: 'AddCauseTagsColumn1746090613000',
    sql: [
      `ALTER TABLE "cause" ADD COLUMN IF NOT EXISTS "tags" jsonb DEFAULT NULL`
    ]
  },
  {
    name: 'AddEventShortDescription1746093000000',
    sql: [
      `ALTER TABLE "event" ADD COLUMN IF NOT EXISTS "shortDescription" text DEFAULT NULL`
    ]
  },
  {
    name: 'AddEventMetaKeywords1746093100000',
    sql: [
      `ALTER TABLE "event" ADD COLUMN IF NOT EXISTS "metaKeywords" jsonb DEFAULT NULL`
    ]
  },
  {
    name: 'AddPageMetaKeywords1746093300000',
    sql: [
      `ALTER TABLE "page" ADD COLUMN IF NOT EXISTS "metaKeywords" jsonb DEFAULT NULL`
    ]
  },
  {
    name: 'AddSuccessStoryShortDescription1746093400000',
    sql: [
      `ALTER TABLE "success_stories" ADD COLUMN IF NOT EXISTS "shortDescription" text DEFAULT NULL`
    ]
  },
  {
    name: 'AddArticleShortDescription1746093500000',
    sql: [
      `ALTER TABLE "article" ADD COLUMN IF NOT EXISTS "shortDescription" text DEFAULT NULL`
    ]
  },
  {
    name: 'AddSuccessStoryDescription1746093600000',
    sql: [
      `ALTER TABLE "success_stories" ADD COLUMN IF NOT EXISTS "description" text DEFAULT NULL`
    ]
  },
  {
    name: 'AddSuccessStoryMissingColumns1746093700000',
    sql: [
      `ALTER TABLE "success_stories" ADD COLUMN IF NOT EXISTS "impact" text DEFAULT NULL`,
      `ALTER TABLE "success_stories" ADD COLUMN IF NOT EXISTS "beneficiaries" integer DEFAULT 0`,
      `ALTER TABLE "success_stories" ADD COLUMN IF NOT EXISTS "location" text DEFAULT NULL`,
      `ALTER TABLE "success_stories" ADD COLUMN IF NOT EXISTS "order" integer DEFAULT 0`,
      `ALTER TABLE "success_stories" ADD COLUMN IF NOT EXISTS "views" integer DEFAULT 0`
    ]
  },
  {
    name: 'AddSuccessStoryIsFeatured1746093800000',
    sql: [
      `ALTER TABLE "success_stories" ADD COLUMN IF NOT EXISTS "isFeatured" boolean DEFAULT false`
    ]
  },
  {
    name: 'AddSuccessStoryAmount1746093900000',
    sql: [
      `ALTER TABLE "success_stories" ADD COLUMN IF NOT EXISTS "amount" decimal(12,2) DEFAULT 0`
    ]
  },
  {
    name: 'UpdateServiceMetaKeywordsToArray1746092800002',
    sql: [
      `ALTER TABLE "service" ADD COLUMN IF NOT EXISTS "metaKeywords" jsonb DEFAULT NULL`
    ]
  },
  {
    name: 'AddCommentParentIdColumn1777579921967',
    sql: [
      `ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "parentId" integer DEFAULT NULL`
    ]
  }
];

async function runMigrations() {
  console.log('Running SQL migrations...\n');
  
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'bfs',
    ssl: false,
    entities: [],
  });

  try {
    await dataSource.initialize();
    console.log('Database connected\n');

    const queryRunner = dataSource.createQueryRunner();

    for (const migration of migrations) {
      console.log(`Running: ${migration.name}`);
      for (const sql of migration.sql) {
        try {
          await queryRunner.query(sql);
          console.log(`  ✓ Executed`);
        } catch (error: any) {
          if (error.message?.includes('already exists')) {
            console.log(`  ℹ Column already exists`);
          } else {
            console.error(`  ✗ Error:`, error.message);
          }
        }
      }
      console.log('');
    }

    await queryRunner.release();
    await dataSource.destroy();
    
    console.log('All migrations completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await dataSource.destroy().catch(() => {});
    process.exit(1);
  }
}

runMigrations();
