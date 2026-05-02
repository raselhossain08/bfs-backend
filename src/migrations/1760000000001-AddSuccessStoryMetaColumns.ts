import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSuccessStoryMetaColumns1760000000001 implements MigrationInterface {
  name = 'AddSuccessStoryMetaColumns1760000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add metaTitle column
    const metaTitleColumn = await queryRunner.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'success_stories' AND column_name = 'metaTitle'
    `);

    if (metaTitleColumn.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "success_stories"
        ADD COLUMN "metaTitle" varchar DEFAULT NULL
      `);
      console.log('Added metaTitle column');
    }

    // Add metaDescription column
    const metaDescColumn = await queryRunner.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'success_stories' AND column_name = 'metaDescription'
    `);

    if (metaDescColumn.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "success_stories"
        ADD COLUMN "metaDescription" text DEFAULT NULL
      `);
      console.log('Added metaDescription column');
    }

    // Add metaKeywords column
    const metaKeywordsColumn = await queryRunner.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'success_stories' AND column_name = 'metaKeywords'
    `);

    if (metaKeywordsColumn.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "success_stories"
        ADD COLUMN "metaKeywords" jsonb DEFAULT NULL
      `);
      console.log('Added metaKeywords column');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "success_stories"
      DROP COLUMN IF EXISTS "metaTitle"
    `);
    await queryRunner.query(`
      ALTER TABLE "success_stories"
      DROP COLUMN IF EXISTS "metaDescription"
    `);
    await queryRunner.query(`
      ALTER TABLE "success_stories"
      DROP COLUMN IF EXISTS "metaKeywords"
    `);
  }
}
