import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const tablesToCheck = [
  { name: 'volunteer', module: 'Volunteers' },
  { name: 'users', module: 'Users' },
  { name: 'testimonial', module: 'Testimonials' },
  { name: 'support_ticket', module: 'Support' },
  { name: 'success_stories', module: 'Success Stories' },
  { name: 'site_setting', module: 'Site Settings' },
  { name: 'setting', module: 'Settings' },
  { name: 'service', module: 'Services' },
];

async function checkAllModules() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'bfs',
    ssl: false,
    entities: [],
  });

  try {
    await dataSource.initialize();
    console.log('Database connected\n');

    for (const { name, module } of tablesToCheck) {
      const result = await dataSource.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = '${name}'
        ORDER BY ordinal_position
      `);

      console.log(`${module} Module (${name}):`);
      if (result.length === 0) {
        console.log('  ⚠ Table does not exist or has no columns\n');
      } else {
        result.forEach((col: any) => {
          console.log(`  - ${col.column_name}: ${col.data_type}`);
        });
        console.log('');
      }
    }

    await dataSource.destroy();
    console.log('All modules check completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await dataSource.destroy().catch(() => {});
    process.exit(1);
  }
}

checkAllModules();
