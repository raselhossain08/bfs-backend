import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCommentParentId1730000000000 implements MigrationInterface {
  name = 'AddCommentParentId1730000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add parentId column
    await queryRunner.query(`
      ALTER TABLE comments 
      ADD COLUMN IF NOT EXISTS "parentId" integer NULL
    `);

    // Add index for parentId
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_comments_parentId" 
      ON comments("parentId")
    `);

    // Add foreign key constraint (optional - if you want referential integrity)
    await queryRunner.query(`
      ALTER TABLE comments 
      ADD CONSTRAINT IF NOT EXISTS "fk_comments_parent" 
      FOREIGN KEY ("parentId") REFERENCES comments(id) 
      ON DELETE CASCADE 
      ON UPDATE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign key constraint
    await queryRunner.query(`
      ALTER TABLE comments 
      DROP CONSTRAINT IF EXISTS "fk_comments_parent"
    `);

    // Remove index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_comments_parentId"
    `);

    // Remove column
    await queryRunner.query(`
      ALTER TABLE comments 
      DROP COLUMN IF EXISTS "parentId"
    `);
  }
}
