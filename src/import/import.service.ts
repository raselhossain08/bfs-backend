import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Donation } from '../causes/entities/donation.entity';
import { User } from '../users/entities/user.entity';
import { Cause } from '../causes/entities/cause.entity';
import { Event } from '../events/entities/event.entity';
import { Volunteer } from '../volunteers/entities/volunteer.entity';

@Injectable()
export class ImportService {
  constructor(
    @InjectRepository(Donation)
    private donationRepository: Repository<Donation>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Cause)
    private causeRepository: Repository<Cause>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(Volunteer)
    private volunteerRepository: Repository<Volunteer>,
    private dataSource: DataSource,
  ) {}

  /**
   * Parse CSV buffer to array of objects
   */
  private parseCSV(buffer: Buffer): any[] {
    const content = buffer.toString('utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) return [];
    
    const headers = this.parseCSVLine(lines[0]);
    const results: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const row: any = {};
      headers.forEach((header, index) => {
        row[header.trim()] = values[index]?.trim() || '';
      });
      results.push(row);
    }
    
    return results;
  }

  /**
   * Parse a single CSV line handling quoted values
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }

  /**
   * Import data from CSV file
   */
  async importFromCSV(
    entityType: string,
    fileBuffer: Buffer,
    userId: number,
  ): Promise<{ success: boolean; count: number; errors: string[] }> {
    const errors: string[] = [];
    let count = 0;

    try {
      const results = this.parseCSV(fileBuffer);
      await this.processImport(
        entityType,
        results,
        userId,
        (c, e) => {
          count = c;
          errors.push(...e);
        },
      );

      return { success: true, count, errors };
    } catch (error) {
      throw new BadRequestException('Invalid CSV format');
    }
  }

  /**
   * Import data from JSON file
   */
  async importFromJSON(
    entityType: string,
    fileBuffer: Buffer,
    userId: number,
  ): Promise<{ success: boolean; count: number; errors: string[] }> {
    const errors: string[] = [];
    let count = 0;

    try {
      const data = JSON.parse(fileBuffer.toString('utf-8'));
      const results = Array.isArray(data) ? data : [data];

      await this.processImport(entityType, results, userId, (c, e) => {
        count = c;
        errors.push(...e);
      });

      return { success: true, count, errors };
    } catch (error) {
      throw new BadRequestException('Invalid JSON format');
    }
  }

  /**
   * Process import based on entity type
   */
  private async processImport(
    entityType: string,
    data: any[],
    userId: number,
    callback: (count: number, errors: string[]) => void,
    onComplete?: () => void,
  ): Promise<void> {
    const errors: string[] = [];
    let count = 0;

    return await this.dataSource.transaction(async (manager) => {
      for (let i = 0; i < data.length; i++) {
        try {
          const item = data[i];

          switch (entityType.toLowerCase()) {
            case 'donations':
              await this.importDonation(manager, item, userId);
              break;
            case 'users':
              await this.importUser(manager, item, userId);
              break;
            case 'causes':
              await this.importCause(manager, item, userId);
              break;
            case 'programs':
              await this.importProgram(manager, item, userId);
              break;
            case 'events':
              await this.importEvent(manager, item, userId);
              break;
            case 'services':
              await this.importService(manager, item, userId);
              break;
            case 'success-stories':
              await this.importSuccessStory(manager, item, userId);
              break;
            case 'pages':
              await this.importPage(manager, item, userId);
              break;
            case 'volunteers':
              await this.importVolunteer(manager, item, userId);
              break;
            default:
              throw new BadRequestException(
                `Unsupported entity type: ${entityType}`,
              );
          }

          count++;
        } catch (error) {
          errors.push(`Row ${i + 1}: ${error.message}`);
        }
      }

      callback(count, errors);
      if (onComplete) onComplete();
    });
  }

  /**
   * Import donation record
   */
  private async importDonation(
    manager: any,
    data: any,
    userId: number,
  ): Promise<void> {
    // Validate required fields
    if (!data.amount || !data.transactionId) {
      throw new Error('Missing required fields: amount, transactionId');
    }

    // Check for duplicate transaction ID
    const existing = await manager.findOne('Donation', {
      where: { transactionId: data.transactionId },
    });

    if (existing) {
      throw new Error('Duplicate transaction ID');
    }

    // Create donation
    const donation = manager.create('Donation', {
      transactionId: data.transactionId,
      amount: parseFloat(data.amount),
      currency: data.currency || 'USD',
      causeId: data.causeId ? parseInt(data.causeId, 10) : null,
      causeName: data.causeName || 'General Support',
      paymentMethod: data.paymentMethod || 'Import',
      status: data.status || 'completed',
      donorId: data.donorId ? parseInt(data.donorId, 10) : null,
      name: data.name || 'Anonymous',
      email: data.email,
      motivation: data.motivation,
      isAnonymous: data.isAnonymous === 'true' || data.isAnonymous === true,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    });

    await manager.save('Donation', donation);

    // Update cause stats if linked
    if (donation.causeId) {
      await this.updateCauseStats(manager, donation.causeId);
    }
  }

  /**
   * Import user record
   */
  private async importUser(
    manager: any,
    data: any,
    userId: number,
  ): Promise<void> {
    if (!data.email) {
      throw new Error('Missing required field: email');
    }

    // Check for duplicate email
    const existing = await manager.findOne('User', {
      where: { email: data.email },
    });

    if (existing) {
      throw new Error('Duplicate email');
    }

    const user = manager.create('User', {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role || 'user',
      status: data.status || 'active',
      phone: data.phone,
      avatar: data.avatar,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    });

    await manager.save('User', user);
  }

  /**
   * Import cause record
   */
  private async importCause(
    manager: any,
    data: any,
    userId: number,
  ): Promise<void> {
    if (!data.title) {
      throw new Error('Missing required field: title');
    }

    let gallery = data.gallery;
    if (typeof gallery === 'string') {
      try {
        gallery = JSON.parse(gallery);
      } catch {
        gallery = gallery ? [gallery] : [];
      }
    }

    let videos = data.videos;
    if (typeof videos === 'string') {
      try {
        videos = JSON.parse(videos);
      } catch {
        videos = [];
      }
    }

    let contentBlocks = data.contentBlocks;
    if (typeof contentBlocks === 'string') {
      try {
        contentBlocks = JSON.parse(contentBlocks);
      } catch {
        contentBlocks = [];
      }
    }

    let tags = data.tags;
    if (typeof tags === 'string') {
      try {
        tags = JSON.parse(tags);
      } catch {
        tags = tags ? [tags] : [];
      }
    }

    let metaKeywords = data.metaKeywords;
    if (typeof metaKeywords === 'string') {
      try {
        metaKeywords = JSON.parse(metaKeywords);
      } catch {
        metaKeywords = metaKeywords ? [metaKeywords] : [];
      }
    }

    const cause = manager.create('Cause', {
      title: data.title,
      slug: data.slug || this.generateSlug(data.title),
      shortDescription: data.shortDescription,
      description: data.description,
      content: data.content,
      image: data.image,
      gallery: gallery || [],
      videos: videos || [],
      videoUrl: data.videoUrl,
      categoryId: data.categoryId ? parseInt(data.categoryId, 10) : null,
      tags: tags || [],
      tagColor: data.tagColor,
      goal: data.goal ? parseFloat(data.goal) : 0,
      raised: data.raised ? parseFloat(data.raised) : 0,
      donors: data.donors ? parseInt(data.donors, 10) : 0,
      progress: data.progress ? parseInt(data.progress, 10) : 0,
      location: data.location,
      impact: data.impact,
      metric: data.metric,
      status: data.status || 'active',
      isFeatured: data.isFeatured === 'true' || data.isFeatured === true,
      isUrgent: data.isUrgent === 'true' || data.isUrgent === true,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      metaKeywords: metaKeywords || [],
      beneficiaries: data.beneficiaries ? parseInt(data.beneficiaries, 10) : null,
      currency: data.currency || 'USD',
      contentBlocks: contentBlocks || [],
      createdBy: userId,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    });

    await manager.save('Cause', cause);
  }

  /**
   * Import program record
   */
  private async importProgram(
    manager: any,
    data: any,
    userId: number,
  ): Promise<void> {
    if (!data.title) {
      throw new Error('Missing required field: title');
    }

    let gallery = data.gallery;
    if (typeof gallery === 'string') {
      try { gallery = JSON.parse(gallery); } catch { gallery = gallery ? [gallery] : []; }
    }

    let milestones = data.milestones;
    if (typeof milestones === 'string') {
      try { milestones = JSON.parse(milestones); } catch { milestones = []; }
    }

    let contentBlocks = data.contentBlocks;
    if (typeof contentBlocks === 'string') {
      try { contentBlocks = JSON.parse(contentBlocks); } catch { contentBlocks = []; }
    }

    let metaKeywords = data.metaKeywords;
    if (typeof metaKeywords === 'string') {
      try { metaKeywords = JSON.parse(metaKeywords); } catch { metaKeywords = metaKeywords ? [metaKeywords] : []; }
    }

    const program = manager.create('Program', {
      title: data.title,
      slug: data.slug || this.generateSlug(data.title),
      shortDescription: data.shortDescription,
      description: data.description,
      content: data.content,
      image: data.image,
      gallery: gallery || [],
      icon: data.icon,
      color: data.color,
      category: data.category,
      location: data.location,
      beneficiaries: data.beneficiaries ? parseInt(data.beneficiaries, 10) : null,
      impact: data.impact,
      metric: data.metric,
      goal: data.goal ? parseFloat(data.goal) : null,
      raised: data.raised ? parseFloat(data.raised) : null,
      milestones: milestones || [],
      videoUrl: data.videoUrl,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      metaKeywords: metaKeywords || [],
      status: data.status || 'active',
      isFeatured: data.isFeatured === 'true' || data.isFeatured === true,
      contentBlocks: contentBlocks || [],
      createdBy: userId,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    });

    await manager.save('Program', program);
  }

  /**
   * Import event record
   */
  private async importEvent(
    manager: any,
    data: any,
    userId: number,
  ): Promise<void> {
    if (!data.title) {
      throw new Error('Missing required field: title');
    }

    let gallery = data.gallery;
    if (typeof gallery === 'string') {
      try { gallery = JSON.parse(gallery); } catch { gallery = gallery ? [gallery] : []; }
    }

    let contentBlocks = data.contentBlocks;
    if (typeof contentBlocks === 'string') {
      try { contentBlocks = JSON.parse(contentBlocks); } catch { contentBlocks = []; }
    }

    let metaKeywords = data.metaKeywords;
    if (typeof metaKeywords === 'string') {
      try { metaKeywords = JSON.parse(metaKeywords); } catch { metaKeywords = metaKeywords ? [metaKeywords] : []; }
    }

    const event = manager.create('Event', {
      title: data.title,
      slug: data.slug || this.generateSlug(data.title),
      description: data.description,
      content: data.content,
      shortDescription: data.shortDescription,
      image: data.image,
      gallery: gallery || [],
      videoUrl: data.videoUrl,
      virtualUrl: data.virtualUrl,
      location: data.location,
      locationType: data.locationType || 'physical',
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      maxAttendees: data.maxAttendees ? parseInt(data.maxAttendees, 10) : null,
      currentAttendees: data.currentAttendees ? parseInt(data.currentAttendees, 10) : 0,
      requiresRegistration: data.requiresRegistration === 'true' || data.requiresRegistration === true,
      registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline) : null,
      organizerName: data.organizerName,
      organizerEmail: data.organizerEmail,
      organizerPhone: data.organizerPhone,
      status: data.status || 'Upcoming',
      isFeatured: data.isFeatured === 'true' || data.isFeatured === true,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      metaKeywords: metaKeywords || [],
      contentBlocks: contentBlocks || [],
      eventTypeId: data.eventTypeId ? parseInt(data.eventTypeId, 10) : null,
      createdBy: userId,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    });

    await manager.save('Event', event);
  }

  /**
   * Import volunteer record
   */
  private async importVolunteer(
    manager: any,
    data: any,
    userId: number,
  ): Promise<void> {
    if (!data.name || !data.email) {
      throw new Error('Missing required fields: name, email');
    }

    let skills = data.skills;
    if (typeof skills === 'string') {
      try { skills = JSON.parse(skills); } catch { skills = skills ? skills.split(',').map((s: string) => s.trim()) : []; }
    }

    let languages = data.languages;
    if (typeof languages === 'string') {
      try { languages = JSON.parse(languages); } catch { languages = languages ? languages.split(',').map((s: string) => s.trim()) : []; }
    }

    let fundingPhases = data.fundingPhases;
    if (typeof fundingPhases === 'string') {
      try { fundingPhases = JSON.parse(fundingPhases); } catch { fundingPhases = []; }
    }

    let blocks = data.blocks;
    if (typeof blocks === 'string') {
      try { blocks = JSON.parse(blocks); } catch { blocks = []; }
    }

    let socialLinks = data.socialLinks;
    if (typeof socialLinks === 'string') {
      try { socialLinks = JSON.parse(socialLinks); } catch { socialLinks = {}; }
    }

    let seo = data.seo;
    if (typeof seo === 'string') {
      try { seo = JSON.parse(seo); } catch { seo = {}; }
    }

    const volunteer = manager.create('Volunteer', {
      name: data.name,
      email: data.email,
      phone: data.phone,
      location: data.location,
      slug: data.slug || this.generateSlug(data.name),
      role: data.role,
      title: data.title,
      bio: data.bio,
      impact: data.impact,
      avatar: data.avatar,
      skills: skills || [],
      languages: languages || [],
      experienceTitle: data.experienceTitle,
      experienceSubtitle: data.experienceSubtitle,
      experienceDescription: data.experienceDescription,
      fundingPhases: fundingPhases || [],
      blocks: blocks || [],
      socialLinks: socialLinks || {},
      seo: seo || {},
      status: data.status || 'active',
      order: data.order ? parseInt(data.order, 10) : 0,
      createdBy: userId,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    });

    await manager.save('Volunteer', volunteer);
  }

  /**
   * Import service record
   */
  private async importService(
    manager: any,
    data: any,
    userId: number,
  ): Promise<void> {
    if (!data.title) {
      throw new Error('Missing required field: title');
    }

    let gallery = data.gallery;
    if (typeof gallery === 'string') {
      try { gallery = JSON.parse(gallery); } catch { gallery = gallery ? [gallery] : []; }
    }

    let directives = data.directives;
    if (typeof directives === 'string') {
      try { directives = JSON.parse(directives); } catch { directives = []; }
    }

    let contentBlocks = data.contentBlocks;
    if (typeof contentBlocks === 'string') {
      try { contentBlocks = JSON.parse(contentBlocks); } catch { contentBlocks = []; }
    }

    let metaKeywords = data.metaKeywords;
    if (typeof metaKeywords === 'string') {
      try { metaKeywords = JSON.parse(metaKeywords); } catch { metaKeywords = metaKeywords ? [metaKeywords] : []; }
    }

    let categories = data.categories;
    if (typeof categories === 'string') {
      try { categories = JSON.parse(categories); } catch { categories = []; }
    }

    const service = manager.create('Service', {
      title: data.title,
      slug: data.slug || this.generateSlug(data.title),
      description: data.description,
      content: data.content,
      shortDescription: data.shortDescription,
      image: data.image,
      gallery: gallery || [],
      icon: data.icon,
      categoryId: data.categoryId ? parseInt(data.categoryId, 10) : null,
      categories: categories || [],
      missionTitle: data.missionTitle,
      missionSubtitle: data.missionSubtitle,
      missionDescription: data.missionDescription,
      directives: directives || [],
      videoUrl: data.videoUrl,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      metaKeywords: metaKeywords || [],
      status: data.status || 'active',
      isFeatured: data.isFeatured === 'true' || data.isFeatured === true,
      contentBlocks: contentBlocks || [],
      createdBy: userId,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    });

    await manager.save('Service', service);
  }

  /**
   * Import success story record
   */
  private async importSuccessStory(
    manager: any,
    data: any,
    userId: number,
  ): Promise<void> {
    if (!data.title) {
      throw new Error('Missing required field: title');
    }

    let gallery = data.gallery;
    if (typeof gallery === 'string') {
      try { gallery = JSON.parse(gallery); } catch { gallery = gallery ? [gallery] : []; }
    }

    let contentBlocks = data.contentBlocks;
    if (typeof contentBlocks === 'string') {
      try { contentBlocks = JSON.parse(contentBlocks); } catch { contentBlocks = []; }
    }

    let metaKeywords = data.metaKeywords;
    if (typeof metaKeywords === 'string') {
      try { metaKeywords = JSON.parse(metaKeywords); } catch { metaKeywords = metaKeywords ? [metaKeywords] : []; }
    }

    const story = manager.create('SuccessStory', {
      title: data.title,
      slug: data.slug || this.generateSlug(data.title),
      name: data.name,
      category: data.category,
      color: data.color,
      region: data.region,
      story: data.story,
      fullStory: data.fullStory,
      description: data.description,
      shortDescription: data.shortDescription,
      image: data.image,
      gallery: gallery || [],
      videoUrl: data.videoUrl,
      impact: data.impact,
      year: data.year,
      amount: data.amount ? parseFloat(data.amount) : null,
      status: data.status || 'draft',
      isFeatured: data.isFeatured === 'true' || data.isFeatured === true,
      order: data.order ? parseInt(data.order, 10) : 0,
      contentBlocks: contentBlocks || [],
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      metaKeywords: metaKeywords || [],
    });

    await manager.save('SuccessStory', story);
  }

  /**
   * Import page record
   */
  private async importPage(
    manager: any,
    data: any,
    userId: number,
  ): Promise<void> {
    if (!data.title) {
      throw new Error('Missing required field: title');
    }

    let metaKeywords = data.metaKeywords;
    if (typeof metaKeywords === 'string') {
      try { metaKeywords = JSON.parse(metaKeywords); } catch { metaKeywords = metaKeywords ? [metaKeywords] : []; }
    }

    const page = manager.create('Page', {
      title: data.title,
      slug: data.slug || this.generateSlug(data.title),
      description: data.description,
      type: data.type || 'static',
      icon: data.icon,
      status: data.status || 'draft',
      order: data.order ? parseInt(data.order, 10) : 0,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      metaKeywords: metaKeywords || [],
    });

    await manager.save('Page', page);
  }

  /**
   * Update cause stats (helper method)
   */
  private async updateCauseStats(
    manager: any,
    causeId: number,
  ): Promise<void> {
    const result = await manager
      .createQueryBuilder('Donation', 'donation')
      .select('SUM(donation.amount)', 'totalRaised')
      .addSelect('COUNT(DISTINCT donation.email)', 'uniqueDonors')
      .where('donation.causeId = :causeId', { causeId })
      .andWhere('donation.status = :status', { status: 'completed' })
      .getRawOne();

    const totalRaised = parseFloat(result?.totalRaised || '0');
    const uniqueDonors = parseInt(result?.uniqueDonors || '0', 10);

    const cause = await manager.findOne('Cause', { where: { id: causeId } });
    if (cause) {
      const goal = parseFloat(cause.goal?.toString() || '0');
      const progress =
        goal > 0 ? Math.min(100, Math.round((totalRaised / goal) * 100)) : 0;

      await manager.update('Cause', causeId, {
        raised: totalRaised,
        donors: uniqueDonors,
        progress,
      });
    }
  }

  /**
   * Generate URL-friendly slug
   */
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
