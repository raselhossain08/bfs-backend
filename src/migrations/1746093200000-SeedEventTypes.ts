import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedEventTypes1746093200000 implements MigrationInterface {
  name = 'SeedEventTypes1746093200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if event_type table exists and has data
    const count = await queryRunner.query(
      'SELECT COUNT(*) as count FROM event_type',
    );

    if (count[0].count === '0' || count[0].count === 0) {
      // Insert default event types
      await queryRunner.query(`
        INSERT INTO event_type (name, slug, description, color, icon, "order", status, "createdAt", "updatedAt") 
        VALUES 
          ('Charity Run', 'charity-run', 'Running events for charity fundraising', '#10B981', 'Running', 1, 'active', NOW(), NOW()),
          ('Health Seminar', 'health-seminar', 'Health awareness and education seminars', '#3B82F6', 'Stethoscope', 2, 'active', NOW(), NOW()),
          ('Environment', 'environment', 'Environmental protection and plantation events', '#22C55E', 'TreePine', 3, 'active', NOW(), NOW()),
          ('Blood Donation', 'blood-donation', 'Blood donation drives and campaigns', '#EF4444', 'Heart', 4, 'active', NOW(), NOW()),
          ('Education', 'education', 'Educational workshops and training programs', '#8B5CF6', 'GraduationCap', 5, 'active', NOW(), NOW())
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove seeded event types
    await queryRunner.query(`
      DELETE FROM event_type 
      WHERE slug IN ('charity-run', 'health-seminar', 'environment', 'blood-donation', 'education')
    `);
  }
}
