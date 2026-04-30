import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoryIdToProgram1746092800000 implements MigrationInterface {
  name = 'AddCategoryIdToProgram1746092800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if categoryId column already exists
    const columnInfo = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'program' AND column_name = 'categoryId'
    `);

    if (columnInfo.length === 0) {
      // Add categoryId column
      await queryRunner.query(`
        ALTER TABLE "program" 
        ADD COLUMN "categoryId" integer DEFAULT NULL
      `);

      // Optionally: Convert existing category string values to categoryId numbers
      // if you have data that needs migration
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check if column exists before dropping
    const columnInfo = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'program' AND column_name = 'categoryId'
    `);

    if (columnInfo.length > 0) {
      await queryRunner.query(`
        ALTER TABLE "program" 
        DROP COLUMN "categoryId"
      `);
    }
  }
}
