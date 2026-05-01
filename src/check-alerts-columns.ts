import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkAlertsColumns() {
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

    // Check alert_templates table
    const templateResult = await dataSource.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'alert_templates'
      ORDER BY ordinal_position
    `);

    console.log('Alert Templates table columns:');
    if (templateResult.length === 0) {
      console.log('  Table does not exist!');
    } else {
      templateResult.forEach((col: any) => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    }

    // Check alert_broadcasts table
    const broadcastResult = await dataSource.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'alert_broadcasts'
      ORDER BY ordinal_position
    `);

    console.log('\nAlert Broadcasts table columns:');
    if (broadcastResult.length === 0) {
      console.log('  Table does not exist!');
    } else {
      broadcastResult.forEach((col: any) => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    }

    await dataSource.destroy();
    console.log('\nAlerts API check completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await dataSource.destroy().catch(() => {});
    process.exit(1);
  }
}

checkAlertsColumns();
