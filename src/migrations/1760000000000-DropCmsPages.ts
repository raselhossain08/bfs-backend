import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropCmsPages1760000000000 implements MigrationInterface {
  name = 'DropCmsPages1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop dependent table first (FK to page)
    const sectionExists = await queryRunner.query(`
      SELECT to_regclass('public.section') as regclass
    `);
    if (sectionExists?.[0]?.regclass) {
      await queryRunner.query(`DROP TABLE "section"`);
    }

    const pageExists = await queryRunner.query(`
      SELECT to_regclass('public.page') as regclass
    `);
    if (pageExists?.[0]?.regclass) {
      await queryRunner.query(`DROP TABLE "page"`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Intentionally non-reversible in this repo context.
    // Re-creating full CMS tables safely would require restoring prior migrations/entities.
  }
}
