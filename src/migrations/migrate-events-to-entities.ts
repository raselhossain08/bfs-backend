/**
 * Migration Script: Migrate CMS JSONB Events to Proper Entities
 *
 * This script migrates:
 * - Events from cms_items (key: 'events') to events table
 * - Creates default event types from existing event categories
 *
 * Run with: ts-node src/migrations/migrate-events-to-entities.ts
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

interface OldEvent {
  id?: number;
  title: string;
  slug?: string;
  description?: string;
  content?: string;
  date?: string;
  location?: string;
  category?: string;
  attendees?: string;
  image?: string;
  status?: string;
  videoUrl?: string;
  videoType?: string;
  contentBlocks?: any[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
}

async function migrate() {
  console.log('🚀 Starting Events migration...\n');

  try {
    await dataSource.initialize();
    console.log('✅ Connected to database\n');

    // Step 1: Create default event types
    console.log('📋 Step 1: Creating default event types...');
    await createDefaultEventTypes();
    console.log('');

    // Step 2: Migrate Events
    console.log('📅 Step 2: Migrating Events...');
    await migrateEvents();
    console.log('');

    console.log('✨ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

async function createDefaultEventTypes() {
  // Check if event types already exist
  const existingCount = await dataSource.query(
    `SELECT COUNT(*) FROM event_type`,
  );

  if (parseInt(existingCount[0].count) > 0) {
    console.log('  Event types already exist. Skipping creation.');
    return;
  }

  // Default event types
  const defaultTypes = [
    {
      name: 'Mission',
      slug: 'mission',
      description: 'Field missions and outreach programs',
      color: '#0d9488',
      order: 1,
    },
    {
      name: 'Fundraiser',
      slug: 'fundraiser',
      description: 'Fundraising events and campaigns',
      color: '#f59e0b',
      order: 2,
    },
    {
      name: 'Community',
      slug: 'community',
      description: 'Community engagement events',
      color: '#10b981',
      order: 3,
    },
    {
      name: 'Workshop',
      slug: 'workshop',
      description: 'Educational workshops and training sessions',
      color: '#6366f1',
      order: 4,
    },
    {
      name: 'Conference',
      slug: 'conference',
      description: 'Conferences and large gatherings',
      color: '#8b5cf6',
      order: 5,
    },
    {
      name: 'Other',
      slug: 'other',
      description: 'Other events',
      color: '#64748b',
      order: 6,
    },
  ];

  for (const type of defaultTypes) {
    await dataSource.query(
      `INSERT INTO event_type (name, slug, description, color, "order", status, "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [
        type.name,
        type.slug,
        type.description,
        type.color,
        type.order,
        'active',
      ],
    );
    console.log(`  ✓ Created event type: ${type.name}`);
  }

  console.log(`  ✅ Created ${defaultTypes.length} default event types.`);
}

async function migrateEvents() {
  // Get existing events from CMS
  const cmsItems = await dataSource.query(
    `SELECT data FROM cms_items WHERE key = 'events'`,
  );

  if (!cmsItems || cmsItems.length === 0) {
    console.log('  No existing events found in CMS.');
    return;
  }

  const oldEvents: OldEvent[] = cmsItems[0].data || [];
  console.log(`  Found ${oldEvents.length} events in CMS.`);

  // Check if events already exist
  const existingCount = await dataSource.query(`SELECT COUNT(*) FROM event`);

  if (parseInt(existingCount[0].count) > 0) {
    console.log('  Events table already has data. Skipping migration.');
    return;
  }

  // Get event type name to ID mapping
  const eventTypes = await dataSource.query(`SELECT id, name FROM event_type`);
  const eventTypeNameToId: Map<string, number> = new Map();
  eventTypes.forEach((type: any) => {
    eventTypeNameToId.set(type.name, type.id);
  });

  let migrated = 0;
  let skipped = 0;

  for (const oldEvent of oldEvents) {
    if (!oldEvent.title) {
      skipped++;
      continue;
    }

    const slug = oldEvent.slug || generateSlug(oldEvent.title);

    // Check for duplicate slug
    const existing = await dataSource.query(
      `SELECT id FROM event WHERE slug = $1`,
      [slug],
    );

    if (existing.length > 0) {
      console.log(`  ⚠ Skipped duplicate slug: ${slug}`);
      skipped++;
      continue;
    }

    // Get event type ID
    const eventTypeId = oldEvent.category
      ? eventTypeNameToId.get(oldEvent.category)
      : null;

    try {
      await dataSource.query(
        `INSERT INTO event (
                    title, slug, description, content, "startDate", location,
                    "eventTypeId", "eventTypeName", status, image, "videoUrl", "videoType",
                    "contentBlocks", "metaTitle", "metaDescription", views, likes,
                    "currentAttendees", "createdAt", "updatedAt"
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())`,
        [
          oldEvent.title,
          slug,
          oldEvent.description || null,
          oldEvent.content || null,
          oldEvent.date ? new Date(oldEvent.date) : new Date(),
          oldEvent.location || null,
          eventTypeId || null,
          oldEvent.category || null,
          mapStatus(oldEvent.status),
          oldEvent.image || null,
          oldEvent.videoUrl || null,
          oldEvent.videoType || null,
          oldEvent.contentBlocks
            ? JSON.stringify(oldEvent.contentBlocks)
            : null,
          oldEvent.seoTitle || null,
          oldEvent.seoDescription || null,
          0, // views
          0, // likes
          0, // currentAttendees
        ],
      );

      migrated++;
      console.log(`  ✓ Migrated: ${oldEvent.title}`);
    } catch (error: any) {
      console.log(`  ❌ Error migrating "${oldEvent.title}": ${error.message}`);
      skipped++;
    }
  }

  console.log(`  ✅ Migrated ${migrated} events, skipped ${skipped}.`);
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function mapStatus(oldStatus?: string): string {
  const statusMap: Record<string, string> = {
    Upcoming: 'Upcoming',
    Ongoing: 'Ongoing',
    Completed: 'Completed',
    Cancelled: 'Cancelled',
    Draft: 'Draft',
  };
  return statusMap[oldStatus || ''] || 'Upcoming';
}

// Run migration
migrate();
