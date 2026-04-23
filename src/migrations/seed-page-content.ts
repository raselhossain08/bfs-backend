import { createConnection, Repository } from 'typeorm';
import { Page } from '../pages/entities/page.entity';
import { Section } from '../pages/entities/section.entity';

// ContentBlock type matching frontend
interface ContentBlock {
  id: string;
  type: 'text' | 'image' | 'video' | 'heading' | 'quote' | 'list';
  content: string;
  meta?: {
    url?: string;
    caption?: string;
    align?: 'left' | 'center' | 'right';
    level?: 1 | 2 | 3;
    style?: 'bullet' | 'numbered';
    videoType?: 'youtube' | 'vimeo' | 'upload';
  };
}

// Page seed data with sections
const pageSeedData = [
  {
    title: 'About Us',
    slug: 'about',
    description: 'Learn about our mission, vision, and the impact we create in coastal communities.',
    type: 'static',
    status: 'published',
    order: 1,
    metaTitle: 'About Us | BFS Foundation - Empowering Coastal Communities',
    metaDescription: 'Discover our mission to empower coastal communities through sustainable development, education, and humanitarian aid.',
    sections: [
      {
        name: 'Hero Section',
        key: 'hero',
        description: 'Main hero section with organization introduction',
        order: 0,
        status: 'published',
        content: [
          { id: 'about-h1', type: 'heading', content: 'Building Resilience in Coastal Communities', meta: { level: 1, align: 'center' } },
          { id: 'about-intro', type: 'text', content: 'BirdsFly Sangstha is dedicated to empowering vulnerable coastal communities through sustainable development, education, and humanitarian assistance. Since our founding, we have touched the lives of thousands of families across Bangladesh\'s coastal regions.', meta: { align: 'center' } },
        ] as ContentBlock[],
      },
      {
        name: 'Mission & Vision',
        key: 'mission-vision',
        description: 'Our organization\'s mission and vision statements',
        order: 1,
        status: 'published',
        content: [
          { id: 'mission-h2', type: 'heading', content: 'Our Mission', meta: { level: 2 } },
          { id: 'mission-text', type: 'text', content: 'To empower coastal communities through sustainable development initiatives, quality education, and humanitarian aid that build resilience against climate challenges and create pathways to prosperity.', meta: { align: 'left' } },
          { id: 'vision-h2', type: 'heading', content: 'Our Vision', meta: { level: 2 } },
          { id: 'vision-text', type: 'text', content: 'A future where every coastal community has the resources, knowledge, and resilience to thrive in harmony with their environment, securing dignity and opportunity for all.', meta: { align: 'left' } },
        ] as ContentBlock[],
      },
      {
        name: 'Our Values',
        key: 'values',
        description: 'Core values that guide our work',
        order: 2,
        status: 'published',
        content: [
          { id: 'values-h2', type: 'heading', content: 'Our Core Values', meta: { level: 2 } },
          { id: 'values-list', type: 'list', content: 'Compassion - We approach every challenge with empathy and care\nIntegrity - We maintain transparency and accountability in all our actions\nSustainability - We build solutions that last for generations\nCommunity - We believe in the power of collective action\nInnovation - We embrace creative solutions to complex problems', meta: { style: 'bullet' } },
        ] as ContentBlock[],
      },
      {
        name: 'Our Impact',
        key: 'impact',
        description: 'Statistics showing our impact',
        order: 3,
        status: 'published',
        cmsEndpoint: '/about-stats',
        content: [
          { id: 'impact-h2', type: 'heading', content: 'Our Impact in Numbers', meta: { level: 2, align: 'center' } },
          { id: 'impact-text', type: 'text', content: 'Through dedicated programs and community partnerships, we have achieved significant milestones in our journey.', meta: { align: 'center' } },
        ] as ContentBlock[],
      },
    ],
  },
  {
    title: 'Contact Us',
    slug: 'contact',
    description: 'Get in touch with us for inquiries, support, or to learn more about our work.',
    type: 'static',
    status: 'published',
    order: 2,
    metaTitle: 'Contact Us | BFS Foundation',
    metaDescription: 'Reach out to BirdsFly Sangstha for inquiries, partnerships, or to learn how you can support our mission.',
    sections: [
      {
        name: 'Hero Section',
        key: 'hero',
        description: 'Contact page introduction',
        order: 0,
        status: 'published',
        content: [
          { id: 'contact-h1', type: 'heading', content: 'Get in Touch', meta: { level: 1, align: 'center' } },
          { id: 'contact-intro', type: 'text', content: 'We\'d love to hear from you. Whether you have questions, want to partner with us, or need support, our team is here to help.', meta: { align: 'center' } },
        ] as ContentBlock[],
      },
      {
        name: 'Contact Information',
        key: 'contact-info',
        description: 'Contact details and address',
        order: 1,
        status: 'published',
        content: [
          { id: 'contact-details-h2', type: 'heading', content: 'Contact Information', meta: { level: 2 } },
          { id: 'address', type: 'text', content: '**Address:**\nBirdsFly Sangstha\n123 Coastal Road, Bhola District\nBangladesh', meta: { align: 'left' } },
          { id: 'phone', type: 'text', content: '**Phone:** +880 1234-567890\n**Email:** info@birdsflysangstha.org', meta: { align: 'left' } },
          { id: 'hours', type: 'text', content: '**Office Hours:**\nSunday - Thursday: 9:00 AM - 5:00 PM\nFriday - Saturday: Closed', meta: { align: 'left' } },
        ] as ContentBlock[],
      },
    ],
  },
  {
    title: 'Privacy Policy',
    slug: 'privacy-policy',
    description: 'Our commitment to protecting your privacy and personal information.',
    type: 'static',
    status: 'published',
    order: 3,
    metaTitle: 'Privacy Policy | BFS Foundation',
    metaDescription: 'Learn how BirdsFly Sangstha collects, uses, and protects your personal information.',
    sections: [
      {
        name: 'Introduction',
        key: 'intro',
        description: 'Privacy policy introduction',
        order: 0,
        status: 'published',
        content: [
          { id: 'privacy-h1', type: 'heading', content: 'Privacy Policy', meta: { level: 1 } },
          { id: 'privacy-intro', type: 'text', content: 'At BirdsFly Sangstha, we are committed to protecting your privacy. This policy outlines how we collect, use, and safeguard your personal information when you interact with our organization.', meta: { align: 'left' } },
        ] as ContentBlock[],
      },
      {
        name: 'Information We Collect',
        key: 'info-collect',
        description: 'Types of information collected',
        order: 1,
        status: 'published',
        content: [
          { id: 'collect-h2', type: 'heading', content: 'Information We Collect', meta: { level: 2 } },
          { id: 'collect-list', type: 'list', content: 'Personal identification information (name, email, phone number)\nDonation and payment information\nCommunication preferences\nWebsite usage data and cookies\nFeedback and survey responses', meta: { style: 'bullet' } },
        ] as ContentBlock[],
      },
      {
        name: 'How We Use Your Information',
        key: 'info-use',
        description: 'Purpose of data collection',
        order: 2,
        status: 'published',
        content: [
          { id: 'use-h2', type: 'heading', content: 'How We Use Your Information', meta: { level: 2 } },
          { id: 'use-list', type: 'list', content: 'Process donations and provide receipts\nSend updates about our programs and impact\nRespond to inquiries and provide support\nImprove our website and services\nComply with legal obligations', meta: { style: 'bullet' } },
        ] as ContentBlock[],
      },
      {
        name: 'Data Security',
        key: 'security',
        description: 'Data protection measures',
        order: 3,
        status: 'published',
        content: [
          { id: 'security-h2', type: 'heading', content: 'Data Security', meta: { level: 2 } },
          { id: 'security-text', type: 'text', content: 'We implement industry-standard security measures to protect your personal information from unauthorized access, disclosure, or destruction. This includes encryption, secure servers, and regular security audits.', meta: { align: 'left' } },
        ] as ContentBlock[],
      },
    ],
  },
  {
    title: 'Terms & Conditions',
    slug: 'terms',
    description: 'Terms and conditions for using our services and website.',
    type: 'static',
    status: 'published',
    order: 4,
    metaTitle: 'Terms & Conditions | BFS Foundation',
    metaDescription: 'Read our terms and conditions for using the BirdsFly Sangstha website and services.',
    sections: [
      {
        name: 'Introduction',
        key: 'intro',
        description: 'Terms introduction',
        order: 0,
        status: 'published',
        content: [
          { id: 'terms-h1', type: 'heading', content: 'Terms & Conditions', meta: { level: 1 } },
          { id: 'terms-intro', type: 'text', content: 'By accessing and using the BirdsFly Sangstha website and services, you agree to be bound by these terms and conditions. Please read them carefully before proceeding.', meta: { align: 'left' } },
        ] as ContentBlock[],
      },
      {
        name: 'Use of Website',
        key: 'website-use',
        description: 'Website usage terms',
        order: 1,
        status: 'published',
        content: [
          { id: 'use-h2', type: 'heading', content: 'Use of Website', meta: { level: 2 } },
          { id: 'use-list', type: 'list', content: 'You must be at least 18 years old to make donations\nYou agree to provide accurate information\nYou will not use the website for unlawful purposes\nYou will not attempt to gain unauthorized access to our systems', meta: { style: 'bullet' } },
        ] as ContentBlock[],
      },
      {
        name: 'Donations',
        key: 'donations',
        description: 'Donation terms',
        order: 2,
        status: 'published',
        content: [
          { id: 'donations-h2', type: 'heading', content: 'Donations', meta: { level: 2 } },
          { id: 'donations-text', type: 'text', content: 'All donations made through our website are voluntary and non-refundable unless otherwise stated. We reserve the right to decline donations that do not align with our mission or values. Donors will receive tax-deductible receipts as applicable.', meta: { align: 'left' } },
        ] as ContentBlock[],
      },
    ],
  },
  {
    title: 'FAQ',
    slug: 'faq',
    description: 'Frequently asked questions about our organization and services.',
    type: 'static',
    status: 'published',
    order: 5,
    metaTitle: 'Frequently Asked Questions | BFS Foundation',
    metaDescription: 'Find answers to common questions about BirdsFly Sangstha, donations, volunteering, and our programs.',
    sections: [
      {
        name: 'FAQ Introduction',
        key: 'intro',
        description: 'FAQ section introduction',
        order: 0,
        status: 'published',
        content: [
          { id: 'faq-h1', type: 'heading', content: 'Frequently Asked Questions', meta: { level: 1, align: 'center' } },
          { id: 'faq-intro', type: 'text', content: 'Find answers to common questions below. If you don\'t find what you\'re looking for, feel free to contact us directly.', meta: { align: 'center' } },
        ] as ContentBlock[],
      },
      {
        name: 'FAQ List',
        key: 'faq-list',
        description: 'Dynamic FAQ content',
        order: 1,
        status: 'published',
        cmsEndpoint: '/faqs',
        content: [] as ContentBlock[],
      },
    ],
  },
  {
    title: 'Gallery',
    slug: 'gallery',
    description: 'Photo gallery showcasing our events, activities, and community impact.',
    type: 'static',
    status: 'published',
    order: 6,
    metaTitle: 'Photo Gallery | BFS Foundation',
    metaDescription: 'Explore photos from our programs, events, and community activities across Bangladesh.',
    sections: [
      {
        name: 'Gallery Introduction',
        key: 'intro',
        description: 'Gallery section introduction',
        order: 0,
        status: 'published',
        content: [
          { id: 'gallery-h1', type: 'heading', content: 'Our Gallery', meta: { level: 1, align: 'center' } },
          { id: 'gallery-intro', type: 'text', content: 'Explore moments from our programs, events, and community activities. Each photo tells a story of hope, resilience, and positive change.', meta: { align: 'center' } },
        ] as ContentBlock[],
      },
      {
        name: 'Gallery Grid',
        key: 'gallery-grid',
        description: 'Dynamic gallery content',
        order: 1,
        status: 'published',
        cmsEndpoint: '/gallery',
        content: [] as ContentBlock[],
      },
    ],
  },
  {
    title: 'Transparency',
    slug: 'transparency',
    description: 'Our commitment to financial transparency and accountability.',
    type: 'static',
    status: 'published',
    order: 7,
    metaTitle: 'Financial Transparency | BFS Foundation',
    metaDescription: 'Learn about our financial practices, annual reports, and commitment to transparency.',
    sections: [
      {
        name: 'Introduction',
        key: 'intro',
        description: 'Transparency page introduction',
        order: 0,
        status: 'published',
        content: [
          { id: 'trans-h1', type: 'heading', content: 'Our Commitment to Transparency', meta: { level: 1, align: 'center' } },
          { id: 'trans-intro', type: 'text', content: 'At BirdsFly Sangstha, we believe that transparency builds trust. We are committed to openness in our financial practices, governance, and impact reporting.', meta: { align: 'center' } },
        ] as ContentBlock[],
      },
      {
        name: 'Financial Practices',
        key: 'financials',
        description: 'Financial accountability',
        order: 1,
        status: 'published',
        content: [
          { id: 'fin-h2', type: 'heading', content: 'Financial Accountability', meta: { level: 2 } },
          { id: 'fin-list', type: 'list', content: 'Annual financial audits by independent auditors\nRegular impact assessments and reporting\nClear breakdown of fund allocation\nDonor privacy and data protection\nCompliance with all regulatory requirements', meta: { style: 'bullet' } },
        ] as ContentBlock[],
      },
      {
        name: 'Fund Allocation',
        key: 'allocation',
        description: 'How funds are used',
        order: 2,
        status: 'published',
        content: [
          { id: 'alloc-h2', type: 'heading', content: 'How Your Donations Are Used', meta: { level: 2 } },
          { id: 'alloc-text', type: 'text', content: 'We ensure that the majority of every donation directly supports our programs and beneficiaries. Our administrative costs are kept minimal to maximize impact.', meta: { align: 'left' } },
          { id: 'alloc-list', type: 'list', content: '85% - Direct program implementation\n10% - Operational and administrative costs\n5% - Monitoring, evaluation, and reporting', meta: { style: 'bullet' } },
        ] as ContentBlock[],
      },
    ],
  },
];

async function seedPageContent() {
  console.log('Starting enhanced page content seed process...');

  try {
    const connection = await createConnection({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'bfs',
      entities: [Page, Section],
      synchronize: false,
    });

    const pageRepository: Repository<Page> = connection.getRepository(Page);
    const sectionRepository: Repository<Section> = connection.getRepository(Section);

    // Check existing pages
    const existingPages = await pageRepository.find({ relations: ['sections'] });
    console.log(`Found ${existingPages.length} existing pages`);

    for (const pageData of pageSeedData) {
      // Check if page exists
      let page = await pageRepository.findOne({
        where: { slug: pageData.slug },
        relations: ['sections'],
      });

      if (!page) {
        // Create new page
        page = pageRepository.create({
          title: pageData.title,
          slug: pageData.slug,
          description: pageData.description,
          type: pageData.type,
          status: pageData.status,
          order: pageData.order,
          metaTitle: pageData.metaTitle,
          metaDescription: pageData.metaDescription,
        });
        await pageRepository.save(page);
        console.log(`Created page: ${page.title} (${page.slug})`);
      } else {
        // Update existing page metadata
        page.description = pageData.description;
        page.metaTitle = pageData.metaTitle;
        page.metaDescription = pageData.metaDescription;
        await pageRepository.save(page);
        console.log(`Updated page metadata: ${page.title}`);
      }

      // Handle sections
      for (const sectionData of pageData.sections) {
        // Check if section exists
        const existingSection = page.sections?.find(
          (s) => s.key === sectionData.key
        );

        if (!existingSection) {
          // Create new section
          const section = sectionRepository.create({
            pageId: page.id,
            name: sectionData.name,
            key: sectionData.key,
            description: sectionData.description,
            content: sectionData.content,
            cmsEndpoint: sectionData.cmsEndpoint,
            status: sectionData.status,
            order: sectionData.order,
          });
          await sectionRepository.save(section);
          console.log(`  Created section: ${section.name}`);
        } else {
          // Update existing section content
          existingSection.content = sectionData.content;
          existingSection.description = sectionData.description;
          if (sectionData.cmsEndpoint) {
            existingSection.cmsEndpoint = sectionData.cmsEndpoint;
          }
          await sectionRepository.save(existingSection);
          console.log(`  Updated section: ${existingSection.name}`);
        }
      }
    }

    console.log('\nPage content seed completed successfully!');
    await connection.close();
  } catch (error) {
    console.error('Error seeding page content:', error);
    process.exit(1);
  }
}

// Run seed if called directly
if (require.main === module) {
  seedPageContent();
}

export { seedPageContent };