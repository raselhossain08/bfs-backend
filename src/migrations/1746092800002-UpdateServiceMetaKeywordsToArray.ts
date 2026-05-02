import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateServiceMetaKeywordsToArray1746092800002 implements MigrationInterface {
  name = 'UpdateServiceMetaKeywordsToArray1746092800002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if metaKeywords column exists and its type
    const columnInfo = await queryRunner.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'service' AND column_name = 'metaKeywords'
    `);

    // If it's text/varchar, convert to JSONB
    if (
      columnInfo.length > 0 &&
      (columnInfo[0].data_type === 'text' ||
        columnInfo[0].data_type === 'character varying' ||
        columnInfo[0].data_type === 'character varying')
    ) {
      // Add new jsonb column
      await queryRunner.query(`
        ALTER TABLE "service" 
        ADD COLUMN IF NOT EXISTS "metaKeywords_new" JSONB DEFAULT '[]'::jsonb;
      `);

      // Convert existing data
      await queryRunner.query(`
        UPDATE "service" 
        SET "metaKeywords_new" = CASE 
          WHEN "metaKeywords" IS NOT NULL AND "metaKeywords" != '' 
          THEN ('["' || replace("metaKeywords", ',', '","') || '"]')::jsonb 
          ELSE '[]'::jsonb 
        END
      `);

      // Drop old column
      await queryRunner.query(`
        ALTER TABLE "service" DROP COLUMN "metaKeywords";
      `);

      // Rename new column
      await queryRunner.query(`
        ALTER TABLE "service" RENAME COLUMN "metaKeywords_new" TO "metaKeywords";
      `);
    } else if (columnInfo.length === 0) {
      // Column doesn't exist, create it as jsonb
      await queryRunner.query(`
        ALTER TABLE "service" 
        ADD COLUMN "metaKeywords" JSONB DEFAULT '[]'::jsonb;
      `);
    }
    // If it's already jsonb, do nothing
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert back to text
    await queryRunner.query(`
      ALTER TABLE "service" 
      ADD COLUMN IF NOT EXISTS "metaKeywords_new" TEXT DEFAULT NULL;
    `);

    await queryRunner.query(`
      UPDATE "service" 
      SET "metaKeywords_new" = array_to_string(ARRAY(SELECT jsonb_array_elements_text("metaKeywords")), ',')
      WHERE "metaKeywords" IS NOT NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "service" DROP COLUMN "metaKeywords";
    `);

    await queryRunner.query(`
      ALTER TABLE "service" RENAME COLUMN "metaKeywords_new" TO "metaKeywords";
    `);
  }
}
