/**
 * Seed Programs Data
 * Run with: npx ts-node src/migrations/seed-programs.ts
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

const programs = [
  {
    title: 'Climate Change & Disaster Risk Reduction',
    slug: 'climate-disaster-risk-reduction',
    shortDescription:
      'Cyclone preparedness, embankment protection, and coastal afforestation for vulnerable coastal communities.',
    description:
      'Implementing early warning systems, building cyclone shelters, and restoring mangrove buffers to protect communities from increasing climate threats.',
    icon: 'Leaf',
    color: 'emerald',
    category: 'Climate Resilience',
    location: 'Satkhira, Bangladesh',
    beneficiaries: '15,000+ coastal residents',
    impact:
      'Reduced cyclone casualties by 60% in target areas through early warning systems and community preparedness.',
    metric: '60% casualty reduction',
    status: 'active',
    isFeatured: true,
    order: 1,
    image:
      'https://images.unsplash.com/photo-1593113630400-ea4288922497?q=80&w=1200',
    metaTitle: 'Climate Change & Disaster Risk Reduction Program',
    metaDescription:
      "BirdsFly Sangstha's climate resilience programs protect coastal communities through cyclone preparedness and mangrove restoration.",
  },
  {
    title: 'Water, Sanitation & Hygiene (WASH)',
    slug: 'water-sanitation-hygiene-wash',
    shortDescription:
      'Reverse osmosis plants, rainwater harvesting, and arsenic-free water access for rural families.',
    description:
      'Installing RO plants and community-managed water distribution systems to ensure safe drinking water for every family.',
    icon: 'Droplet',
    color: 'blue',
    category: 'Clean Water',
    location: 'Satkhira District, Bangladesh',
    beneficiaries: '5,000+ families',
    impact:
      '75% reduction in waterborne diseases across project areas. Families save 2.5 hours daily previously spent collecting water.',
    metric: '5,000 families served',
    status: 'active',
    isFeatured: true,
    order: 2,
    image:
      'https://images.unsplash.com/photo-1541810270-3882d634017f?q=80&w=1200',
    metaTitle: 'WASH Program - Safe Water Access',
    metaDescription:
      'Providing arsenic-free safe drinking water through RO plants and rainwater harvesting in Satkhira District.',
  },
  {
    title: 'Sustainable Agriculture & Food Security',
    slug: 'sustainable-agriculture-food-security',
    shortDescription:
      'Salt-tolerant crop varieties, cage fish farming, and organic fertilizer training for farming families.',
    description:
      'Empowering farming communities with climate-adaptive agricultural practices and alternative livelihood opportunities.',
    icon: 'Soup',
    color: 'amber',
    category: 'Food Security',
    location: 'Satkhira, Bangladesh',
    beneficiaries: '3,500+ farming families',
    impact:
      '40% increase in crop yields through salt-tolerant varieties. 800 families adopted cage fish farming as alternative income.',
    metric: '40% yield increase',
    status: 'active',
    isFeatured: false,
    order: 3,
    image:
      'https://images.unsplash.com/photo-1573166364555-bc8a5fc4e80d?q=80&w=1200',
    metaTitle: 'Sustainable Agriculture & Food Security',
    metaDescription:
      'Supporting farming families with salt-tolerant crops and alternative livelihoods in coastal Bangladesh.',
  },
  {
    title: 'Public Health & Nutrition',
    slug: 'public-health-nutrition',
    shortDescription:
      'Maternal health, child nutrition, and community health worker training for rural healthcare access.',
    description:
      'Training community health workers and establishing prenatal care centers to reduce maternal and infant mortality.',
    icon: 'Stethoscope',
    color: 'rose',
    category: 'Healthcare',
    location: 'Satkhira District, Bangladesh',
    beneficiaries: '2,400+ mothers and children',
    impact:
      '60% reduction in maternal mortality. 35 community health workers trained serving 15 unions.',
    metric: '60% mortality reduction',
    status: 'active',
    isFeatured: true,
    order: 4,
    image:
      'https://images.unsplash.com/photo-1538108149392-fbbd81895907?q=80&w=1200',
    metaTitle: 'Public Health & Nutrition Program',
    metaDescription:
      'Reducing maternal mortality and improving child nutrition through community health workers in Satkhira.',
  },
  {
    title: 'Education & Skill Development',
    slug: 'education-skill-development',
    shortDescription:
      'Digital learning centers, non-formal education, and vocational skills training for youth empowerment.',
    description:
      'Establishing digital learning centers with computers, internet, and trained facilitators for rural youth.',
    icon: 'BookOpen',
    color: 'indigo',
    category: 'Education',
    location: 'Satkhira District, Bangladesh',
    beneficiaries: '1,500+ students aged 12-25',
    impact:
      '78% employment rate within 6 months of graduation. 12 digital learning centers established.',
    metric: '78% employment rate',
    status: 'active',
    isFeatured: false,
    order: 5,
    image:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200',
    metaTitle: 'Education & Skill Development Program',
    metaDescription:
      'Bridging the digital divide with 12 learning centers serving 1,500+ students in Satkhira District.',
  },
  {
    title: 'Women Empowerment & Gender Equality',
    slug: 'women-empowerment-gender-equality',
    shortDescription:
      "Vocational training, anti-child marriage campaigns, and legal aid for women's economic independence.",
    description:
      'Creating economic opportunities for women through skill development, cooperative groups, and advocacy.',
    icon: 'Users',
    color: 'purple',
    category: 'Women Empowerment',
    location: 'Satkhira, Bangladesh',
    beneficiaries: '800+ women',
    impact:
      '65% of trained women started micro-enterprises. 70% of Water User Committees led by women.',
    metric: '800 women empowered',
    status: 'active',
    isFeatured: false,
    order: 6,
    image:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1200',
    metaTitle: 'Women Empowerment & Gender Equality',
    metaDescription:
      'Empowering 800+ women through vocational training and cooperative groups in coastal Bangladesh.',
  },
  {
    title: 'Environment & Biodiversity Conservation',
    slug: 'environment-biodiversity-conservation',
    shortDescription:
      'Sundarbans protection, plastic pollution control, and mangrove ecosystem restoration.',
    description:
      "Protecting the world's largest mangrove forest through community-led restoration and conservation initiatives.",
    icon: 'Leaf',
    color: 'emerald',
    category: 'Environment',
    location: 'Sundarbans Buffer Zone, Satkhira',
    beneficiaries: '500+ fishing families',
    impact:
      '50,000+ mangrove saplings planted with 82% survival rate. 35% increase in biodiversity indices.',
    metric: '200 hectares restored',
    status: 'active',
    isFeatured: true,
    order: 7,
    image:
      'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1200',
    metaTitle: 'Environment & Biodiversity Conservation',
    metaDescription:
      'Protecting the Sundarbans mangrove forest through community-led restoration. 50,000+ saplings planted.',
  },
  {
    title: 'Child Protection & Rights',
    slug: 'child-protection-rights',
    shortDescription:
      "Eliminating child labor, rehabilitating street children, and ensuring every child's right to education and safety.",
    description:
      'Working to eliminate child labor, rehabilitate vulnerable children, and advocate for child rights across the district.',
    icon: 'Heart',
    color: 'rose',
    category: 'Child Protection',
    location: 'Satkhira, Bangladesh',
    beneficiaries: '1,200+ at-risk children',
    impact:
      '200+ children rescued from labor and enrolled in schools. Child marriage rates reduced by 45% in target areas.',
    metric: '200 children rescued',
    status: 'active',
    isFeatured: false,
    order: 8,
    image:
      'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1200',
    metaTitle: 'Child Protection & Rights Program',
    metaDescription:
      'Eliminating child labor and protecting vulnerable children through education and advocacy in Satkhira.',
  },
  {
    title: 'Governance & Human Rights',
    slug: 'governance-human-rights',
    shortDescription:
      'Promoting access to public services, transparency, and land rights awareness for marginalized communities.',
    description:
      'Strengthening local governance and ensuring marginalized communities can access their rights and public services.',
    icon: 'Shield',
    color: 'cyan',
    category: 'Governance',
    location: 'Satkhira, Bangladesh',
    beneficiaries: '8,000+ community members',
    impact:
      '3,000+ people gained access to government safety net programs. 500+ land rights cases resolved.',
    metric: '3,000 people served',
    status: 'active',
    isFeatured: false,
    order: 9,
    image:
      'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?q=80&w=1200',
    metaTitle: 'Governance & Human Rights Program',
    metaDescription:
      'Promoting transparency, land rights, and access to public services for marginalized communities in Satkhira.',
  },
  {
    title: 'Youth Development & Volunteerism',
    slug: 'youth-development-volunteerism',
    shortDescription:
      'Social work engagement, anti-drug campaigns, and leadership development for youth in coastal communities.',
    description:
      'Engaging young people in community service, leadership development, and social accountability initiatives.',
    icon: 'Zap',
    color: 'orange',
    category: 'Youth Development',
    location: 'Satkhira, Bangladesh',
    beneficiaries: '600+ youth volunteers',
    impact:
      '150+ community projects led by youth volunteers. Drug abuse rates reduced by 30% in participating communities.',
    metric: '600 youth volunteers',
    status: 'active',
    isFeatured: false,
    order: 10,
    image:
      'https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=1200',
    metaTitle: 'Youth Development & Volunteerism Program',
    metaDescription:
      'Engaging 600+ youth volunteers in community service and leadership development in Satkhira District.',
  },
  {
    title: 'Technology & Innovation',
    slug: 'technology-innovation',
    shortDescription:
      'Drones in agriculture, e-learning platforms, and digital services to bridge the technology gap.',
    description:
      'Leveraging technology and innovation to solve development challenges and create new opportunities.',
    icon: 'Zap',
    color: 'indigo',
    category: 'Technology',
    location: 'Satkhira, Bangladesh',
    beneficiaries: '2,000+ tech beneficiaries',
    impact:
      'Drone monitoring covers 500+ hectares of farmland. 3 e-learning platforms serving 1,000+ students.',
    metric: '2,000 tech beneficiaries',
    status: 'active',
    isFeatured: false,
    order: 11,
    image:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200',
    metaTitle: 'Technology & Innovation Program',
    metaDescription:
      'Using drones, e-learning, and digital innovation to solve development challenges in coastal Bangladesh.',
  },
  {
    title: 'Cyber Security Awareness',
    slug: 'cyber-security-awareness',
    shortDescription:
      'Online safety training, secure digital practices, and cyber threat awareness for individuals and businesses.',
    description:
      'Raising awareness about online safety, secure digital practices, and cyber threats in an increasingly connected world.',
    icon: 'Shield',
    color: 'cyan',
    category: 'Cyber Security',
    location: 'Satkhira, Bangladesh',
    beneficiaries: '1,500+ individuals trained',
    impact:
      'Cybercrime reporting increased by 200% (indicating awareness). Zero data breach incidents in partner organizations.',
    metric: '1,500 trained',
    status: 'active',
    isFeatured: false,
    order: 12,
    image:
      'https://images.unsplash.com/photo-1550751827-4bd374c3f583?q=80&w=1200',
    metaTitle: 'Cyber Security Awareness Program',
    metaDescription:
      'Training 1,500+ individuals in online safety and secure digital practices in Satkhira District.',
  },
];

async function seed() {
  console.log('Starting programs seed...\n');
  try {
    await dataSource.initialize();
    console.log('Connected to database\n');

    const existingCount = await dataSource.query(
      'SELECT COUNT(*) FROM program',
    );
    if (parseInt(existingCount[0].count) === 0) {
      for (const p of programs) {
        await dataSource.query(
          `INSERT INTO program (title, slug, "shortDescription", description, icon, color, category, location, beneficiaries, impact, metric, status, "isFeatured", "order", image, "metaTitle", "metaDescription", "createdAt", "updatedAt")
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())`,
          [
            p.title,
            p.slug,
            p.shortDescription,
            p.description,
            p.icon,
            p.color,
            p.category,
            p.location,
            p.beneficiaries,
            p.impact,
            p.metric,
            p.status,
            p.isFeatured,
            p.order,
            p.image,
            p.metaTitle,
            p.metaDescription,
          ],
        );
        console.log(`  Seeded: ${p.title}`);
      }
    } else {
      console.log('  Programs already exist. Skipping.');
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
