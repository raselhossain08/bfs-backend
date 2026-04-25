import { createConnection } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { User } from './users/entities/user.entity';
import { CmsItem } from './cms/entities/cms-item.entity';

dotenv.config();

async function createSuperAdmin() {
  console.log('🔐 Creating super admin user...\n');

  try {
    const connection = await createConnection({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'bfs',
      entities: [User, CmsItem],
      synchronize: true,
    });

    console.log('✅ Connected to the database.');

    const userRepository = connection.getRepository(User);

    const email = 'raselhossain86666@gmail.com';
    const existingUser = await userRepository.findOne({ where: { email } });

    if (existingUser) {
      console.log(`⚠️  User with email "${email}" already exists.`);
      console.log(
        '   Updating to super_admin role and resetting password...\n',
      );

      const hashedPassword = await bcrypt.hash('Admin123@@', 10);
      existingUser.role = 'super_admin';
      existingUser.password = hashedPassword;
      existingUser.firstName = 'Rasel';
      existingUser.lastName = 'Hossain';
      await userRepository.save(existingUser);

      console.log('✅ Super admin updated successfully!');
    } else {
      console.log('   Creating new super admin user...\n');

      const hashedPassword = await bcrypt.hash('Admin123@@', 10);
      const superAdmin = userRepository.create({
        firstName: 'Rasel',
        lastName: 'Hossain',
        email,
        password: hashedPassword,
        role: 'super_admin',
      });

      await userRepository.save(superAdmin);
      console.log('✅ Super admin created successfully!');
    }

    console.log('\n──────────────────────────────────────────');
    console.log('   📧 Email:    raselhossain86666@gmail.com');
    console.log('   🔑 Password: Admin123@@');
    console.log('   👑 Role:     super_admin');
    console.log('──────────────────────────────────────────\n');

    await connection.close();
    console.log('Done. Connection closed.');
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    process.exit(1);
  }
}

createSuperAdmin();
