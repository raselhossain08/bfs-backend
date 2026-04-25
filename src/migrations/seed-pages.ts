import { createConnection } from 'typeorm';
import { Page } from '../pages/entities/page.entity';

async function seedPages() {
  console.log('Starting pages seed process...');
  try {
    const connection = await createConnection({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'bfs',
      entities: [Page],
      synchronize: false,
    });

    const pageRepository = connection.getRepository(Page);

    // Check if pages already exist
    const existingCount = await pageRepository.count();
    if (existingCount > 0) {
      console.log(`${existingCount} pages already exist. Skipping seed.`);
      await connection.close();
      return;
    }

    // Initial pages data
    const pagesData = [
      {
        title: 'Home',
        slug: 'home',
        description: 'Main landing page',
        type: 'static',
        status: 'published',
        order: 1,
        metaTitle: 'Birdsfly Foundation - Home',
        metaDescription: 'Welcome to Birdsfly Foundation',
      },
      {
        title: 'About Us',
        slug: 'about',
        description: 'About our organization',
        type: 'static',
        status: 'published',
        order: 2,
        metaTitle: 'About Us - Birdsfly Foundation',
        metaDescription: 'Learn about our mission and vision',
      },
      {
        title: 'Contact',
        slug: 'contact',
        description: 'Contact information',
        type: 'static',
        status: 'published',
        order: 3,
        metaTitle: 'Contact Us',
        metaDescription: 'Get in touch with us',
      },
      {
        title: 'Donate',
        slug: 'donate',
        description: 'Support our cause',
        type: 'static',
        status: 'published',
        order: 4,
        metaTitle: 'Donate - Birdsfly Foundation',
        metaDescription: 'Support our humanitarian efforts',
      },
      {
        title: 'Blog',
        slug: 'blog',
        description: 'Latest news and updates',
        type: 'dynamic',
        status: 'published',
        order: 5,
        metaTitle: 'Blog - Birdsfly Foundation',
        metaDescription: 'Read our latest stories',
      },
      {
        title: 'Events',
        slug: 'events',
        description: 'Upcoming events',
        type: 'dynamic',
        status: 'published',
        order: 6,
        metaTitle: 'Events - Birdsfly Foundation',
        metaDescription: 'Join our upcoming events',
      },
      {
        title: 'Programs',
        slug: 'programs',
        description: 'Our programs and initiatives',
        type: 'dynamic',
        status: 'published',
        order: 7,
        metaTitle: 'Programs - Birdsfly Foundation',
        metaDescription: 'Explore our programs',
      },
      {
        title: 'Causes',
        slug: 'causes',
        description: 'Support our causes',
        type: 'dynamic',
        status: 'published',
        order: 8,
        metaTitle: 'Causes - Birdsfly Foundation',
        metaDescription: 'Support our fundraising causes',
      },
      {
        title: 'Services',
        slug: 'service',
        description: 'Services we offer',
        type: 'dynamic',
        status: 'published',
        order: 9,
        metaTitle: 'Services - Birdsfly Foundation',
        metaDescription: 'Learn about our services',
      },
      {
        title: 'Success Stories',
        slug: 'success-stories',
        description: 'Stories of impact',
        type: 'dynamic',
        status: 'published',
        order: 10,
        metaTitle: 'Success Stories - Birdsfly Foundation',
        metaDescription: 'Read our impact stories',
      },
      {
        title: 'Volunteers',
        slug: 'volunteers',
        description: 'Our volunteer team',
        type: 'dynamic',
        status: 'published',
        order: 11,
        metaTitle: 'Volunteers - Birdsfly Foundation',
        metaDescription: 'Meet our volunteers',
      },
      {
        title: 'Gallery',
        slug: 'gallery',
        description: 'Photo gallery',
        type: 'static',
        status: 'published',
        order: 12,
        metaTitle: 'Gallery - Birdsfly Foundation',
        metaDescription: 'View our gallery',
      },
      {
        title: 'FAQ',
        slug: 'faq',
        description: 'Frequently asked questions',
        type: 'static',
        status: 'published',
        order: 13,
        metaTitle: 'FAQ - Birdsfly Foundation',
        metaDescription: 'Common questions answered',
      },
      {
        title: 'Privacy Policy',
        slug: 'privacy-policy',
        description: 'Our privacy policy',
        type: 'static',
        status: 'published',
        order: 14,
        metaTitle: 'Privacy Policy - Birdsfly Foundation',
        metaDescription: 'Read our privacy policy',
      },
      {
        title: 'Terms & Conditions',
        slug: 'terms',
        description: 'Terms of service',
        type: 'static',
        status: 'published',
        order: 15,
        metaTitle: 'Terms & Conditions - Birdsfly Foundation',
        metaDescription: 'Read our terms of service',
      },
      {
        title: 'Cookie Policy',
        slug: 'cookie-policy',
        description: 'Cookie usage policy',
        type: 'static',
        status: 'published',
        order: 16,
        metaTitle: 'Cookie Policy - Birdsfly Foundation',
        metaDescription: 'Learn about cookies',
      },
      {
        title: 'Donation Policy',
        slug: 'donation-policy',
        description: 'Donation and refund policy',
        type: 'static',
        status: 'published',
        order: 17,
        metaTitle: 'Donation Policy - Birdsfly Foundation',
        metaDescription: 'Read our donation policy',
      },
      {
        title: 'About Trust',
        slug: 'about-trust',
        description: 'Trust registration details',
        type: 'static',
        status: 'published',
        order: 18,
        metaTitle: 'About Trust - Birdsfly Foundation',
        metaDescription: 'Learn about our trust',
      },
      {
        title: 'Transparency',
        slug: 'transparency',
        description: 'Financial transparency',
        type: 'static',
        status: 'published',
        order: 19,
        metaTitle: 'Transparency - Birdsfly Foundation',
        metaDescription: 'View our financial reports',
      },
    ];

    // Create pages
    for (const pageData of pagesData) {
      const page = pageRepository.create(pageData);
      await pageRepository.save(page);
      console.log(`Created page: ${page.title} (${page.slug})`);
    }

    console.log(`Successfully created ${pagesData.length} pages.`);
    await connection.close();
  } catch (error) {
    console.error('Error seeding pages:', error);
    process.exit(1);
  }
}

seedPages();
