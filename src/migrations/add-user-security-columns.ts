import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserSecurityColumns1746100000000 implements MigrationInterface {
  name = 'AddUserSecurityColumns1746100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if failedLoginAttempts column already exists
    const failedLoginColumnInfo = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user' AND column_name = 'failedLoginAttempts'
    `);

    if (failedLoginColumnInfo.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "user" 
        ADD COLUMN "failedLoginAttempts" integer DEFAULT 0
      `);
    }

    // Check if lockedUntil column already exists
    const lockedUntilColumnInfo = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user' AND column_name = 'lockedUntil'
    `);

    if (lockedUntilColumnInfo.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "user" 
        ADD COLUMN "lockedUntil" timestamp DEFAULT NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check if lockedUntil column exists before dropping
    const lockedUntilColumnInfo = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user' AND column_name = 'lockedUntil'
    `);

    if (lockedUntilColumnInfo.length > 0) {
      await queryRunner.query(`
        ALTER TABLE "user" 
        DROP COLUMN "lockedUntil"
      `);
    }

    // Check if failedLoginAttempts column exists before dropping
    const failedLoginColumnInfo = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user' AND column_name = 'failedLoginAttempts'
    `);

    if (failedLoginColumnInfo.length > 0) {
      await queryRunner.query(`
        ALTER TABLE "user" 
        DROP COLUMN "failedLoginAttempts"
      `);
    }
  }
}
