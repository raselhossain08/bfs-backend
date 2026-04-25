/**
 * Migration Script: Migrate CMS JSONB Articles to Proper Entities
 *
 * This script migrates:
 * - Articles from cms_items (key: 'articles') to articles table
 * - Creates default article categories
 * - Seeds default articles if none exist in CMS
 *
 * Run with: npx ts-node src/migrations/migrate-articles-to-entities.ts
 */

import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

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

interface OldArticle {
  id?: number;
  title: string;
  slug?: string;
  description?: string;
  content?: string;
  image?: string;
  images?: any;
  videoUrl?: string;
  author?: string | { name: string; image?: string; bio?: string };
  authorImage?: string;
  authorBio?: string;
  category?: string | { name: string };
  categoryName?: string;
  tags?: string[];
  date?: string;
  status?: string;
  featured?: boolean;
  views?: number;
  likes?: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  contentBlocks?: any;
}

async function migrate() {
  console.log('Starting Articles migration...\n');

  try {
    await dataSource.initialize();
    console.log('Connected to database\n');

    console.log('Step 1: Creating default article categories...');
    await createDefaultCategories();
    console.log('');

    console.log('Step 2: Migrating Articles from CMS...');
    const migratedCount = await migrateArticles();
    console.log('');

    if (migratedCount === 0) {
      console.log('Step 3: Seeding default articles...');
      await seedDefaultArticles();
      console.log('');
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

async function createDefaultCategories() {
  const existingCount = await dataSource.query(`SELECT COUNT(*) FROM category`);

  if (parseInt(existingCount[0].count) > 0) {
    console.log('  Categories already exist. Skipping creation.');
    return;
  }

  const defaultCategories = [
    {
      name: 'Organization News',
      slug: 'organization-news',
      description: 'Updates and news from BirdsFly Sangstha',
      color: '#0d9488',
      order: 1,
    },
    {
      name: 'Community Support',
      slug: 'community-support',
      description: 'Stories about community development and support',
      color: '#6366f1',
      order: 2,
    },
    {
      name: 'Healthcare',
      slug: 'healthcare',
      description: 'Health and medical initiatives',
      color: '#ef4444',
      order: 3,
    },
    {
      name: 'Education',
      slug: 'education',
      description: 'Educational programs and literacy',
      color: '#f59e0b',
      order: 4,
    },
    {
      name: 'Environment',
      slug: 'environment',
      description: 'Environmental conservation and sustainability',
      color: '#22c55e',
      order: 5,
    },
    {
      name: 'Empowerment',
      slug: 'empowerment',
      description: 'Women and youth empowerment stories',
      color: '#ec4899',
      order: 6,
    },
    {
      name: 'Impact Stories',
      slug: 'impact-stories',
      description: 'Real stories of transformation and hope',
      color: '#8b5cf6',
      order: 7,
    },
  ];

  for (const category of defaultCategories) {
    await dataSource.query(
      `INSERT INTO category (name, slug, description, color, "iconColor", "order", status, "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [
        category.name,
        category.slug,
        category.description,
        category.color,
        category.color,
        category.order,
        'active',
      ],
    );
    console.log(`  Created category: ${category.name}`);
  }

  console.log(`  Created ${defaultCategories.length} default categories.`);
}

async function migrateArticles(): Promise<number> {
  const existingCount = await dataSource.query(`SELECT COUNT(*) FROM article`);

  if (parseInt(existingCount[0].count) > 0) {
    console.log('  Articles table already has data. Skipping migration.');
    return 1;
  }

  let cmsItems: any[] = [];
  try {
    cmsItems = await dataSource.query(
      `SELECT data FROM cms_items WHERE key = 'articles'`,
    );
  } catch {
    console.log('  CMS table not found. Skipping CMS migration.');
    return 0;
  }

  if (!cmsItems || cmsItems.length === 0) {
    console.log('  No articles found in CMS data.');
    return 0;
  }

  const oldArticles: OldArticle[] = cmsItems[0].data || [];
  console.log(`  Found ${oldArticles.length} articles in CMS.`);

  if (oldArticles.length === 0) {
    return 0;
  }

  let migrated = 0;
  let skipped = 0;

  for (const oldArticle of oldArticles) {
    if (!oldArticle.title) {
      skipped++;
      continue;
    }

    const slug = oldArticle.slug || generateSlug(oldArticle.title);

    const existing = await dataSource.query(
      `SELECT id FROM article WHERE slug = $1`,
      [slug],
    );

    if (existing.length > 0) {
      console.log(`  Skipped duplicate slug: ${slug}`);
      skipped++;
      continue;
    }

    const categoryName =
      typeof oldArticle.category === 'string'
        ? oldArticle.category
        : oldArticle.category?.name || null;

    let categoryId: number | null = null;
    if (categoryName) {
      const catResult = await dataSource.query(
        `SELECT id FROM category WHERE name ILIKE $1 LIMIT 1`,
        [categoryName],
      );
      if (catResult.length > 0) {
        categoryId = catResult[0].id;
      }
    }

    const authorName =
      typeof oldArticle.author === 'string'
        ? oldArticle.author
        : oldArticle.author?.name || null;

    const authorImage =
      typeof oldArticle.author === 'object'
        ? oldArticle.author?.image || oldArticle.authorImage || null
        : oldArticle.authorImage || null;

    const authorBioVal =
      typeof oldArticle.author === 'object'
        ? oldArticle.author?.bio || oldArticle.authorBio || null
        : oldArticle.authorBio || null;

    const status = oldArticle.status || 'published';
    const publishedAt =
      status === 'published'
        ? oldArticle.date || new Date().toISOString()
        : null;

    try {
      await dataSource.query(
        `INSERT INTO article (
                    title, slug, description, content, image,
                    author, "authorImage", "authorBio",
                    "categoryId", "categoryName",
                    status, featured, tags,
                    views, likes,
                    "metaTitle", "metaDescription", "contentBlocks",
                    "videoUrl", images,
                    "publishedAt", "createdAt", "updatedAt"
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW(), NOW())`,
        [
          oldArticle.title,
          slug,
          oldArticle.description || null,
          oldArticle.content || null,
          oldArticle.image || null,
          authorName,
          authorImage,
          authorBioVal,
          categoryId,
          categoryName,
          status,
          oldArticle.featured || false,
          oldArticle.tags ? JSON.stringify(oldArticle.tags) : null,
          oldArticle.views || 0,
          oldArticle.likes || 0,
          oldArticle.seoTitle || null,
          oldArticle.seoDescription || null,
          oldArticle.contentBlocks
            ? JSON.stringify(oldArticle.contentBlocks)
            : null,
          oldArticle.videoUrl || null,
          oldArticle.images
            ? typeof oldArticle.images === 'string'
              ? oldArticle.images
              : JSON.stringify(oldArticle.images)
            : null,
          publishedAt,
        ],
      );

      migrated++;
      console.log(`  Migrated: ${oldArticle.title}`);
    } catch (error: any) {
      console.log(`  Error migrating "${oldArticle.title}": ${error.message}`);
      skipped++;
    }
  }

  console.log(`  Migrated ${migrated} articles, skipped ${skipped}.`);
  return migrated;
}

async function seedDefaultArticles() {
  const existingCount = await dataSource.query(`SELECT COUNT(*) FROM article`);

  if (parseInt(existingCount[0].count) > 0) {
    console.log('  Articles already exist. Skipping seed.');
    return;
  }

  const categories = await dataSource.query(`SELECT id, name FROM category`);
  const getCategoryId = (name: string): number | null => {
    const cat = categories.find((c: any) => c.name === name);
    return cat?.id || null;
  };

  const defaultArticles = [
    {
      title: 'Building Resilience Through Community Empowerment',
      slug: 'resilience-community-empowerment',
      description:
        'How local leadership nodes are transforming disaster response protocols in coastal Bangladesh.',
      content:
        'In the coastal districts of Satkhira, where cyclones and flooding are a recurring reality, community resilience is not just a concept — it is a survival strategy. BirdsFly Sangstha has been working with local leaders to establish Community Resilience Hubs that serve as both disaster preparedness centers and platforms for civic engagement.\n\nThese hubs are managed by trained local volunteers who coordinate early warning systems, maintain emergency supply caches, and lead evacuation drills. What makes this approach unique is its emphasis on local ownership — every decision, from hub placement to resource allocation, is made by the community itself.\n\nOur data shows that villages with active resilience hubs respond 40% faster to cyclone warnings and experience 60% fewer casualties compared to non-participating villages. This model is now being replicated across three additional upazilas in Satkhira District.\n\nThe key to success lies in empowering local voices. Women, who are often the most vulnerable during disasters, now lead 65% of our resilience committees. Their perspective has proven invaluable in identifying at-risk households and ensuring no one is left behind during evacuations.\n\nAs climate change intensifies, community-based approaches like these are not optional — they are essential. BirdsFly Sangstha remains committed to building resilience from the ground up, one community at a time.',
      image:
        'https://images.unsplash.com/photo-1593113630400-ea4288922497?q=80&w=1200',
      authorName: 'Ahmed Rahman',
      authorImage: 'https://i.pravatar.cc/150?u=ahmed',
      authorBio:
        'Field Coordinator with 8 years of experience in disaster response across coastal Bangladesh.',
      categoryName: 'Community Support',
      categoryId: getCategoryId('Community Support'),
      tags: JSON.stringify([
        'community',
        'resilience',
        'disaster-response',
        'empowerment',
      ]),
      status: 'published',
      featured: true,
      views: 234,
      likes: 45,
      publishedAt: '2026-02-10T00:00:00.000Z',
    },
    {
      title: 'Sustainable Solutions for Clean Water Access',
      slug: 'sustainable-water-solutions',
      description:
        'Deploying high-precision filtration nodes to ensure safe water access in rural sectors.',
      content:
        'Access to clean water remains one of the most critical challenges facing rural communities in Satkhira. With arsenic contamination affecting over 30% of shallow tube wells and salinity intrusion rendering many water sources unusable, families are forced to travel long distances for safe drinking water.\n\nBirdsFly Sangstha has launched a comprehensive Water, Sanitation, and Hygiene (WASH) program that combines reverse osmosis technology with community-managed distribution systems. Our RO plants, installed in partnerships with local government, now serve over 5,000 families across six unions.\n\nBut technology alone is not enough. We have established Water User Committees — democratically elected bodies that manage plant operations, collect nominal user fees, and ensure equitable distribution. Women compose 70% of committee membership, reflecting their central role in household water management.\n\nThe results speak for themselves: waterborne diseases in project areas have decreased by 75%, and families report saving an average of 2.5 hours daily that were previously spent collecting water. Children, especially girls, are using this time to attend school regularly.\n\nOur next phase will extend coverage to three additional unions and pilot rainwater harvesting systems for areas where piped distribution is not feasible. Sustainability is not just about technology — it is about building systems that communities can maintain and scale independently.',
      image:
        'https://images.unsplash.com/photo-1541810270-3882d634017f?q=80&w=1200',
      authorName: 'Fatima Akter',
      authorImage: 'https://i.pravatar.cc/150?u=fatima',
      authorBio:
        'Healthcare Lead specializing in WASH programs and community health initiatives.',
      categoryName: 'Healthcare',
      categoryId: getCategoryId('Healthcare'),
      tags: JSON.stringify(['water', 'wash', 'healthcare', 'sustainability']),
      status: 'published',
      featured: true,
      views: 189,
      likes: 38,
      publishedAt: '2026-02-12T00:00:00.000Z',
    },
    {
      title: 'Empowering Next Generation Through Digital Literacy',
      slug: 'digital-literacy-empowerment',
      description:
        'Upgrading rural education nodes with tactical digital toolkits and remote learning.',
      content:
        "In a world increasingly driven by technology, digital literacy is no longer optional — it is a fundamental right. Yet for thousands of young people in Satkhira's rural communities, access to computers and the internet remains a distant dream.\n\nBirdsFly Sangstha's Digital Literacy Program is changing that narrative. Since 2024, we have established 12 Digital Learning Centers across Satkhira District, each equipped with computers, high-speed internet, and trained facilitators. These centers serve over 1,500 students aged 12-25, providing courses ranging from basic computer skills to web development and graphic design.\n\nOur curriculum is designed in partnership with industry professionals to ensure relevance in the job market. Students who complete the advanced track have a 78% employment rate within six months — a remarkable achievement in a region where youth unemployment exceeds 40%.\n\nBeyond employment, digital literacy opens doors to remote learning opportunities. During the pandemic, our centers became lifelines for students unable to attend school, providing access to online classes and educational resources that would otherwise have been unavailable.\n\nThe program's success has attracted attention from international donors, and we plan to expand to 25 centers by the end of 2026. Every young person deserves the chance to participate in the digital economy, and we are committed to making that happen.",
      image:
        'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200',
      authorName: 'Ayesha Siddique',
      authorImage: 'https://i.pravatar.cc/150?u=ayesha',
      authorBio:
        'Digital Trainer and Education Program Coordinator with a passion for bridging the digital divide.',
      categoryName: 'Education',
      categoryId: getCategoryId('Education'),
      tags: JSON.stringify([
        'education',
        'digital-literacy',
        'youth',
        'empowerment',
      ]),
      status: 'published',
      featured: false,
      views: 156,
      likes: 32,
      publishedAt: '2026-02-15T00:00:00.000Z',
    },
    {
      title: 'Women Empowerment Through Vocational Training',
      slug: 'women-empowerment-vocational',
      description:
        'Creating economic opportunities for women through skill development programs.',
      content:
        "Economic independence is the cornerstone of women's empowerment. In Satkhira, where traditional gender roles often limit women's access to income-generating activities, BirdsFly Sangstha's Vocational Training Program is creating new pathways to financial self-sufficiency.\n\nOur program offers training in tailoring, food processing, handicrafts, and basic entrepreneurship. Since its inception, over 800 women have completed the program, and 65% have started their own micro-enterprises. Monthly income for successful participants averages between BDT 8,000-15,000 — a transformative amount in communities where the average household income is BDT 12,000.\n\nBut the impact goes beyond income. Participants report increased confidence, greater decision-making power within their households, and improved social standing. Their children, particularly daughters, are more likely to stay in school.\n\nWe have also established cooperative groups where women pool resources, share market access, and provide mutual support. These cooperatives have become powerful advocacy platforms, lobbying local government for better services and pushing back against practices like child marriage.\n\nOur goal is to reach 2,000 women by 2027, with expanded training modules in digital marketing and e-commerce — skills that can connect rural producers to national and international markets.",
      image:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1200',
      authorName: 'Sarah Khan',
      authorImage: 'https://i.pravatar.cc/150?u=sarah',
      authorBio:
        'Program Lead for Women Empowerment initiatives across Satkhira District.',
      categoryName: 'Empowerment',
      categoryId: getCategoryId('Empowerment'),
      tags: JSON.stringify([
        'women',
        'empowerment',
        'vocational-training',
        'livelihoods',
      ]),
      status: 'published',
      featured: false,
      views: 142,
      likes: 28,
      publishedAt: '2026-02-18T00:00:00.000Z',
    },
    {
      title: 'Protecting the Sundarbans: Our Mangrove Conservation Efforts',
      slug: 'sundarbans-mangrove-conservation',
      description:
        'How community-led mangrove restoration is protecting coastal ecosystems and livelihoods.',
      content:
        "The Sundarbans, the world's largest mangrove forest, is under threat. Rising sea levels, illegal logging, and industrial pollution are eroding this critical ecosystem at an alarming rate. For the coastal communities of Satkhira, the Sundarbans is not just a forest — it is a shield against cyclones, a source of livelihood, and a cultural heritage site.\n\nBirdsFly Sangstha's Mangrove Conservation Program takes a dual approach: restoration and protection. Since 2023, we have planted over 50,000 mangrove saplings across 200 hectares of degraded coastline, with a survival rate of 82% — well above the regional average of 55%.\n\nOur approach is community-led. Local fishing communities, who have the most intimate knowledge of the ecosystem, serve as guardians. They monitor plantations, report illegal activities, and lead replanting drives. In return, they receive alternative livelihood support, reducing their dependence on forest resources.\n\nEcological monitoring shows encouraging results: biodiversity indices in restored areas have increased by 35%, and shoreline erosion has slowed significantly. Crab populations, a key indicator species, have rebounded in plantation zones.\n\nThe fight to save the Sundarbans is far from over, but with sustained community engagement and scientific management, we are proving that conservation and livelihoods can coexist.",
      image:
        'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1200',
      authorName: 'Dr. Kamal Hossain',
      authorImage: 'https://i.pravatar.cc/150?u=kamal',
      authorBio:
        'Environmental scientist leading mangrove conservation research in coastal Bangladesh.',
      categoryName: 'Environment',
      categoryId: getCategoryId('Environment'),
      tags: JSON.stringify([
        'environment',
        'sundarbans',
        'mangrove',
        'conservation',
      ]),
      status: 'published',
      featured: false,
      views: 198,
      likes: 41,
      publishedAt: '2026-03-01T00:00:00.000Z',
    },
    {
      title:
        "Launching BirdsFly Sangstha: A New Chapter for Satkhira's Coastal Communities",
      slug: 'birdsfly-sangstha-launch-satkhira',
      description:
        'Introducing BirdsFly Sangstha, a new NGO based in Satkhira District, Bangladesh, committed to building resilience, sustainability, and social justice across 12 focus areas.',
      content:
        'We are excited to announce the official launch of BirdsFly Sangstha, a non-governmental organization based at Bosundhora Tower, 3rd Floor, Satkhira. Since 2022, we have been working quietly to understand the needs of our coastal communities and develop programs that create real impact.\n\nOur 12 focus areas cover the full spectrum of coastal life:\n\n1. Climate Change & Disaster Risk Reduction - Cyclone preparedness, embankment protection, coastal afforestation\n2. Water, Sanitation & Hygiene (WASH) - RO plants, rainwater harvesting, arsenic-free water\n3. Sustainable Agriculture & Food Security - Salt-tolerant crops, cage fish farming, organic fertilizers\n4. Public Health & Nutrition - Maternal health, child nutrition, disease prevention\n5. Education & Skill Development - Non-formal education, ICT training, vocational skills\n6. Women Empowerment & Gender Equality - Anti-child marriage, legal aid, entrepreneurship\n7. Environment & Biodiversity Conservation - Sundarbans protection, plastic pollution control\n8. Child Protection & Rights - Eliminating child labor, rehabilitating street children\n9. Governance & Human Rights - Access to services, transparency, land rights\n10. Youth Development & Volunteerism - Social work engagement, anti-drug campaigns\n11. Technology & Innovation - Drones in agriculture, e-learning, digital services\n12. Cyber Security Awareness - Online safety, secure digital practices\n\nWe invite you to join us in our mission. Whether through volunteering, donations, or partnerships, together we can build resilient coastal communities in Satkhira.\n\nContact us: 01727009448\nEmail: birdsflysangstha@gmail.com\nAddress: Bosundhora Tower, 3rd Floor, Satkhira, Bangladesh',
      image:
        'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1200',
      authorName: 'BirdsFly Sangstha Team',
      authorImage: 'https://i.pravatar.cc/150?u=birdsfly',
      authorBio: 'Founding Team of BirdsFly Sangstha.',
      categoryName: 'Organization News',
      categoryId: getCategoryId('Organization News'),
      tags: JSON.stringify([
        'launch',
        'satkhira',
        'coastal-communities',
        'ngo',
        'bangladesh',
      ]),
      status: 'published',
      featured: true,
      views: 500,
      likes: 67,
      publishedAt: '2026-04-11T00:00:00.000Z',
    },
  ];

  let seeded = 0;
  for (const article of defaultArticles) {
    try {
      await dataSource.query(
        `INSERT INTO article (
                    title, slug, description, content, image,
                    author, "authorImage", "authorBio",
                    "categoryId", "categoryName",
                    status, featured, tags,
                    views, likes,
                    "publishedAt", "createdAt", "updatedAt"
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())`,
        [
          article.title,
          article.slug,
          article.description,
          article.content,
          article.image,
          article.authorName,
          article.authorImage,
          article.authorBio,
          article.categoryId,
          article.categoryName,
          article.status,
          article.featured,
          article.tags,
          article.views,
          article.likes,
          article.publishedAt,
        ],
      );
      seeded++;
      console.log(`  Seeded: ${article.title}`);
    } catch (error: any) {
      console.log(`  Error seeding "${article.title}": ${error.message}`);
    }
  }

  console.log(`  Seeded ${seeded} default articles.`);
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

migrate();
