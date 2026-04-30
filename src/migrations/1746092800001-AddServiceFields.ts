import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddServiceFields1746092800001 implements MigrationInterface {
  name = 'AddServiceFields1746092800001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if shortDescription column exists
    const shortDescColumn = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'service' AND column_name = 'shortDescription'
    `);

    if (shortDescColumn.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "service" 
        ADD COLUMN "shortDescription" text DEFAULT NULL
      `);
    }

    // Check if categories column exists
    const categoriesColumn = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'service' AND column_name = 'categories'
    `);

    if (categoriesColumn.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "service" 
        ADD COLUMN "categories" jsonb DEFAULT NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check and drop shortDescription column
    const shortDescColumn = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'service' AND column_name = 'shortDescription'
    `);

    if (shortDescColumn.length > 0) {
      await queryRunner.query(`
        ALTER TABLE "service" 
        DROP COLUMN "shortDescription"
      `);
    }

    // Check and drop categories column
    const categoriesColumn = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'service' AND column_name = 'categories'
    `);

    if (categoriesColumn.length > 0) {
      await queryRunner.query(`
        ALTER TABLE "service" 
        DROP COLUMN "categories"
      `);
    }
  }
}
