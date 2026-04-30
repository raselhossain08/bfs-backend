import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCauseTagsColumn1746090613000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if tags column exists
    const columnExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'cause' 
      AND column_name = 'tags'
    `);

    // Add tags column if it doesn't exist
    if (columnExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE cause 
        ADD COLUMN "tags" text NULL
      `);
      console.log('Added tags column to cause table');
    }

    // Check if old tag column exists and migrate data
    const oldTagExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'cause' 
      AND column_name = 'tag'
    `);

    // Migrate data from old tag column to new tags column if needed
    if (oldTagExists.length > 0) {
      await queryRunner.query(`
        UPDATE cause 
        SET "tags" = CASE 
          WHEN "tag" IS NOT NULL AND "tag" != '' 
          THEN json_build_array("tag")::text 
          ELSE NULL 
        END
        WHERE "tags" IS NULL
      `);
      console.log('Migrated tag data to tags column');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check if column exists before dropping
    const columnExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'cause' 
      AND column_name = 'tags'
    `);

    // Remove tags column
    if (columnExists.length > 0) {
      await queryRunner.query(`
        ALTER TABLE cause 
        DROP COLUMN "tags"
      `);
      console.log('Dropped tags column from cause table');
    }
  }
}
