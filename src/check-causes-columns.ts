import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkCausesColumns() {
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

    // Check cause table
    const causeResult = await dataSource.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'cause'
      ORDER BY ordinal_position
    `);

    console.log('Cause table columns:');
    if (causeResult.length === 0) {
      console.log('  Table does not exist!');
    } else {
      causeResult.forEach((col: any) => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    }

    // Check cause_category table
    const categoryResult = await dataSource.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'cause_category'
      ORDER BY ordinal_position
    `);

    console.log('\nCause Category table columns:');
    if (categoryResult.length === 0) {
      console.log('  Table does not exist!');
    } else {
      categoryResult.forEach((col: any) => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    }

    // Check donation table
    const donationResult = await dataSource.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'donation'
      ORDER BY ordinal_position
    `);

    console.log('\nDonation table columns:');
    if (donationResult.length === 0) {
      console.log('  Table does not exist!');
    } else {
      donationResult.forEach((col: any) => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    }

    await dataSource.destroy();
    console.log('\nCauses API check completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await dataSource.destroy().catch(() => {});
    process.exit(1);
  }
}

checkCausesColumns();
