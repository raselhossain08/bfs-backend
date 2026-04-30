import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventMetaKeywords1746093100000 implements MigrationInterface {
  name = 'AddEventMetaKeywords1746093100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if metaKeywords column exists
    const columnInfo = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'event' AND column_name = 'metaKeywords'
    `);

    if (columnInfo.length === 0) {
      // Add metaKeywords column as jsonb
      await queryRunner.query(`
        ALTER TABLE "event" 
        ADD COLUMN "metaKeywords" jsonb DEFAULT '[]'::jsonb
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check if column exists before dropping
    const columnInfo = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'event' AND column_name = 'metaKeywords'
    `);

    if (columnInfo.length > 0) {
      await queryRunner.query(`
        ALTER TABLE "event" 
        DROP COLUMN "metaKeywords"
      `);
    }
  }
}
