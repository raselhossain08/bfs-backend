import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSuccessStoryDescription1746093600000 implements MigrationInterface {
  name = 'AddSuccessStoryDescription1746093600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if description column exists
    const columnInfo = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'success_stories' AND column_name = 'description'
    `);

    if (columnInfo.length === 0) {
      // Add description column
      await queryRunner.query(`
        ALTER TABLE "success_stories" 
        ADD COLUMN "description" text DEFAULT NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check if column exists before dropping
    const columnInfo = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'success_stories' AND column_name = 'description'
    `);

    if (columnInfo.length > 0) {
      await queryRunner.query(`
        ALTER TABLE "success_stories" 
        DROP COLUMN "description"
      `);
    }
  }
}
