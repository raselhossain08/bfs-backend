import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventShortDescription1746093000000 implements MigrationInterface {
  name = 'AddEventShortDescription1746093000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if shortDescription column exists
    const columnInfo = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'event' AND column_name = 'shortDescription'
    `);

    if (columnInfo.length === 0) {
      // Add shortDescription column
      await queryRunner.query(`
        ALTER TABLE "event" 
        ADD COLUMN "shortDescription" text DEFAULT NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check if column exists before dropping
    const columnInfo = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'event' AND column_name = 'shortDescription'
    `);

    if (columnInfo.length > 0) {
      await queryRunner.query(`
        ALTER TABLE "event" 
        DROP COLUMN "shortDescription"
      `);
    }
  }
}
