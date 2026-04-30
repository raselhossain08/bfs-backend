import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSuccessStoryAmount1746093900000 implements MigrationInterface {
  name = 'AddSuccessStoryAmount1746093900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if amount column exists
    const columnInfo = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'success_stories' AND column_name = 'amount'
    `);

    if (columnInfo.length === 0) {
      // Add amount column
      await queryRunner.query(`
        ALTER TABLE "success_stories" 
        ADD COLUMN "amount" numeric(12, 2) DEFAULT NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check if column exists before dropping
    const columnInfo = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'success_stories' AND column_name = 'amount'
    `);

    if (columnInfo.length > 0) {
      await queryRunner.query(`
        ALTER TABLE "success_stories" 
        DROP COLUMN "amount"
      `);
    }
  }
}
