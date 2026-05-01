import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSupportTicketTable1746100800000 implements MigrationInterface {
  name = 'CreateSupportTicketTable1746100800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "support_ticket" (
        "id" SERIAL PRIMARY KEY,
        "userId" integer,
        "email" character varying NOT NULL,
        "name" character varying,
        "subject" character varying NOT NULL,
        "description" text NOT NULL,
        "category" character varying,
        "priority" character varying DEFAULT 'medium',
        "status" character varying DEFAULT 'open',
        "assignedTo" integer,
        "attachments" jsonb,
        "resolution" text,
        "resolutionDate" timestamp,
        "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "support_ticket_reply" (
        "id" SERIAL PRIMARY KEY,
        "ticketId" integer NOT NULL,
        "userId" integer,
        "message" text NOT NULL,
        "isAdminReply" boolean DEFAULT false,
        "attachments" jsonb,
        "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Support ticket tables created successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "support_ticket_reply"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "support_ticket"`);
  }
}
