import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddArticleShortDescription1746093500000 implements MigrationInterface {
  name = 'AddArticleShortDescription1746093500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if shortDescription column exists
    const columnInfo = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'article' AND column_name = 'shortDescription'
    `);

    if (columnInfo.length === 0) {
      // Add shortDescription column
      await queryRunner.query(`
        ALTER TABLE "article" 
        ADD COLUMN "shortDescription" text DEFAULT NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check if column exists before dropping
    const columnInfo = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'article' AND column_name = 'shortDescription'
    `);

    if (columnInfo.length > 0) {
      await queryRunner.query(`
        ALTER TABLE "article" 
        DROP COLUMN "shortDescription"
      `);
    }
  }
}
