/**
 * Seed Volunteers Data
 * Run with: npx ts-node src/migrations/seed-volunteers.ts
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

const volunteers = [
  {
    name: 'Fatima Rahman',
    email: 'fatima.rahman@email.com',
    phone: '+8801712345671',
    location: 'Dhaka, Bangladesh',
    role: 'Program Coordinator',
    title: 'Senior Coordinator',
    bio: 'Passionate about community development with 8 years of experience in rural outreach programs. Led multiple successful water sanitation projects across Satkhira district.',
    impact:
      'Coordinated 15+ community programs reaching over 5,000 beneficiaries',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400',
    skills: 'Project Management, Community Outreach, Training Facilitation',
    languages: ['English', 'Bengali', 'Hindi'],
    experienceTitle: '8 Years Experience',
    experienceSubtitle: 'Community Development Expert',
    experienceDescription:
      'Extensive experience working with NGOs in coastal Bangladesh, specializing in disaster preparedness and community resilience programs.',
    fundingPhases: JSON.stringify([
      {
        title: 'Community Assessment',
        details: 'Conducted baseline surveys in 20 villages',
      },
      {
        title: 'Program Implementation',
        details: 'Led team of 25 field workers',
      },
    ]),
    socialLinks: JSON.stringify({
      linkedin: 'https://linkedin.com/in/fatima-rahman',
      twitter: '@fatimar',
    }),
    seo: JSON.stringify({
      metaTitle: 'Fatima Rahman - Program Coordinator',
      metaDescription: 'Experienced community development professional',
    }),
    programs: JSON.stringify([
      'Climate Change & Disaster Risk Reduction',
      'Water, Sanitation & Hygiene',
    ]),
    status: 'active',
    order: 1,
  },
  {
    name: 'Mohammed Hassan',
    email: 'mohammed.hassan@email.com',
    phone: '+8801712345672',
    location: 'Chittagong, Bangladesh',
    role: 'Field Supervisor',
    title: 'Field Operations Lead',
    bio: 'Dedicated field supervisor with expertise in agricultural development and sustainable farming practices. Works closely with farming communities in Satkhira.',
    impact: 'Trained 500+ farmers in sustainable agriculture techniques',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400',
    skills: 'Agricultural Training, Sustainable Farming, Team Leadership',
    languages: ['Bengali', 'English'],
    experienceTitle: '6 Years Experience',
    experienceSubtitle: 'Agricultural Specialist',
    experienceDescription:
      'Specializes in salt-tolerant crop varieties and climate-adaptive farming practices for coastal regions.',
    fundingPhases: JSON.stringify([
      {
        title: 'Farmer Training Program',
        details: 'Trained 300 farmers in first phase',
      },
      {
        title: 'Expansion Phase',
        details: 'Extended to 5 additional villages',
      },
    ]),
    socialLinks: JSON.stringify({
      linkedin: 'https://linkedin.com/in/mohammed-hassan',
    }),
    seo: JSON.stringify({
      metaTitle: 'Mohammed Hassan - Field Supervisor',
      metaDescription: 'Agricultural development specialist',
    }),
    programs: JSON.stringify(['Sustainable Agriculture & Food Security']),
    status: 'active',
    order: 2,
  },
  {
    name: 'Ayesha Siddique',
    email: 'ayesha.siddique@email.com',
    phone: '+8801712345673',
    location: 'Khulna, Bangladesh',
    role: 'Health Educator',
    title: 'Community Health Lead',
    bio: 'Public health professional focused on maternal and child health. Works to improve healthcare access in rural communities through education and community health worker training.',
    impact:
      'Reduced maternal mortality by 60% in target areas through education programs',
    avatar:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400',
    skills:
      'Public Health Education, Community Health Worker Training, Maternal Care',
    languages: ['English', 'Bengali'],
    experienceTitle: '7 Years Experience',
    experienceSubtitle: 'Public Health Specialist',
    experienceDescription:
      'Expert in community-based health interventions and maternal care programs in rural Bangladesh.',
    fundingPhases: JSON.stringify([
      {
        title: 'Needs Assessment',
        details: 'Surveyed 50 villages for health needs',
      },
      {
        title: 'Training Program',
        details: 'Trained 35 community health workers',
      },
    ]),
    socialLinks: JSON.stringify({
      twitter: '@ayesha_health',
      linkedin: 'https://linkedin.com/in/ayesha-siddique',
    }),
    seo: JSON.stringify({
      metaTitle: 'Ayesha Siddique - Health Educator',
      metaDescription: 'Public health specialist focused on maternal care',
    }),
    programs: JSON.stringify([
      'Public Health & Nutrition',
      'Women Empowerment & Gender Equality',
    ]),
    status: 'active',
    order: 3,
  },
  {
    name: 'Karim Uddin',
    email: 'karim.uddin@email.com',
    phone: '+8801712345674',
    location: 'Barisal, Bangladesh',
    role: 'Education Coordinator',
    title: 'Learning Center Manager',
    bio: 'Education professional committed to bridging the digital divide in rural communities. Manages digital learning centers and vocational training programs.',
    impact: 'Established 12 digital learning centers serving 1,500+ students',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400',
    skills: 'Education Management, Digital Literacy, Vocational Training',
    languages: ['Bengali', 'English', 'Arabic'],
    experienceTitle: '5 Years Experience',
    experienceSubtitle: 'Education Development Specialist',
    experienceDescription:
      'Focuses on non-formal education and skill development for rural youth in coastal areas.',
    fundingPhases: JSON.stringify([
      {
        title: 'Center Setup',
        details: 'Established 6 centers with equipment',
      },
      {
        title: 'Program Launch',
        details: 'Enrolled 800 students in first year',
      },
    ]),
    socialLinks: JSON.stringify({
      linkedin: 'https://linkedin.com/in/karim-uddin',
    }),
    seo: JSON.stringify({
      metaTitle: 'Karim Uddin - Education Coordinator',
      metaDescription: 'Education development specialist',
    }),
    programs: JSON.stringify(['Education & Skill Development']),
    status: 'active',
    order: 4,
  },
  {
    name: 'Nasrin Akter',
    email: 'nasrin.akter@email.com',
    phone: '+8801712345675',
    location: 'Satkhira, Bangladesh',
    role: 'Women Empowerment Officer',
    title: 'Gender Equality Advocate',
    bio: 'Dedicated advocate for women empowerment and gender equality. Works with women cooperatives and leads vocational training programs for economic independence.',
    impact:
      'Empowered 800+ women through vocational training and micro-enterprise development',
    avatar:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400',
    skills: 'Vocational Training, Cooperative Development, Gender Advocacy',
    languages: ['Bengali', 'English'],
    experienceTitle: '6 Years Experience',
    experienceSubtitle: 'Gender Equality Specialist',
    experienceDescription:
      'Expert in women economic empowerment and community-based gender equality initiatives.',
    fundingPhases: JSON.stringify([
      {
        title: 'Cooperative Formation',
        details: 'Formed 12 women cooperatives',
      },
      {
        title: 'Skills Training',
        details: 'Trained 500 women in various vocations',
      },
    ]),
    socialLinks: JSON.stringify({
      instagram: '@nasrin_empowerment',
      linkedin: 'https://linkedin.com/in/nasrin-akter',
    }),
    seo: JSON.stringify({
      metaTitle: 'Nasrin Akter - Women Empowerment Officer',
      metaDescription:
        'Gender equality advocate and women empowerment specialist',
    }),
    programs: JSON.stringify(['Women Empowerment & Gender Equality']),
    status: 'active',
    order: 5,
  },
  {
    name: 'Rafiqul Islam',
    email: 'rafiqul.islam@email.com',
    phone: '+8801712345676',
    location: 'Bagerhat, Bangladesh',
    role: 'Environment Coordinator',
    title: 'Conservation Project Lead',
    bio: 'Environmental conservationist specializing in mangrove ecosystem restoration and biodiversity protection in the Sundarbans region.',
    impact:
      'Led plantation of 50,000+ mangrove saplings with 82% survival rate',
    avatar:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400',
    skills:
      'Ecosystem Restoration, Biodiversity Conservation, Community Engagement',
    languages: ['Bengali', 'English'],
    experienceTitle: '9 Years Experience',
    experienceSubtitle: 'Conservation Specialist',
    experienceDescription:
      'Extensive experience in mangrove restoration and community-based conservation in the Sundarbans buffer zone.',
    fundingPhases: JSON.stringify([
      {
        title: 'Mangrove Planting',
        details: 'Planted 50,000 saplings across 200 hectares',
      },
      { title: 'Monitoring', details: 'Achieved 82% survival rate' },
    ]),
    socialLinks: JSON.stringify({
      linkedin: 'https://linkedin.com/in/rafiqul-islam',
    }),
    seo: JSON.stringify({
      metaTitle: 'Rafiqul Islam - Environment Coordinator',
      metaDescription:
        'Conservation specialist focused on mangrove restoration',
    }),
    programs: JSON.stringify(['Environment & Biodiversity Conservation']),
    status: 'active',
    order: 6,
  },
  {
    name: 'Taslima Begum',
    email: 'taslima.begum@email.com',
    phone: '+8801712345677',
    location: 'Jessore, Bangladesh',
    role: 'Child Protection Officer',
    title: 'Child Rights Advocate',
    bio: 'Child protection specialist working to eliminate child labor and ensure every childs right to education and safety.',
    impact: 'Rescued 200+ children from labor and enrolled them in schools',
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400',
    skills: 'Child Protection, Rehabilitation, Education Advocacy',
    languages: ['Bengali', 'English'],
    experienceTitle: '5 Years Experience',
    experienceSubtitle: 'Child Protection Specialist',
    experienceDescription:
      'Expert in identifying at-risk children, rehabilitation programs, and school enrollment initiatives.',
    fundingPhases: JSON.stringify([
      {
        title: 'Rescue Operations',
        details: 'Identified and rescued 200 children',
      },
      {
        title: 'Rehabilitation',
        details: 'Enrolled all rescued children in schools',
      },
    ]),
    socialLinks: JSON.stringify({ twitter: '@taslima_childrights' }),
    seo: JSON.stringify({
      metaTitle: 'Taslima Begum - Child Protection Officer',
      metaDescription: 'Child rights advocate and protection specialist',
    }),
    programs: JSON.stringify(['Child Protection & Rights']),
    status: 'active',
    order: 7,
  },
  {
    name: 'Abdul Malik',
    email: 'abdul.malik@email.com',
    phone: '+8801712345678',
    location: 'Narail, Bangladesh',
    role: 'Governance Coordinator',
    title: 'Community Rights Advocate',
    bio: 'Legal aid specialist and governance expert helping marginalized communities access their rights and public services.',
    impact: 'Helped 3,000+ people access government safety net programs',
    avatar:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400',
    skills: 'Legal Aid, Governance, Community Mobilization, Rights Advocacy',
    languages: ['Bengali', 'English'],
    experienceTitle: '7 Years Experience',
    experienceSubtitle: 'Governance and Rights Specialist',
    experienceDescription:
      'Specializes in land rights cases and helping communities navigate government systems.',
    fundingPhases: JSON.stringify([
      {
        title: 'Legal Aid Program',
        details: 'Resolved 500+ land rights cases',
      },
      {
        title: 'Advocacy Campaign',
        details: 'Helped 3,000 access safety nets',
      },
    ]),
    socialLinks: JSON.stringify({
      linkedin: 'https://linkedin.com/in/abdul-malik',
    }),
    seo: JSON.stringify({
      metaTitle: 'Abdul Malik - Governance Coordinator',
      metaDescription: 'Legal aid and governance specialist',
    }),
    programs: JSON.stringify(['Governance & Human Rights']),
    status: 'active',
    order: 8,
  },
  {
    name: 'Sadia Khan',
    email: 'sadia.khan@email.com',
    phone: '+8801712345679',
    location: 'Dhaka, Bangladesh',
    role: 'Youth Coordinator',
    title: 'Youth Development Lead',
    bio: 'Youth development professional engaging young people in community service, leadership development, and social accountability initiatives.',
    impact: 'Mobilized 600+ youth volunteers for community projects',
    avatar:
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=400',
    skills: 'Youth Engagement, Leadership Development, Social Accountability',
    languages: ['English', 'Bengali'],
    experienceTitle: '4 Years Experience',
    experienceSubtitle: 'Youth Development Specialist',
    experienceDescription:
      'Expert in youth mobilization and volunteer management for community development projects.',
    fundingPhases: JSON.stringify([
      { title: 'Youth Recruitment', details: 'Recruited 600 volunteers' },
      {
        title: 'Project Implementation',
        details: 'Led 150+ community projects',
      },
    ]),
    socialLinks: JSON.stringify({
      instagram: '@sadia_youth',
      twitter: '@sadiak',
    }),
    seo: JSON.stringify({
      metaTitle: 'Sadia Khan - Youth Coordinator',
      metaDescription:
        'Youth development and volunteer mobilization specialist',
    }),
    programs: JSON.stringify(['Youth Development & Volunteerism']),
    status: 'active',
    order: 9,
  },
  {
    name: 'Imran Hossain',
    email: 'imran.hossain@email.com',
    phone: '+8801712345680',
    location: 'Rajshahi, Bangladesh',
    role: 'Technology Specialist',
    title: 'Innovation Lead',
    bio: 'Technology expert leveraging drones, e-learning platforms, and digital innovation to solve development challenges in rural areas.',
    impact: 'Implemented drone monitoring covering 500+ hectares of farmland',
    avatar:
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=400',
    skills: 'Drone Technology, E-Learning, Digital Innovation, Data Analysis',
    languages: ['English', 'Bengali'],
    experienceTitle: '5 Years Experience',
    experienceSubtitle: 'Technology Innovation Expert',
    experienceDescription:
      'Pioneer in using technology for agricultural monitoring and educational access in rural Bangladesh.',
    fundingPhases: JSON.stringify([
      {
        title: 'Drone Deployment',
        details: 'Deployed drones in 5 pilot areas',
      },
      {
        title: 'E-Learning Platform',
        details: 'Served 1,000+ students online',
      },
    ]),
    socialLinks: JSON.stringify({
      linkedin: 'https://linkedin.com/in/imran-hossain-tech',
      twitter: '@imrantech',
    }),
    seo: JSON.stringify({
      metaTitle: 'Imran Hossain - Technology Specialist',
      metaDescription: 'Technology innovation expert for development',
    }),
    programs: JSON.stringify([
      'Technology & Innovation',
      'Cyber Security Awareness',
    ]),
    status: 'active',
    order: 10,
  },
  {
    name: 'Rina Khatun',
    email: 'rina.khatun@email.com',
    phone: '+8801712345681',
    location: 'Sylhet, Bangladesh',
    role: 'WASH Coordinator',
    title: 'Water and Sanitation Lead',
    bio: 'Water and sanitation expert implementing RO plants and community-managed water distribution systems in rural areas.',
    impact: 'Provided safe drinking water to 5,000+ families through RO plants',
    avatar:
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=400',
    skills: 'WASH Programs, Community Management, Water Quality Monitoring',
    languages: ['Bengali', 'English'],
    experienceTitle: '6 Years Experience',
    experienceSubtitle: 'WASH Program Specialist',
    experienceDescription:
      'Expert in implementing sustainable water solutions in arsenic-affected and saline-prone areas.',
    fundingPhases: JSON.stringify([
      { title: 'RO Plant Installation', details: 'Installed 8 RO plants' },
      {
        title: 'Community Training',
        details: 'Trained 40 water committee members',
      },
    ]),
    socialLinks: JSON.stringify({
      linkedin: 'https://linkedin.com/in/rina-khatun',
    }),
    seo: JSON.stringify({
      metaTitle: 'Rina Khatun - WASH Coordinator',
      metaDescription: 'Water and sanitation program specialist',
    }),
    programs: JSON.stringify(['Water, Sanitation & Hygiene (WASH)']),
    status: 'active',
    order: 11,
  },
  {
    name: 'Jamil Ahmed',
    email: 'jamil.ahmed@email.com',
    phone: '+8801712345682',
    location: 'Cox Bazar, Bangladesh',
    role: 'Climate Resilience Officer',
    title: 'Disaster Preparedness Lead',
    bio: 'Climate resilience specialist implementing early warning systems and cyclone preparedness programs in coastal communities.',
    impact:
      'Reduced cyclone casualties by 60% in target areas through preparedness programs',
    avatar:
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400',
    skills:
      'Disaster Management, Early Warning Systems, Community Preparedness',
    languages: ['Bengali', 'English', 'Urdu'],
    experienceTitle: '8 Years Experience',
    experienceSubtitle: 'Climate Resilience Expert',
    experienceDescription:
      'Expert in cyclone preparedness and community resilience building in coastal Bangladesh.',
    fundingPhases: JSON.stringify([
      {
        title: 'Early Warning System',
        details: 'Set up systems in 20 villages',
      },
      { title: 'Shelter Construction', details: 'Built 5 cyclone shelters' },
    ]),
    socialLinks: JSON.stringify({
      linkedin: 'https://linkedin.com/in/jamil-ahmed',
    }),
    seo: JSON.stringify({
      metaTitle: 'Jamil Ahmed - Climate Resilience Officer',
      metaDescription:
        'Disaster preparedness and climate resilience specialist',
    }),
    programs: JSON.stringify(['Climate Change & Disaster Risk Reduction']),
    status: 'active',
    order: 12,
  },
  {
    name: 'Farhana Yasmin',
    email: 'farhana.yasmin@email.com',
    phone: '+8801712345683',
    location: 'Mymensingh, Bangladesh',
    role: 'Cyber Security Trainer',
    title: 'Digital Safety Educator',
    bio: 'Cyber security awareness trainer teaching online safety and secure digital practices to individuals and organizations.',
    impact: 'Trained 1,500+ individuals in cyber security awareness',
    avatar:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400',
    skills: 'Cyber Security, Digital Literacy, Training Facilitation',
    languages: ['English', 'Bengali'],
    experienceTitle: '4 Years Experience',
    experienceSubtitle: 'Cyber Security Awareness Expert',
    experienceDescription:
      'Specializes in educating rural communities about online safety and digital threat awareness.',
    fundingPhases: JSON.stringify([
      { title: 'Workshop Series', details: 'Conducted 30 workshops' },
      { title: 'Awareness Campaign', details: 'Reached 1,500+ participants' },
    ]),
    socialLinks: JSON.stringify({
      twitter: '@farhana_cyber',
      linkedin: 'https://linkedin.com/in/farhana-yasmin',
    }),
    seo: JSON.stringify({
      metaTitle: 'Farhana Yasmin - Cyber Security Trainer',
      metaDescription: 'Cyber security awareness and digital safety educator',
    }),
    programs: JSON.stringify(['Cyber Security Awareness']),
    status: 'active',
    order: 13,
  },
  {
    name: 'Shahin Alam',
    email: 'shahin.alam@email.com',
    phone: '+8801712345684',
    location: 'Rangpur, Bangladesh',
    role: 'Volunteer Coordinator',
    title: 'Volunteer Management Lead',
    bio: 'Volunteer management specialist coordinating volunteer activities and ensuring effective community engagement.',
    impact:
      'Managed network of 300+ active volunteers across multiple programs',
    avatar:
      'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?q=80&w=400',
    skills: 'Volunteer Management, Event Coordination, Community Engagement',
    languages: ['Bengali', 'English'],
    experienceTitle: '5 Years Experience',
    experienceSubtitle: 'Volunteer Management Expert',
    experienceDescription:
      'Expert in recruiting, training, and retaining volunteers for long-term community service.',
    fundingPhases: JSON.stringify([
      { title: 'Volunteer Recruitment', details: 'Recruited 300 volunteers' },
      {
        title: 'Training Program',
        details: 'Conducted monthly training sessions',
      },
    ]),
    socialLinks: JSON.stringify({
      linkedin: 'https://linkedin.com/in/shahin-alam',
    }),
    seo: JSON.stringify({
      metaTitle: 'Shahin Alam - Volunteer Coordinator',
      metaDescription:
        'Volunteer management and community engagement specialist',
    }),
    programs: JSON.stringify(['Youth Development & Volunteerism']),
    status: 'active',
    order: 14,
  },
  {
    name: 'Momena Begum',
    email: 'momena.begum@email.com',
    phone: '+8801712345685',
    location: 'Comilla, Bangladesh',
    role: 'Data Manager',
    title: 'Monitoring & Evaluation Lead',
    bio: 'Data management specialist responsible for monitoring and evaluation of all development programs and impact assessment.',
    impact: 'Developed comprehensive M&E framework tracking 15+ programs',
    avatar:
      'https://images.unsplash.com/photo-1598550874175-4d0ef436c90b?q=80&w=400',
    skills: 'Data Analysis, M&E, Impact Assessment, Reporting',
    languages: ['English', 'Bengali'],
    experienceTitle: '6 Years Experience',
    experienceSubtitle: 'Monitoring & Evaluation Expert',
    experienceDescription:
      'Expert in designing data collection systems and conducting rigorous impact assessments.',
    fundingPhases: JSON.stringify([
      { title: 'Framework Development', details: 'Created M&E framework' },
      { title: 'Data Collection', details: 'Trained 50 data collectors' },
    ]),
    socialLinks: JSON.stringify({
      linkedin: 'https://linkedin.com/in/momena-begum',
    }),
    seo: JSON.stringify({
      metaTitle: 'Momena Begum - Data Manager',
      metaDescription: 'Monitoring and evaluation specialist',
    }),
    programs: JSON.stringify([
      'Education & Skill Development',
      'Technology & Innovation',
    ]),
    status: 'active',
    order: 15,
  },
];

async function generateSlug(name: string): Promise<string> {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${baseSlug}-${randomSuffix}`;
}

async function seed() {
  console.log('Starting volunteers seed...\n');
  try {
    await dataSource.initialize();
    console.log('Connected to database\n');

    const existingCount = await dataSource.query(
      'SELECT COUNT(*) FROM volunteer',
    );
    if (parseInt(existingCount[0].count) === 0) {
      for (const v of volunteers) {
        const slug = await generateSlug(v.name);
        await dataSource.query(
          `INSERT INTO volunteer (name, email, phone, location, slug, role, title, bio, impact, avatar, skills, languages, 
                     "experienceTitle", "experienceSubtitle", "experienceDescription", "fundingPhases", blocks, "socialLinks", seo, 
                     status, "order", "createdAt", "updatedAt")
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::jsonb, $17::jsonb, $18::jsonb, $19::jsonb, $20, $21, NOW(), NOW())`,
          [
            v.name,
            v.email,
            v.phone,
            v.location,
            slug,
            v.role,
            v.title,
            v.bio,
            v.impact,
            v.avatar,
            v.skills,
            v.languages,
            v.experienceTitle,
            v.experienceSubtitle,
            v.experienceDescription,
            v.fundingPhases,
            JSON.stringify([]),
            v.socialLinks,
            v.seo,
            v.status,
            v.order,
          ],
        );
        console.log(`  Seeded: ${v.name} - ${v.role}`);
      }
    } else {
      console.log('  Volunteers already exist. Skipping.');
    }

    console.log('\nSeed completed successfully!');
    console.log(`\nTotal volunteers seeded: ${volunteers.length}`);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

seed();
