import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCommentParentIdColumn1777579921967 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if column exists first
    const columnExists = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'comments' 
            AND column_name = 'parentId'
        `);

    // Add parentId column to comments table if it doesn't exist
    if (columnExists.length === 0) {
      await queryRunner.query(`
                ALTER TABLE comments 
                ADD COLUMN "parentId" integer NULL
            `);
    }

    // Check if index exists
    const indexExists = await queryRunner.query(`
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename = 'comments' 
            AND indexname = 'idx_comments_parentId'
        `);

    // Add index for parentId
    if (indexExists.length === 0) {
      await queryRunner.query(`
                CREATE INDEX "idx_comments_parentId" 
                ON comments("parentId")
            `);
    }

    // Check if foreign key constraint exists
    const constraintExists = await queryRunner.query(`
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'comments' 
            AND constraint_name = 'fk_comments_parent'
        `);

    // Add foreign key constraint
    if (constraintExists.length === 0) {
      await queryRunner.query(`
                ALTER TABLE comments 
                ADD CONSTRAINT "fk_comments_parent" 
                FOREIGN KEY ("parentId") REFERENCES comments(id) 
                ON DELETE CASCADE 
                ON UPDATE CASCADE
            `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check if constraint exists before dropping
    const constraintExists = await queryRunner.query(`
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'comments' 
            AND constraint_name = 'fk_comments_parent'
        `);

    // Remove foreign key constraint
    if (constraintExists.length > 0) {
      await queryRunner.query(`
                ALTER TABLE comments 
                DROP CONSTRAINT "fk_comments_parent"
            `);
    }

    // Check if index exists
    const indexExists = await queryRunner.query(`
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename = 'comments' 
            AND indexname = 'idx_comments_parentId'
        `);

    // Remove index
    if (indexExists.length > 0) {
      await queryRunner.query(`
                DROP INDEX "idx_comments_parentId"
            `);
    }

    // Check if column exists
    const columnExists = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'comments' 
            AND column_name = 'parentId'
        `);

    // Remove column
    if (columnExists.length > 0) {
      await queryRunner.query(`
                ALTER TABLE comments 
                DROP COLUMN "parentId"
            `);
    }
  }
}
