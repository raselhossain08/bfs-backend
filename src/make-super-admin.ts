import { createConnection } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkAndUpdateUser() {
  console.log('Checking user...');
  try {
    const connection = await createConnection({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'bfs',
      entities: [],
    });

    // First check if user exists
    const checkResult = await connection.query(
      `SELECT * FROM "user" WHERE email = $1`,
      ['raselhossain8666@gmail.com']
    );

    if (checkResult.length === 0) {
      console.log('User not found. Listing all users:');
      const allUsers = await connection.query(
        `SELECT id, email, role, "firstName", "lastName" FROM "user" LIMIT 10`
      );
      console.table(allUsers);
      await connection.close();
      process.exit(1);
    }

    console.log('Current user data:', checkResult[0]);

    // Update user role
    const updateResult = await connection.query(
      `UPDATE "user" SET role = 'super_admin' WHERE email = $1 RETURNING *`,
      ['raselhossain8666@gmail.com']
    );

    console.log('✅ User updated successfully!');
    console.log('Updated data:', updateResult[0]);

    await connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAndUpdateUser();
