import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPageMetaKeywords1746093300000 implements MigrationInterface {
  name = 'AddPageMetaKeywords1746093300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if metaKeywords column exists
    const columnInfo = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'page' AND column_name = 'metaKeywords'
    `);

    if (columnInfo.length === 0) {
      // Add metaKeywords column as jsonb
      await queryRunner.query(`
        ALTER TABLE "page" 
        ADD COLUMN "metaKeywords" jsonb DEFAULT '[]'::jsonb
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check if column exists before dropping
    const columnInfo = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'page' AND column_name = 'metaKeywords'
    `);

    if (columnInfo.length > 0) {
      await queryRunner.query(`
        ALTER TABLE "page" 
        DROP COLUMN "metaKeywords"
      `);
    }
  }
}
