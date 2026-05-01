import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkChatColumns() {
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

    const tables = [
      'live_chat_sessions',
      'live_chat_messages',
      'live_chat_agents',
      'live_chat_analytics'
    ];

    for (const table of tables) {
      const result = await dataSource.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = '${table}'
        ORDER BY ordinal_position
      `);

      console.log(`${table} table columns:`);
      if (result.length === 0) {
        console.log('  Table does not exist!');
      } else {
        result.forEach((col: any) => {
          console.log(`  - ${col.column_name}: ${col.data_type}`);
        });
      }
      console.log('');
    }

    await dataSource.destroy();
    console.log('Chat module check completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await dataSource.destroy().catch(() => {});
    process.exit(1);
  }
}

checkChatColumns();
