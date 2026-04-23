/**
 * Migration Script: Migrate CMS JSONB Causes to Proper Entities
 *
 * This script migrates:
 * - Causes from cms_items (key: 'causes') to causes table
 * - Creates default cause categories from existing data
 * - Migrates donations from cms_items (key: 'donations') to donations table
 *
 * Run with: ts-node src/migrations/migrate-causes-to-entities.ts
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

interface OldCause {
    id?: number;
    title: string;
    slug?: string;
    description?: string;
    shortDescription?: string;
    image?: string;
    images?: string[];
    videos?: { url: string; type: string; caption?: string }[];
    gallery?: { id: string; url: string; type: string; caption?: string }[];
    category?: string;
    tag?: string;
    tagColor?: string;
    progress?: number;
    raised?: string | number;
    goal?: string | number;
    metric?: string;
    donors?: number;
    location?: string;
    impact?: string;
    gradient?: string;
    size?: string;
    glow?: string;
    videoUrl?: string;
    videoType?: string;
    contentBlocks?: any[];
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string;
}

interface OldDonation {
    id: string;
    transactionId: string;
    date: string;
    amount: number;
    currency: string;
    campaignId?: string;
    campaignName?: string;
    paymentMethod: string;
    status: string;
    donorId?: string;
    name: string;
    email?: string;
    motivation?: string;
}

async function migrate() {
    console.log('🚀 Starting Causes migration...\n');

    try {
        await dataSource.initialize();
        console.log('✅ Connected to database\n');

        // Step 1: Create default cause categories
        console.log('📋 Step 1: Creating default cause categories...');
        await createDefaultCategories();
        console.log('');

        // Step 2: Migrate Causes
        console.log('🔧 Step 2: Migrating Causes...');
        await migrateCauses();
        console.log('');

        // Step 3: Migrate Donations
        console.log('💰 Step 3: Migrating Donations...');
        await migrateDonations();
        console.log('');

        // Step 4: Update cause stats
        console.log('📊 Step 4: Updating cause statistics...');
        await updateCauseStats();
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
        `SELECT COUNT(*) FROM cause_category`
    );

    if (parseInt(existingCount[0].count) > 0) {
        console.log('  Cause categories already exist. Skipping creation.');
        return;
    }

    // Get existing causes to extract categories
    const cmsItems = await dataSource.query(
        `SELECT data FROM cms_items WHERE key = 'causes'`
    );

    const oldCauses: OldCause[] = cmsItems?.[0]?.data || [];
    const categorySet = new Set<string>();

    for (const cause of oldCauses) {
        if (cause.category) {
            categorySet.add(cause.category);
        }
    }

    // Default cause categories (extracted from existing data + defaults)
    const defaultCategories = [
        { name: 'Healthcare', slug: 'healthcare', description: 'Health and medical programs', color: '#10b981', order: 1 },
        { name: 'Education', slug: 'education', description: 'Educational programs and initiatives', color: '#6366f1', order: 2 },
        { name: 'Climate Resilience', slug: 'climate-resilience', description: 'Climate adaptation and environmental programs', color: '#22c55e', order: 3 },
        { name: 'Clean Water', slug: 'clean-water', description: 'Clean water and sanitation programs', color: '#0ea5e9', order: 4 },
        { name: 'Food Security', slug: 'food-security', description: 'Food security and nutrition programs', color: '#f59e0b', order: 5 },
        { name: 'Community Development', slug: 'community-development', description: 'Community development and empowerment', color: '#8b5cf6', order: 6 },
        { name: 'Women Empowerment', slug: 'women-empowerment', description: 'Women empowerment and gender equality', color: '#ec4899', order: 7 },
        { name: 'Disaster Relief', slug: 'disaster-relief', description: 'Emergency response and disaster relief', color: '#ef4444', order: 8 },
        { name: 'Other', slug: 'other', description: 'Other causes', color: '#64748b', order: 9 },
    ];

    // Add categories from existing data if not in defaults
    for (const cat of categorySet) {
        const exists = defaultCategories.find(
            d => d.name.toLowerCase() === cat.toLowerCase() || d.slug === generateSlug(cat)
        );
        if (!exists) {
            defaultCategories.push({
                name: cat,
                slug: generateSlug(cat),
                description: `${cat} programs`,
                color: '#64748b',
                order: defaultCategories.length + 1,
            });
        }
    }

    for (const category of defaultCategories) {
        await dataSource.query(
            `INSERT INTO cause_category (name, slug, description, color, "order", status, "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
            [category.name, category.slug, category.description, category.color, category.order, 'active']
        );
        console.log(`  ✓ Created category: ${category.name}`);
    }

    console.log(`  ✅ Created ${defaultCategories.length} cause categories.`);
}

async function migrateCauses() {
    // Get existing causes from CMS
    const cmsItems = await dataSource.query(
        `SELECT data FROM cms_items WHERE key = 'causes'`
    );

    if (!cmsItems || cmsItems.length === 0) {
        console.log('  No existing causes found in CMS.');
        return;
    }

    const oldCauses: OldCause[] = cmsItems[0].data || [];
    console.log(`  Found ${oldCauses.length} causes in CMS.`);

    // Check if causes already exist
    const existingCount = await dataSource.query(
        `SELECT COUNT(*) FROM cause`
    );

    if (parseInt(existingCount[0].count) > 0) {
        console.log('  Causes table already has data. Skipping migration.');
        return;
    }

    // Get category map
    const categories = await dataSource.query(`SELECT id, name, slug FROM cause_category`);
    const categoryMap = new Map<string, number>();
    for (const cat of categories) {
        categoryMap.set(cat.name.toLowerCase(), cat.id);
        categoryMap.set(cat.slug, cat.id);
    }

    let migrated = 0;
    let skipped = 0;

    for (const oldCause of oldCauses) {
        if (!oldCause.title) {
            skipped++;
            continue;
        }

        const slug = oldCause.slug || generateSlug(oldCause.title);

        // Check for duplicate slug
        const existing = await dataSource.query(
            `SELECT id FROM cause WHERE slug = $1`,
            [slug]
        );

        if (existing.length > 0) {
            console.log(`  ⚠ Skipped duplicate slug: ${slug}`);
            skipped++;
            continue;
        }

        // Find category ID
        let categoryId: number | null = null;
        if (oldCause.category) {
            categoryId = categoryMap.get(oldCause.category.toLowerCase()) ||
                         categoryMap.get(generateSlug(oldCause.category)) || null;
        }

        // Parse numeric values
        const goal = typeof oldCause.goal === 'string'
            ? parseFloat(oldCause.goal.replace(/[^0-9.]/g, '')) || 0
            : oldCause.goal || 0;

        const raised = typeof oldCause.raised === 'string'
            ? parseFloat(oldCause.raised.replace(/[^0-9.]/g, '')) || 0
            : oldCause.raised || 0;

        const progress = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : (oldCause.progress || 0);

        try {
            await dataSource.query(
                `INSERT INTO cause (
                    title, slug, "shortDescription", description, image,
                    gallery, videos, "categoryId", tag, "tagColor",
                    goal, raised, donors, progress, location, impact, metric,
                    gradient, size, glow, "videoUrl", "videoType", "contentBlocks",
                    "metaTitle", "metaDescription", "metaKeywords",
                    status, "isFeatured", "order", views, "createdAt", "updatedAt"
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, NOW(), NOW())`,
                [
                    oldCause.title,
                    slug,
                    oldCause.shortDescription || null,
                    oldCause.description || null,
                    oldCause.image || null,
                    oldCause.images ? JSON.stringify(oldCause.images) : (oldCause.gallery ? JSON.stringify(oldCause.gallery.map((g: any) => g.url)) : null),
                    oldCause.videos ? JSON.stringify(oldCause.videos) : null,
                    categoryId,
                    oldCause.tag || null,
                    oldCause.tagColor || null,
                    goal,
                    raised,
                    oldCause.donors || 0,
                    progress,
                    oldCause.location || null,
                    oldCause.impact || null,
                    oldCause.metric || null,
                    oldCause.gradient || null,
                    oldCause.size || null,
                    oldCause.glow || null,
                    oldCause.videoUrl || null,
                    oldCause.videoType || null,
                    oldCause.contentBlocks ? JSON.stringify(oldCause.contentBlocks) : null,
                    oldCause.seoTitle || null,
                    oldCause.seoDescription || null,
                    oldCause.seoKeywords || null,
                    'active', // Default status
                    false, // Default isFeatured
                    migrated, // Order based on position
                    0, // Default views
                ]
            );

            migrated++;
            console.log(`  ✓ Migrated: ${oldCause.title}`);
        } catch (error: any) {
            console.log(`  ❌ Error migrating "${oldCause.title}": ${error.message}`);
            skipped++;
        }
    }

    console.log(`  ✅ Migrated ${migrated} causes, skipped ${skipped}.`);
}

async function migrateDonations() {
    // Get existing donations from CMS
    const cmsItems = await dataSource.query(
        `SELECT data FROM cms_items WHERE key = 'donations'`
    );

    if (!cmsItems || cmsItems.length === 0) {
        console.log('  No existing donations found in CMS.');
        return;
    }

    const oldDonations: OldDonation[] = cmsItems[0].data || [];
    console.log(`  Found ${oldDonations.length} donations in CMS.`);

    // Check if donations already exist
    const existingCount = await dataSource.query(
        `SELECT COUNT(*) FROM donation`
    );

    if (parseInt(existingCount[0].count) > 0) {
        console.log('  Donations table already has data. Skipping migration.');
        return;
    }

    // Get cause map
    const causes = await dataSource.query(`SELECT id, title, slug FROM cause`);
    const causeMap = new Map<string, number>();
    for (const cause of causes) {
        causeMap.set(cause.title.toLowerCase(), cause.id);
        causeMap.set(cause.slug, cause.id);
        causeMap.set(String(cause.id), cause.id);
    }

    let migrated = 0;
    let skipped = 0;

    for (const oldDonation of oldDonations) {
        if (!oldDonation.transactionId && !oldDonation.id) {
            skipped++;
            continue;
        }

        const transactionId = oldDonation.transactionId || oldDonation.id;

        // Check for duplicate transaction
        const existing = await dataSource.query(
            `SELECT id FROM donation WHERE "transactionId" = $1`,
            [transactionId]
        );

        if (existing.length > 0) {
            console.log(`  ⚠ Skipped duplicate transaction: ${transactionId}`);
            skipped++;
            continue;
        }

        // Find cause ID
        let causeId: number | null = null;
        let causeName = oldDonation.campaignName || 'General Support';
        if (oldDonation.campaignId) {
            causeId = causeMap.get(oldDonation.campaignId) || null;
            if (causeId) {
                const cause = causes.find((c: any) => c.id === causeId);
                if (cause) {
                    causeName = cause.title;
                }
            }
        } else if (oldDonation.campaignName) {
            causeId = causeMap.get(oldDonation.campaignName.toLowerCase()) || null;
        }

        try {
            await dataSource.query(
                `INSERT INTO donation (
                    "transactionId", amount, currency, "causeId", "causeName",
                    status, "paymentMethod", "donorId", name, email, phone,
                    motivation, "isAnonymous", "createdAt", "updatedAt"
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())`,
                [
                    transactionId,
                    oldDonation.amount || 0,
                    oldDonation.currency || 'usd',
                    causeId,
                    causeName,
                    oldDonation.status || 'completed',
                    oldDonation.paymentMethod || 'Stripe',
                    oldDonation.donorId ? parseInt(oldDonation.donorId, 10) : null,
                    oldDonation.name || 'Anonymous',
                    oldDonation.email || null,
                    null, // phone
                    oldDonation.motivation || 'Online Donation',
                    !oldDonation.email, // isAnonymous
                ]
            );

            migrated++;
        } catch (error: any) {
            console.log(`  ❌ Error migrating donation "${transactionId}": ${error.message}`);
            skipped++;
        }
    }

    console.log(`  ✅ Migrated ${migrated} donations, skipped ${skipped}.`);
}

async function updateCauseStats() {
    // Update all cause statistics from donations
    const causes = await dataSource.query(`SELECT id FROM cause`);

    for (const cause of causes) {
        // Calculate total raised and donor count
        const result = await dataSource.query(
            `SELECT SUM(amount) as "totalRaised", COUNT(DISTINCT email) as "uniqueDonors"
             FROM donation
             WHERE "causeId" = $1 AND status = 'completed'`,
            [cause.id]
        );

        const totalRaised = parseFloat(result[0]?.totalRaised || '0');
        const uniqueDonors = parseInt(result[0]?.uniqueDonors || '0', 10);

        // Get goal and calculate progress
        const causeData = await dataSource.query(
            `SELECT goal FROM cause WHERE id = $1`,
            [cause.id]
        );

        const goal = parseFloat(causeData[0]?.goal || '0');
        const progress = goal > 0 ? Math.min(100, Math.round((totalRaised / goal) * 100)) : 0;

        await dataSource.query(
            `UPDATE cause SET raised = $1, donors = $2, progress = $3 WHERE id = $4`,
            [totalRaised, uniqueDonors, progress, cause.id]
        );
    }

    console.log(`  ✅ Updated statistics for ${causes.length} causes.`);
}

function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Run migration
migrate();