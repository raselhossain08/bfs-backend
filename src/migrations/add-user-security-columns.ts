import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserSecurityColumns1746100000000 implements MigrationInterface {
  name = 'AddUserSecurityColumns1746100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add failedLoginAttempts column
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "failedLoginAttempts" integer DEFAULT 0`
    );
    
    // Add lockedUntil column
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "lockedUntil" timestamp`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove lockedUntil column
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN IF EXISTS "lockedUntil"`
    );
    
    // Remove failedLoginAttempts column
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN IF EXISTS "failedLoginAttempts"`
    );
  }
}
