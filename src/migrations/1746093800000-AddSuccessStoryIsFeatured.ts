import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSuccessStoryIsFeatured1746093800000 implements MigrationInterface {
  name = 'AddSuccessStoryIsFeatured1746093800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if isFeatured column exists
    const columnInfo = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'success_stories' AND column_name = 'isFeatured'
    `);

    if (columnInfo.length === 0) {
      // Add isFeatured column
      await queryRunner.query(`
        ALTER TABLE "success_stories" 
        ADD COLUMN "isFeatured" boolean DEFAULT false
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check if column exists before dropping
    const columnInfo = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'success_stories' AND column_name = 'isFeatured'
    `);

    if (columnInfo.length > 0) {
      await queryRunner.query(`
        ALTER TABLE "success_stories" 
        DROP COLUMN "isFeatured"
      `);
    }
  }
}
