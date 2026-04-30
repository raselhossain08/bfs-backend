/**
 * Seed Causes Data
 * Run with: npx ts-node src/migrations/seed-causes.ts
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

const categories = [
  {
    name: 'Healthcare',
    slug: 'healthcare',
    description: 'Medical initiatives and health programs',
    icon: 'Heart',
    color: '#10b981',
    order: 1,
    status: 'active',
  },
  {
    name: 'Education',
    slug: 'education',
    description: 'Educational programs and literacy',
    icon: 'BookOpen',
    color: '#6366f1',
    order: 2,
    status: 'active',
  },
  {
    name: 'Climate Resilience',
    slug: 'climate-resilience',
    description: 'Disaster preparedness and climate adaptation',
    icon: 'CloudSun',
    color: '#22c55e',
    order: 3,
    status: 'active',
  },
  {
    name: 'Clean Water',
    slug: 'clean-water',
    description: 'WASH programs and safe water access',
    icon: 'Droplet',
    color: '#0ea5e9',
    order: 4,
    status: 'active',
  },
  {
    name: 'Food Security',
    slug: 'food-security',
    description: 'Sustainable agriculture and nutrition',
    icon: 'Wheat',
    color: '#f59e0b',
    order: 5,
    status: 'active',
  },
  {
    name: 'Community Development',
    slug: 'community-development',
    description: 'Infrastructure and local empowerment',
    icon: 'Building2',
    color: '#8b5cf6',
    order: 6,
    status: 'active',
  },
  {
    name: 'Women Empowerment',
    slug: 'women-empowerment',
    description: 'Gender equality and economic independence',
    icon: 'UserCheck',
    color: '#ec4899',
    order: 7,
    status: 'active',
  },
  {
    name: 'Disaster Relief',
    slug: 'disaster-relief',
    description: 'Emergency response and recovery',
    icon: 'ShieldAlert',
    color: '#ef4444',
    order: 8,
    status: 'active',
  },
];

const causes = [
  {
    title: 'Emergency Cyclone Shelter Construction',
    slug: 'cyclone-shelter-construction',
    shortDescription:
      'Building climate-resilient cyclone shelters to protect vulnerable coastal communities in Satkhira.',
    description:
      'Coastal Bangladesh faces increasing cyclone intensity due to climate change. BirdsFly Sangstha is constructing multi-purpose cyclone shelters that serve as schools and community centers during fair weather, transforming into life-saving refuges during storms.',
    content:
      'Our cyclone shelter program addresses the critical infrastructure gap in Satkhira District. Current shelters can accommodate only 30% of the population, leaving thousands exposed to the devastating impacts of cyclones Amphan and Yaas.\n\nEach shelter is designed to:\n- Withstand wind speeds of up to 260 km/h\n- Accommodate 500-800 people with separate areas for women and children\n- Include rainwater harvesting systems\n- Function as a community center and school during non-emergency periods\n- Feature solar power for off-grid operation\n\nWe have completed 3 shelters and plan 5 more by 2027, potentially saving thousands of lives.',
    image:
      'https://images.unsplash.com/photo-1593113630400-ea4288922497?q=80&w=1200',
    categoryId: 3,
    tag: 'Urgent',
    tagColor: '#ef4444',
    goal: 75000,
    raised: 28500,
    donors: 89,
    progress: 38,
    location: 'Satkhira, Bangladesh',
    impact:
      'Each shelter protects 500-800 people during cyclones, reducing casualty rates by up to 80%.',
    metric: '3,200 lives protected',
    status: 'active',
    isFeatured: true,
    metaTitle: 'Cyclone Shelter Construction - BirdsFly Sangstha',
    metaDescription:
      'Help build climate-resilient cyclone shelters in coastal Bangladesh. Each shelter protects 500-800 people during storms.',
  },
  {
    title: 'Safe Water for Every Family',
    slug: 'safe-water-every-family',
    shortDescription:
      'Installing reverse osmosis plants and rainwater systems to provide arsenic-free, safe drinking water.',
    description:
      'Over 30% of shallow tube wells in Satkhira contain dangerous levels of arsenic. Our WASH program installs RO plants and rainwater harvesting systems, ensuring every family has access to safe drinking water.',
    content:
      'Access to clean water remains one of the most critical challenges facing rural communities in Satkhira. With arsenic contamination affecting over 30% of shallow tube wells and salinity intrusion rendering many water sources unusable, families are forced to travel long distances for safe drinking water.\n\nOur WASH program combines reverse osmosis technology with community-managed distribution systems. Our RO plants now serve over 5,000 families across six unions.\n\nWater User Committees — democratically elected bodies that manage plant operations — ensure equitable distribution. Women compose 70% of committee membership, reflecting their central role in household water management.\n\nResults: waterborne diseases decreased by 75%, and families save 2.5 hours daily previously spent collecting water.',
    image:
      'https://images.unsplash.com/photo-1541810270-3882d634017f?q=80&w=1200',
    categoryId: 4,
    tag: 'WASH',
    tagColor: '#0ea5e9',
    goal: 50000,
    raised: 32500,
    donors: 156,
    progress: 65,
    location: 'Satkhira District, Bangladesh',
    impact:
      '5,000+ families now have access to safe drinking water, reducing waterborne diseases by 75%.',
    metric: '5,000 families served',
    status: 'active',
    isFeatured: true,
    metaTitle: 'Safe Water Access - BirdsFly Sangstha',
    metaDescription:
      'Provide arsenic-free safe drinking water to families in Satkhira. Our RO plants serve 5,000+ families.',
  },
  {
    title: 'Digital Literacy Centers for Youth',
    slug: 'digital-literacy-centers-youth',
    shortDescription:
      'Establishing digital learning centers with computers, internet, and trained facilitators for rural youth.',
    description:
      "BirdsFly Sangstha's Digital Literacy Program is bridging the digital divide for 1,500+ students across 12 centers in Satkhira District.",
    content:
      "In a world increasingly driven by technology, digital literacy is no longer optional — it is a fundamental right. Yet for thousands of young people in Satkhira's rural communities, access to computers and the internet remains a distant dream.\n\nOur Digital Literacy Program has established 12 centers equipped with computers, high-speed internet, and trained facilitators. Students aged 12-25 learn basic computer skills through web development and graphic design.\n\nStudents completing the advanced track have a 78% employment rate within six months — remarkable in a region where youth unemployment exceeds 40%. Beyond employment, digital literacy opens doors to remote learning and economic opportunities.",
    image:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200',
    categoryId: 2,
    tag: 'Education',
    tagColor: '#6366f1',
    goal: 35000,
    raised: 14000,
    donors: 67,
    progress: 40,
    location: 'Satkhira District, Bangladesh',
    impact:
      '1,500+ students trained with 78% employment rate within 6 months of graduation.',
    metric: '1,500 students trained',
    status: 'active',
    isFeatured: false,
    metaTitle: 'Digital Literacy Centers - BirdsFly Sangstha',
    metaDescription:
      'Support digital literacy for rural youth in Bangladesh. 12 centers serving 1,500+ students with 78% job placement.',
  },
  {
    title: "Women's Vocational Training Program",
    slug: 'womens-vocational-training',
    shortDescription:
      'Creating economic independence for women through skill development in tailoring, food processing, and entrepreneurship.',
    description:
      'Over 800 women have completed our vocational training program, with 65% starting their own micro-enterprises earning BDT 8,000-15,000 monthly.',
    content:
      "Economic independence is the cornerstone of women's empowerment. In Satkhira, traditional gender roles often limit women's access to income-generating activities.\n\nOur program offers training in tailoring, food processing, handicrafts, and entrepreneurship. Since its inception, over 800 women have completed the program, and 65% have started micro-enterprises. Monthly income averages BDT 8,000-15,000 — transformative in communities where average household income is BDT 12,000.\n\nParticipants report increased confidence, greater decision-making power, and improved social standing. Their children, particularly daughters, are more likely to stay in school.\n\nWe have also established cooperative groups where women pool resources and provide mutual support. These cooperatives lobby local government for better services.",
    image:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1200',
    categoryId: 7,
    tag: 'Empowerment',
    tagColor: '#ec4899',
    goal: 25000,
    raised: 9500,
    donors: 43,
    progress: 38,
    location: 'Satkhira, Bangladesh',
    impact:
      '800+ women trained, 65% started micro-enterprises with average monthly income of BDT 8,000-15,000.',
    metric: '800 women empowered',
    status: 'active',
    isFeatured: false,
    metaTitle: 'Women Vocational Training - BirdsFly Sangstha',
    metaDescription:
      'Empower women through vocational training in Bangladesh. 800+ women trained, 65% started businesses.',
  },
  {
    title: 'Sundarbans Mangrove Restoration',
    slug: 'sundarbans-mangrove-restoration',
    shortDescription:
      "Community-led mangrove restoration to protect coastal ecosystems and the world's largest mangrove forest.",
    description:
      'Planting 50,000+ mangrove saplings across 200 hectares with community guardians and alternative livelihood support for fishing communities.',
    content:
      "The Sundarbans is under threat from rising sea levels, illegal logging, and industrial pollution. BirdsFly Sangstha's Mangrove Conservation Program takes a dual approach: restoration and protection.\n\nSince 2023, we have planted over 50,000 mangrove saplings across 200 hectares with an 82% survival rate — well above the regional average of 55%.\n\nLocal fishing communities serve as guardians, monitoring plantations and reporting illegal activities. In return, they receive alternative livelihood support, reducing dependence on forest resources.\n\nBiodiversity indices in restored areas have increased by 35%, and shoreline erosion has slowed significantly. Crab populations, a key indicator species, have rebounded in plantation zones.",
    image:
      'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1200',
    categoryId: 3,
    tag: 'Environment',
    tagColor: '#22c55e',
    goal: 40000,
    raised: 18000,
    donors: 72,
    progress: 45,
    location: 'Sundarbans Buffer Zone, Satkhira',
    impact:
      '50,000+ mangroves planted across 200 hectares with 82% survival rate. Biodiversity increased 35%.',
    metric: '200 hectares restored',
    status: 'active',
    isFeatured: true,
    metaTitle: 'Sundarbans Mangrove Conservation - BirdsFly Sangstha',
    metaDescription:
      'Protect the Sundarbans by planting mangroves. 50,000+ saplings planted with 82% survival rate across 200 hectares.',
  },
  {
    title: 'Maternal & Child Health Initiative',
    slug: 'maternal-child-health-initiative',
    shortDescription:
      'Reducing maternal and infant mortality through community health workers, prenatal care, and nutrition programs.',
    description:
      'Training community health workers and establishing prenatal care centers to reduce maternal mortality by 60% in target areas.',
    content:
      'Maternal and infant mortality rates in rural Satkhira remain alarmingly high, with limited access to qualified medical professionals. Our Maternal & Child Health Initiative trains community health workers (CHWs) who provide prenatal checkups, nutrition counseling, and emergency referral services.\n\nWe have trained 35 CHWs serving 15 unions, conducted 2,400+ prenatal checkups, and reduced maternal mortality by 60% in our target areas. Our nutrition program provides supplements to 800+ pregnant women and new mothers.\n\nThe program includes telemedicine links to district hospitals, ensuring that high-risk pregnancies receive specialist attention.',
    image:
      'https://images.unsplash.com/photo-1538108149392-fbbd81895907?q=80&w=1200',
    categoryId: 1,
    tag: 'Healthcare',
    tagColor: '#10b981',
    goal: 30000,
    raised: 7200,
    donors: 31,
    progress: 24,
    location: 'Satkhira District, Bangladesh',
    impact:
      '35 community health workers trained, 2,400+ prenatal checkups conducted, 60% reduction in maternal mortality.',
    metric: '60% mortality reduction',
    status: 'active',
    isFeatured: false,
    metaTitle: 'Maternal Child Health - BirdsFly Sangstha',
    metaDescription:
      'Reduce maternal mortality in Bangladesh. 35 health workers trained, 2,400+ checkups, 60% mortality reduction.',
  },
];

async function seed() {
  console.log('Starting causes seed...\n');
  try {
    await dataSource.initialize();
    console.log('Connected to database\n');

    // Seed categories
    const existingCats = await dataSource.query(
      'SELECT COUNT(*) FROM cause_category',
    );
    if (
      parseInt(existingCats[0].count) === 0 ||
      parseInt(existingCats[0].count) <= 1
    ) {
      // Delete causes first (FK constraint), then test category
      await dataSource.query('DELETE FROM cause');
      await dataSource.query('DELETE FROM cause_category');
      for (const cat of categories) {
        await dataSource.query(
          `INSERT INTO cause_category (name, slug, description, icon, color, "order", status, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
          [
            cat.name,
            cat.slug,
            cat.description,
            cat.icon,
            cat.color,
            cat.order,
            cat.status,
          ],
        );
        console.log(`  Created category: ${cat.name}`);
      }
    } else {
      console.log('  Categories already exist. Skipping.');
    }

    // Seed causes
    const existingCauses = await dataSource.query('SELECT COUNT(*) FROM cause');
    if (parseInt(existingCauses[0].count) <= 2) {
      // Delete test causes
      await dataSource.query('DELETE FROM cause');
      // Get category IDs
      const catRows = await dataSource.query(
        'SELECT id, slug FROM cause_category',
      );
      const catMap: Record<string, number> = {};
      for (const row of catRows) catMap[row.slug] = row.id;

      for (const cause of causes) {
        const catSlug = categories[cause.categoryId - 1]?.slug || '';
        const categoryId = catMap[catSlug] || null;
        await dataSource.query(
          `INSERT INTO cause (title, slug, "shortDescription", description, content, image, "categoryId", tag, "tagColor", goal, raised, donors, progress, location, impact, metric, status, "isFeatured", "metaTitle", "metaDescription", "createdAt", "updatedAt", "order") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW(), NOW(), 0)`,
          [
            cause.title,
            cause.slug,
            cause.shortDescription,
            cause.description,
            cause.content,
            cause.image,
            categoryId,
            cause.tag ? [cause.tag] : [],
            cause.tagColor,
            cause.goal,
            cause.raised,
            cause.donors,
            cause.progress,
            cause.location,
            cause.impact,
            cause.metric,
            cause.status,
            cause.isFeatured,
            cause.metaTitle,
            cause.metaDescription,
          ],
        );
        console.log(`  Seeded cause: ${cause.title}`);
      }
    } else {
      console.log('  Causes already exist. Skipping.');
    }

    console.log('\nSeed completed successfully!');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

seed();
