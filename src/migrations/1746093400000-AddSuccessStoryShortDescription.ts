import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSuccessStoryShortDescription1746093400000 implements MigrationInterface {
  name = 'AddSuccessStoryShortDescription1746093400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if shortDescription column exists
    const columnInfo = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'success_stories' AND column_name = 'shortDescription'
    `);

    if (columnInfo.length === 0) {
      // Add shortDescription column
      await queryRunner.query(`
        ALTER TABLE "success_stories" 
        ADD COLUMN "shortDescription" text DEFAULT NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check if column exists before dropping
    const columnInfo = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'success_stories' AND column_name = 'shortDescription'
    `);

    if (columnInfo.length > 0) {
      await queryRunner.query(`
        ALTER TABLE "success_stories" 
        DROP COLUMN "shortDescription"
      `);
    }
  }
}
