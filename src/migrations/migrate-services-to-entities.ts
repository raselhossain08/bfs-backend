/**
 * Migration Script: Migrate CMS JSONB Services to Proper Entities
 *
 * This script migrates:
 * - Services from cms_items (key: 'services') to services table
 * - Creates default service categories
 *
 * Run with: ts-node src/migrations/migrate-services-to-entities.ts
 */

import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

// Database configuration
const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'bfs',
    synchronize: false,
});

interface CmsItem {
    id: string;
    key: string;
    data: any;
}

interface OldService {
    id?: number;
    title: string;
    slug?: string;
    description?: string;
    icon?: string;
    image?: string;
    missionTitle?: string;
    missionSubtitle?: string;
    missionDescription?: string;
    directives?: { title: string; details: string }[];
    videoUrl?: string;
    videoType?: string;
    contentBlocks?: any[];
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string;
}

async function migrate() {
    console.log('🚀 Starting Services migration...\n');

    try {
        await dataSource.initialize();
        console.log('✅ Connected to database\n');

        // Step 1: Create default service categories
        console.log('📋 Step 1: Creating default service categories...');
        await createDefaultCategories();
        console.log('');

        // Step 2: Migrate Services
        console.log('🔧 Step 2: Migrating Services...');
        await migrateServices();
        console.log('');

        console.log('✨ Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await dataSource.destroy();
    }
}

async function createDefaultCategories() {
    // Check if categories already exist
    const existingCount = await dataSource.query(
        `SELECT COUNT(*) FROM service_category`
    );

    if (parseInt(existingCount[0].count) > 0) {
        console.log('  Service categories already exist. Skipping creation.');
        return;
    }

    // Default service categories
    const defaultCategories = [
        { name: 'Healthcare', slug: 'healthcare', description: 'Health and medical services', color: '#10b981', order: 1 },
        { name: 'Education', slug: 'education', description: 'Educational programs and initiatives', color: '#6366f1', order: 2 },
        { name: 'Emergency', slug: 'emergency', description: 'Emergency response and relief services', color: '#ef4444', order: 3 },
        { name: 'Community', slug: 'community', description: 'Community development programs', color: '#f59e0b', order: 4 },
        { name: 'Environment', slug: 'environment', description: 'Environmental conservation and sustainability', color: '#22c55e', order: 5 },
        { name: 'Other', slug: 'other', description: 'Other services', color: '#64748b', order: 6 },
    ];

    for (const category of defaultCategories) {
        await dataSource.query(
            `INSERT INTO service_category (name, slug, description, color, "order", status, "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
            [category.name, category.slug, category.description, category.color, category.order, 'active']
        );
        console.log(`  ✓ Created category: ${category.name}`);
    }

    console.log(`  ✅ Created ${defaultCategories.length} default service categories.`);
}

async function migrateServices() {
    // Get existing services from CMS
    const cmsItems = await dataSource.query(
        `SELECT data FROM cms_items WHERE key = 'services'`
    );

    if (!cmsItems || cmsItems.length === 0) {
        console.log('  No existing services found in CMS.');
        return;
    }

    const oldServices: OldService[] = cmsItems[0].data || [];
    console.log(`  Found ${oldServices.length} services in CMS.`);

    // Check if services already exist
    const existingCount = await dataSource.query(
        `SELECT COUNT(*) FROM service`
    );

    if (parseInt(existingCount[0].count) > 0) {
        console.log('  Services table already has data. Skipping migration.');
        return;
    }

    let migrated = 0;
    let skipped = 0;

    for (const oldService of oldServices) {
        if (!oldService.title) {
            skipped++;
            continue;
        }

        const slug = oldService.slug || generateSlug(oldService.title);

        // Check for duplicate slug
        const existing = await dataSource.query(
            `SELECT id FROM service WHERE slug = $1`,
            [slug]
        );

        if (existing.length > 0) {
            console.log(`  ⚠ Skipped duplicate slug: ${slug}`);
            skipped++;
            continue;
        }

        try {
            await dataSource.query(
                `INSERT INTO service (
                    title, slug, description, icon, image,
                    "missionTitle", "missionSubtitle", "missionDescription",
                    directives, "videoUrl", "videoType", "contentBlocks",
                    "metaTitle", "metaDescription", "metaKeywords",
                    status, "isFeatured", "order", views, "inquiryCount", "createdAt", "updatedAt"
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW(), NOW())`,
                [
                    oldService.title,
                    slug,
                    oldService.description || null,
                    oldService.icon || 'Zap',
                    oldService.image || null,
                    oldService.missionTitle || null,
                    oldService.missionSubtitle || null,
                    oldService.missionDescription || null,
                    oldService.directives ? JSON.stringify(oldService.directives) : null,
                    oldService.videoUrl || null,
                    oldService.videoType || null,
                    oldService.contentBlocks ? JSON.stringify(oldService.contentBlocks) : null,
                    oldService.seoTitle || null,
                    oldService.seoDescription || null,
                    oldService.seoKeywords || null,
                    'active', // Default status
                    false, // Default isFeatured
                    migrated, // Order based on position
                    0, // Default views
                    0, // Default inquiryCount
                ]
            );

            migrated++;
            console.log(`  ✓ Migrated: ${oldService.title}`);
        } catch (error: any) {
            console.log(`  ❌ Error migrating "${oldService.title}": ${error.message}`);
            skipped++;
        }
    }

    console.log(`  ✅ Migrated ${migrated} services, skipped ${skipped}.`);
}

function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Run migration
migrate();