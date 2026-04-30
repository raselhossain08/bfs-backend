import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSuccessStoryMissingColumns1746093700000 implements MigrationInterface {
  name = 'AddSuccessStoryMissingColumns1746093700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add description column
    const descColumn = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'success_stories' AND column_name = 'description'
    `);

    if (descColumn.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "success_stories" 
        ADD COLUMN "description" text DEFAULT NULL
      `);
      console.log('Added description column');
    }

    // Add gallery column
    const galleryColumn = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'success_stories' AND column_name = 'gallery'
    `);

    if (galleryColumn.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "success_stories" 
        ADD COLUMN "gallery" jsonb DEFAULT '[]'::jsonb
      `);
      console.log('Added gallery column');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove description column
    await queryRunner.query(`
      ALTER TABLE "success_stories" 
      DROP COLUMN IF EXISTS "description"
    `);

    // Remove gallery column
    await queryRunner.query(`
      ALTER TABLE "success_stories" 
      DROP COLUMN IF EXISTS "gallery"
    `);
  }
}
