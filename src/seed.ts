import { createConnection } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { User } from './users/entities/user.entity';
import { CmsItem } from './cms/entities/cms-item.entity';

dotenv.config();

async function seed() {
  console.log('Starting seed process...');
  try {
    const connection = await createConnection({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'bfs',
      entities: [User, CmsItem],
      synchronize: true, // Be careful in production
    });

    console.log('Connected to the database.');

    // --- 1. SEED ADMIN USER ---
    const userRepository = connection.getRepository(User);
    const existingAdmin = await userRepository.findOne({
      where: { email: 'admin@birdsfly.org' },
    });

    if (existingAdmin) {
      console.log('Admin user already exists. Checking password...');
      console.log('Seeding aborted for user - admin already present');
    } else {
      console.log('Creating admin user...');
      const hashedPassword = await bcrypt.hash('admin', 10);

      const adminUser = userRepository.create({
        firstName: 'Super',
        lastName: 'Admin',
        email: 'admin@birdsfly.org',
        password: hashedPassword,
        role: 'admin',
      });

      await userRepository.save(adminUser);
      console.log('Admin user seeded successfully: admin@birdsfly.org / admin');
    }

    // --- 2. SEED CMS DATA ---
    console.log('Starting CMS data migration...');
    const cmsRepository = connection.getRepository(CmsItem);
    const dataPath = path.join(__dirname, 'cms', 'data.json');

    if (fs.existsSync(dataPath)) {
      const fileContent = fs.readFileSync(dataPath, 'utf-8');
      const cmsData = JSON.parse(fileContent);

      // Keys that should NOT be overwritten if they already exist (user-generated data)
      const preserveKeys = [
        'subscribers',
        'contactMessages',
        'newsletters',
        'dashboard-activities',
      ];

      let migratedCount = 0;
      for (const [key, value] of Object.entries(cmsData)) {
        const existingItem = await cmsRepository.findOne({ where: { key } });
        if (existingItem) {
          // Skip preservation keys to keep user-generated data
          if (preserveKeys.includes(key)) {
            console.log(`Preserving existing data for key: ${key}`);
            continue;
          }
          // Update existing item
          existingItem.data = value;
          await cmsRepository.save(existingItem);
        } else {
          // Create new item
          const newItem = cmsRepository.create({ key, data: value });
          await cmsRepository.save(newItem);
        }
        migratedCount++;
      }
      console.log(
        `Successfully migrated ${migratedCount} CMS top-level keys into the database.`,
      );
    } else {
      console.warn('Could not find data.json at path:', dataPath);
    }

    await connection.close();
    console.log('Seed process finished.');
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

seed();
