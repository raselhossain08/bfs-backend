import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameCauseTagToTags1746067200000 implements MigrationInterface {
  name = 'RenameCauseTagToTags1746067200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rename tag column to tags and convert to JSON array
    await queryRunner.query(`
      ALTER TABLE "cause" 
      ALTER COLUMN "tag" TYPE TEXT USING "tag"::TEXT;
    `);
    
    await queryRunner.query(`
      ALTER TABLE "cause" 
      ADD COLUMN IF NOT EXISTS "tags" JSONB DEFAULT '[]'::jsonb;
    `);
    
    // Copy data from tag to tags (as array)
    await queryRunner.query(`
      UPDATE "cause" 
      SET "tags" = CASE 
        WHEN "tag" IS NOT NULL AND "tag" != '' 
        THEN ('["' || "tag" || '"]')::jsonb 
        ELSE '[]'::jsonb 
      END
    `);
    
    // Drop the old tag column
    await queryRunner.query(`
      ALTER TABLE "cause" DROP COLUMN IF EXISTS "tag";
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add back the tag column as text
    await queryRunner.query(`
      ALTER TABLE "cause" 
      ADD COLUMN IF NOT EXISTS "tag" TEXT DEFAULT NULL;
    `);
    
    // Copy data from tags back to tag (first element or null)
    await queryRunner.query(`
      UPDATE "cause" 
      SET "tag" = (("tags"->0)::text)
      WHERE "tags" IS NOT NULL AND jsonb_array_length("tags") > 0;
    `);
    
    // Drop the tags column
    await queryRunner.query(`
      ALTER TABLE "cause" DROP COLUMN IF EXISTS "tags";
    `);
  }
}