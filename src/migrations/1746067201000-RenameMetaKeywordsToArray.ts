import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameCauseMetaKeywordsToArray1746067201000 implements MigrationInterface {
  name = 'RenameCauseMetaKeywordsToArray1746067201000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if metaKeywords is already JSONB
    const columnInfo = await queryRunner.query(`
      SELECT data_type, column_type 
      FROM information_schema.columns 
      WHERE table_name = 'cause' AND column_name = 'metaKeywords'
    `);
    
    // If it's text/varchar, convert to JSONB
    if (columnInfo.length > 0 && (columnInfo[0].data_type === 'text' || columnInfo[0].data_type === 'character varying')) {
      await queryRunner.query(`
        ALTER TABLE "cause" 
        ADD COLUMN IF NOT EXISTS "metaKeywords_new" JSONB DEFAULT '[]'::jsonb;
      `);
      
      await queryRunner.query(`
        UPDATE "cause" 
        SET "metaKeywords_new" = CASE 
          WHEN "metaKeywords" IS NOT NULL AND "metaKeywords" != '' 
          THEN ('["' || replace("metaKeywords", ',', '","') || '"]')::jsonb 
          ELSE '[]'::jsonb 
        END
      `);
      
      await queryRunner.query(`
        ALTER TABLE "cause" DROP COLUMN "metaKeywords";
      `);
      
      await queryRunner.query(`
        ALTER TABLE "cause" RENAME COLUMN "metaKeywords_new" TO "metaKeywords";
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "cause" 
      ADD COLUMN IF NOT EXISTS "metaKeywords_new" TEXT DEFAULT NULL;
    `);
    
    await queryRunner.query(`
      UPDATE "cause" 
      SET "metaKeywords_new" = array_to_string(ARRAY(SELECT jsonb_array_elements_text("metaKeywords")), ',')
      WHERE "metaKeywords" IS NOT NULL;
    `);
    
    await queryRunner.query(`
      ALTER TABLE "cause" DROP COLUMN "metaKeywords";
    `);
    
    await queryRunner.query(`
      ALTER TABLE "cause" RENAME COLUMN "metaKeywords_new" TO "metaKeywords";
    `);
  }
}