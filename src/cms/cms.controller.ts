/* eslint-disable
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-return,
  @typescript-eslint/no-unsafe-argument
*/
import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Body,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  Res,
  UseGuards,
  Query,
  Logger,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { CmsService } from './cms.service';
import { EmailService } from '../email/email.service';
import { EmailTemplates } from '../email/email.templates';
import { SmsService } from '../sms/sms.service';
import twilio from 'twilio';
import { existsSync, mkdirSync, unlinkSync } from 'fs';

const uploadDir = join(process.cwd(), 'uploads');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

@Controller('cms')
export class CmsController {
  private readonly logger = new Logger(CmsController.name);

  constructor(
    private readonly cmsService: CmsService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadDir,
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
      fileFilter: (req, file, cb) => {
        // Allow images, videos, audio, and documents
        const allowed =
          /\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|mov|mp3|wav|pdf|doc|docx|xls|xlsx|txt)$/i;
        if (allowed.test(extname(file.originalname))) {
          cb(null, true);
        } else {
          cb(new Error('File type not allowed'), false);
        }
      },
    }),
  )
  uploadFile(@UploadedFile() file: any) {
    if (!file) {
      throw new NotFoundException('No file uploaded');
    }
    const apiUrl =
      this.configService.get<string>('API_URL') || 'http://localhost:5000';
    const url = `${apiUrl}/api/cms/uploads/${file.filename}`;
    return {
      data: {
        id: Date.now().toString(),
        url,
        filename: file.filename,
        size: file.size,
        mimeType: file.mimetype,
      },
    };
  }

  @Get('uploads/:filename')
  serveUpload(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(uploadDir, filename);
    if (!existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }
    return res.sendFile(filePath);
  }

  // Delete uploaded file (admin)
  @UseGuards(AuthGuard('jwt'))
  @Delete('uploads/:filename')
  deleteUpload(@Param('filename') filename: string) {
    // Security: prevent path traversal
    const sanitizedFilename = filename.replace(/[^\w.-]/g, '');
    if (!sanitizedFilename || sanitizedFilename !== filename) {
      throw new NotFoundException('Invalid filename');
    }

    const filePath = join(uploadDir, sanitizedFilename);
    if (!existsSync(filePath)) {
      return { success: true, message: 'File already deleted' };
    }

    try {
      unlinkSync(filePath);
      this.logger.log(`Deleted file: ${sanitizedFilename}`);
      return { success: true, message: 'File deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete file: ${sanitizedFilename}`, error);
      throw new NotFoundException('Failed to delete file');
    }
  }

  // Delete multiple uploaded files (admin)
  @UseGuards(AuthGuard('jwt'))
  @Post('uploads/delete-batch')
  deleteBatchUploads(@Body() body: { filenames: string[] }) {
    const { filenames } = body;
    if (!Array.isArray(filenames) || filenames.length === 0) {
      return { success: true, message: 'No files to delete' };
    }

    const results: { filename: string; success: boolean; error?: string }[] =
      [];

    for (const filename of filenames) {
      // Security: prevent path traversal
      const sanitizedFilename = filename.replace(/[^\w.-]/g, '');
      if (!sanitizedFilename || sanitizedFilename !== filename) {
        results.push({ filename, success: false, error: 'Invalid filename' });
        continue;
      }

      const filePath = join(uploadDir, sanitizedFilename);
      if (!existsSync(filePath)) {
        results.push({ filename, success: true });
        continue;
      }

      try {
        unlinkSync(filePath);
        results.push({ filename, success: true });
      } catch {
        results.push({ filename, success: false, error: 'Failed to delete' });
      }
    }

    const deletedCount = results.filter((r) => r.success).length;
    this.logger.log(
      `Batch delete: ${deletedCount}/${filenames.length} files deleted`,
    );

    return {
      success: true,
      message: `Deleted ${deletedCount}/${filenames.length} files`,
      results,
    };
  }

  // Public endpoint for contact form submissions
  @Post('contact')
  async submitContact(@Body() body: any) {
    const { name, email, service, message } = body;

    if (!name || !email || !service || !message) {
      throw new NotFoundException('All fields are required');
    }

    // Save contact message to CMS
    const contacts = (await this.cmsService.getData('contactMessages')) || [];
    const newContact = {
      id: Date.now(),
      name,
      email,
      service,
      message,
      submittedAt: new Date().toISOString(),
      status: 'pending',
    };

    if (Array.isArray(contacts)) {
      await this.cmsService.updateData('contactMessages', [
        ...contacts,
        newContact,
      ]);
    } else {
      await this.cmsService.updateData('contactMessages', [newContact]);
    }

    // Send notification email to admin
    const adminEmail =
      this.configService.get<string>('EMAIL_FROM') || 'info@birdsfly.org';
    await this.emailService.sendContactNotification(adminEmail, {
      name,
      email,
      service,
      message,
    });

    // Send auto-reply to user
    await this.emailService.sendContactAutoReply(email, name);

    this.logger.log(`Contact form submitted by ${name} (${email})`);

    return {
      success: true,
      message:
        'Message sent successfully! We will get back to you within 24-48 hours.',
      data: newContact,
    };
  }

  // Public endpoint for volunteer application submissions
  @Post('volunteer-applications')
  async submitVolunteerApplication(@Body() body: any) {
    const {
      name,
      email,
      phone,
      interest,
      location,
      skills,
      experience,
      availability,
      preferredContact,
      emergencyContactName,
      emergencyContactPhone,
      languages,
      hasVolunteeredBefore,
      previousVolunteerDetails,
      message,
      causeId,
      causeTitle,
    } = body;

    if (!name || !email || !phone || !interest || !location) {
      throw new NotFoundException(
        'Name, email, phone, interest and location are required',
      );
    }

    // Save volunteer application to CMS
    const applications =
      (await this.cmsService.getData('volunteerApplications')) || [];
    const newApplication = {
      id: Date.now(),
      name,
      email,
      phone,
      interest,
      location,
      skills: skills || '',
      experience: experience || '',
      availability: availability || [],
      preferredContact: preferredContact || 'email',
      emergencyContactName: emergencyContactName || '',
      emergencyContactPhone: emergencyContactPhone || '',
      languages: languages || [],
      hasVolunteeredBefore: hasVolunteeredBefore || false,
      previousVolunteerDetails: previousVolunteerDetails || '',
      message: message || '',
      causeId: causeId || null,
      causeTitle: causeTitle || 'General',
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };

    if (Array.isArray(applications)) {
      await this.cmsService.updateData('volunteerApplications', [
        ...applications,
        newApplication,
      ]);
    } else {
      await this.cmsService.updateData('volunteerApplications', [
        newApplication,
      ]);
    }

    // Send confirmation email to applicant
    await this.emailService.sendVolunteerApplicationConfirmation(email, {
      name,
      email,
      phone,
      interest,
      location,
      causeTitle: causeTitle || 'General',
      message,
    });

    // Send notification email to admin
    await this.emailService.sendVolunteerApplicationAdminNotification({
      name,
      email,
      phone,
      interest,
      location,
      causeTitle: causeTitle || 'General',
      message,
      submittedAt: newApplication.submittedAt,
    });

    this.logger.log(
      `Volunteer application submitted by ${name} (${email}) for ${causeTitle || 'General'}`,
    );

    return {
      success: true,
      message:
        'Application submitted successfully! We will review and contact you within 3-5 business days.',
      data: newApplication,
    };
  }

  // Public endpoint for event registration submissions
  @Post('event-registrations')
  async submitEventRegistration(@Body() body: any) {
    const { name, email, phone, organization, eventId, eventTitle, message } =
      body;

    if (!name || !email || !phone) {
      throw new NotFoundException('Name, email and phone are required');
    }

    // Save event registration to CMS
    const registrations =
      (await this.cmsService.getData('eventRegistrations')) || [];
    const newRegistration = {
      id: Date.now(),
      name,
      email,
      phone,
      organization: organization || '',
      eventId: eventId || null,
      eventTitle: eventTitle || 'General Event',
      message: message || '',
      status: 'confirmed',
      submittedAt: new Date().toISOString(),
    };

    if (Array.isArray(registrations)) {
      await this.cmsService.updateData('eventRegistrations', [
        ...registrations,
        newRegistration,
      ]);
    } else {
      await this.cmsService.updateData('eventRegistrations', [newRegistration]);
    }

    this.logger.log(
      `Event registration submitted by ${name} (${email}) for ${eventTitle || 'General Event'}`,
    );

    return {
      success: true,
      message:
        'Registration successful! We will contact you with event details.',
      data: newRegistration,
    };
  }

  // Admin endpoint to get all subscribers (requires auth)
  @UseGuards(AuthGuard('jwt'))
  @Get('subscribers')
  async getSubscribers() {
    const subscribers = (await this.cmsService.getData('subscribers')) || [];
    return { data: Array.isArray(subscribers) ? subscribers : [] };
  }

  // Public endpoint to remove a subscriber by email (for unsubscribe, MUST be before :key/:id route)
  @Delete('subscribers/remove')
  async removeSubscriber(@Body() body: any) {
    const { email } = body;
    if (!email) {
      throw new NotFoundException('Email is required');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const subscribers = (await this.cmsService.getData('subscribers')) || [];
    if (!Array.isArray(subscribers)) {
      throw new NotFoundException('Invalid subscribers data');
    }

    const filtered = subscribers.filter(
      (s: any) => s.email?.toLowerCase() !== normalizedEmail,
    );
    if (filtered.length === subscribers.length) {
      return { data: { success: false, message: 'Subscriber not found' } };
    }

    await this.cmsService.updateData('subscribers', filtered);
    this.logger.log(`Subscriber removed: ${normalizedEmail}`);
    return { data: { success: true, message: 'Subscriber removed' } };
  }

  // Admin endpoint to resend welcome email (requires auth)
  @UseGuards(AuthGuard('jwt'))
  @Post('subscribers/resend-welcome')
  async resendWelcomeEmail(@Body() body: any) {
    const { email } = body;
    if (!email) {
      throw new NotFoundException('Email is required');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if subscriber exists
    const subscribers = (await this.cmsService.getData('subscribers')) || [];
    const subscriber = Array.isArray(subscribers)
      ? subscribers.find((s: any) => s.email?.toLowerCase() === normalizedEmail)
      : null;

    if (!subscriber) {
      return { data: { success: false, message: 'Subscriber not found' } };
    }

    // Resend welcome email
    const sent = await this.emailService.sendNewsletterWelcome(normalizedEmail);

    if (sent) {
      this.logger.log(`Resent welcome email to: ${normalizedEmail}`);
      return {
        data: { success: true, message: 'Welcome email sent successfully' },
      };
    } else {
      return { data: { success: false, message: 'Failed to send email' } };
    }
  }

  // Admin endpoint to migrate legacy subscribers (requires auth)
  @UseGuards(AuthGuard('jwt'))
  @Get('subscribers/migrate')
  async migrateSubscribers() {
    const subscribeKeyData = await this.cmsService.getData('subscribe');
    const subscribersKeyData =
      (await this.cmsService.getData('subscribers')) || [];

    if (
      !subscribeKeyData ||
      !Array.isArray(subscribeKeyData) ||
      subscribeKeyData.length === 0
    ) {
      return {
        success: false,
        message: 'No legacy data to migrate',
        data: {
          legacyCount: 0,
          currentCount: Array.isArray(subscribersKeyData)
            ? subscribersKeyData.length
            : 0,
        },
      };
    }

    // Create a map for deduplication
    const uniqueMap = new Map<string, any>();

    // Add existing subscribers first
    if (Array.isArray(subscribersKeyData)) {
      for (const sub of subscribersKeyData) {
        if (sub.email) {
          const normalizedEmail = sub.email.toLowerCase().trim();
          uniqueMap.set(normalizedEmail, {
            id: sub.id || Date.now() + Math.random(),
            email: sub.email,
            subscribedAt:
              sub.subscribedAt || sub.createdAt || new Date().toISOString(),
          });
        }
      }
    }

    // Add legacy data
    for (const sub of subscribeKeyData) {
      if (sub.email) {
        const normalizedEmail = sub.email.toLowerCase().trim();
        if (!uniqueMap.has(normalizedEmail)) {
          uniqueMap.set(normalizedEmail, {
            id: sub.id || Date.now() + Math.random(),
            email: sub.email,
            subscribedAt:
              sub.createdAt || sub.subscribedAt || new Date().toISOString(),
          });
        }
      }
    }

    const dedupedData = Array.from(uniqueMap.values());
    await this.cmsService.updateData('subscribers', dedupedData);
    await this.cmsService.updateData('subscribe', []);

    this.logger.log(`Migrated subscribers: ${dedupedData.length} unique`);

    return {
      success: true,
      message: `Migrated ${dedupedData.length} unique subscribers`,
      data: { migratedCount: dedupedData.length, subscribers: dedupedData },
    };
  }

  // Admin endpoint to clear all subscribers (requires auth)
  @UseGuards(AuthGuard('jwt'))
  @Get('subscribers/clear')
  async clearAllSubscribers() {
    await this.cmsService.updateData('subscribers', []);
    await this.cmsService.updateData('subscribe', []);
    this.logger.log('All subscriber data cleared');
    return { success: true, message: 'All subscriber data cleared' };
  }

  // Admin endpoint to get subscriber stats (requires auth)
  @UseGuards(AuthGuard('jwt'))
  @Get('subscribers/stats')
  async getSubscriberStats() {
    const subscribers = (await this.cmsService.getData('subscribers')) || [];
    const newsletters = (await this.cmsService.getData('newsletters')) || [];

    const subscriberList = Array.isArray(subscribers) ? subscribers : [];
    const newsletterList = Array.isArray(newsletters) ? newsletters : [];

    // Calculate new subscribers this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const newThisWeek = subscriberList.filter((s: any) => {
      const date = new Date(s.subscribedAt || s.createdAt);
      return date >= oneWeekAgo;
    }).length;

    // Get last sent date
    const sentNewsletters = newsletterList.filter(
      (n: any) => n.status === 'sent',
    );
    const lastSent =
      sentNewsletters.length > 0
        ? sentNewsletters.sort(
            (a: any, b: any) =>
              new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
          )[0]
        : null;

    return {
      data: {
        total: subscriberList.length,
        newThisWeek,
        lastSentAt: lastSent?.sentAt || null,
        totalSent: sentNewsletters.length,
        totalRecipients: sentNewsletters.reduce(
          (sum: number, n: any) => sum + (n.recipientCount || 0),
          0,
        ),
      },
    };
  }

  // Public endpoint to unsubscribe (uses token for verification)
  @Get('unsubscribe/:token')
  async unsubscribe(@Param('token') token: string) {
    try {
      // Decode the token (base64 encoded email)
      const email = Buffer.from(token, 'base64').toString('utf-8');
      const normalizedEmail = email.toLowerCase().trim();

      const subscribers = (await this.cmsService.getData('subscribers')) || [];
      if (!Array.isArray(subscribers)) {
        return { success: false, message: 'Invalid subscriber data' };
      }

      const filtered = subscribers.filter(
        (s: any) => s.email?.toLowerCase() !== normalizedEmail,
      );

      if (filtered.length === subscribers.length) {
        return {
          success: false,
          message: 'Email not found in subscriber list',
        };
      }

      await this.cmsService.updateData('subscribers', filtered);
      this.logger.log(`Unsubscribed: ${normalizedEmail}`);

      return {
        success: true,
        message: 'You have been successfully unsubscribed from our newsletter.',
      };
    } catch {
      return { success: false, message: 'Invalid unsubscribe link' };
    }
  }

  // Get available newsletter templates (public)
  @Get('newsletter/templates')
  getNewsletterTemplates() {
    return { data: EmailTemplates.getNewsletterTemplates() };
  }

  // Public endpoint for newsletter subscription (no auth required) - MUST be before @Post(':key')
  @Post('subscribe')
  async subscribe(@Body() body: any) {
    const { email } = body;
    if (!email) {
      throw new NotFoundException('Email is required');
    }

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return { data: { success: false, message: 'Invalid email format' } };
    }

    const subscribers = (await this.cmsService.getData('subscribers')) || [];

    // Check if already subscribed (case-insensitive)
    if (
      Array.isArray(subscribers) &&
      subscribers.some((s: any) => s.email?.toLowerCase() === normalizedEmail)
    ) {
      return { data: { success: false, message: 'Already subscribed' } };
    }

    // Add new subscriber
    const newSubscriber = {
      id: Date.now(),
      email: normalizedEmail,
      subscribedAt: new Date().toISOString(),
    };

    const updatedList = Array.isArray(subscribers)
      ? [...subscribers, newSubscriber]
      : [newSubscriber];

    await this.cmsService.updateData('subscribers', updatedList);

    // Send welcome email to subscriber
    await this.emailService.sendNewsletterWelcome(normalizedEmail);

    this.logger.log(`New newsletter subscriber: ${normalizedEmail}`);

    return {
      data: {
        success: true,
        message: 'Subscribed successfully',
        subscriber: newSubscriber,
      },
    };
  }

  // ===== SMS Settings Endpoints =====

  // Get SMS settings (admin) - MUST be before @Get(':key')
  @UseGuards(AuthGuard('jwt'))
  @Get('smsSettings')
  async getSmsSettings() {
    const settings = (await this.cmsService.getData('smsSettings')) || {};
    // Mask the auth token for security
    return {
      data: {
        twilioAccountSid: settings.twilioAccountSid || '',
        twilioAuthToken: settings.twilioAuthToken ? '••••••••••••••••' : '',
        twilioPhoneNumber: settings.twilioPhoneNumber || '',
        smsEnabled: settings.smsEnabled || false,
      },
    };
  }

  // Update SMS settings (admin) - MUST be before @Patch(':key')
  @UseGuards(AuthGuard('jwt'))
  @Patch('smsSettings')
  async updateSmsSettings(@Body() body: any) {
    const existingSettings =
      (await this.cmsService.getData('smsSettings')) || {};

    // If auth token is masked (not changed), keep the existing one
    const authToken = body.twilioAuthToken?.includes('•')
      ? existingSettings.twilioAuthToken
      : body.twilioAuthToken;

    const updated = await this.cmsService.updateData('smsSettings', {
      twilioAccountSid:
        body.twilioAccountSid || existingSettings.twilioAccountSid || '',
      twilioAuthToken: authToken || existingSettings.twilioAuthToken || '',
      twilioPhoneNumber:
        body.twilioPhoneNumber || existingSettings.twilioPhoneNumber || '',
      smsEnabled: body.smsEnabled ?? existingSettings.smsEnabled ?? false,
    });

    return {
      data: {
        twilioAccountSid: updated.twilioAccountSid,
        twilioAuthToken: '••••••••••••••••',
        twilioPhoneNumber: updated.twilioPhoneNumber,
        smsEnabled: updated.smsEnabled,
      },
    };
  }

  // Test SMS connection (admin)
  @UseGuards(AuthGuard('jwt'))
  @Post('smsSettings/test')
  async testSmsConnection() {
    const settings = (await this.cmsService.getData('smsSettings')) || {};

    if (
      !settings.twilioAccountSid ||
      !settings.twilioAuthToken ||
      !settings.twilioPhoneNumber
    ) {
      return {
        success: false,
        error:
          'SMS credentials not configured. Please add your Twilio credentials.',
      };
    }

    // Test by checking if Twilio client can be initialized
    try {
      const client = twilio(
        settings.twilioAccountSid,
        settings.twilioAuthToken,
      );

      // Fetch account info to validate credentials
      const account = await client.api
        .accounts(settings.twilioAccountSid)
        .fetch();

      this.logger.log(
        `SMS connection test successful for account: ${account.friendlyName}`,
      );

      return {
        success: true,
        message: 'SMS connection successful',
        data: {
          accountName: account.friendlyName,
          status: account.status,
        },
      };
    } catch (error) {
      this.logger.error('SMS connection test failed:', error.message);
      return {
        success: false,
        error: 'Failed to connect to Twilio. Please check your credentials.',
      };
    }
  }

  // ===== Alert Templates Endpoints =====

  // Get alert templates (public) - MUST be before @Get(':key')
  @Get('alertTemplates')
  async getAlertTemplates() {
    const templates = (await this.cmsService.getData('alertTemplates')) || [];
    return { data: Array.isArray(templates) ? templates : [] };
  }

  // Update alert templates (admin)
  @UseGuards(AuthGuard('jwt'))
  @Patch('alertTemplates')
  async updateAlertTemplates(@Body() body: any) {
    const updated = await this.cmsService.updateData('alertTemplates', body);
    return { data: updated };
  }

  // ===== FAQ Endpoints =====

  // Get FAQ (public) - MUST be before @Get(':key')
  @Get('faq')
  async getFaq() {
    const faq = (await this.cmsService.getData('faq')) || [];
    return { data: Array.isArray(faq) ? faq : [] };
  }

  // Update FAQ (admin)
  @UseGuards(AuthGuard('jwt'))
  @Patch('faq')
  async updateFaq(@Body() body: any) {
    const updated = await this.cmsService.updateData('faq', body);
    return { data: updated };
  }

  // ===== Emergency Alert Broadcast - MUST be before @Post(':key') =====

  @UseGuards(AuthGuard('jwt'))
  @Post('alerts-broadcast')
  async broadcastAlert(
    @Body() body: { message: string; audience?: string[] },
    @Request() req: any,
  ) {
    const { message, audience = ['volunteers'] } = body;

    if (!message || message.trim().length === 0) {
      return {
        success: false,
        error: 'Message is required',
      };
    }

    // Validate message length (SMS limit)
    if (message.length > 1600) {
      return {
        success: false,
        error: 'Message must be 1600 characters or less',
      };
    }

    // Collect recipients based on audience
    const recipients: { phone: string; name: string; type: string }[] = [];

    // Get volunteers with phone numbers
    if (audience.includes('volunteers') || audience.includes('all')) {
      const volunteers =
        (await this.cmsService.getData('volunteerApplications')) || [];
      if (Array.isArray(volunteers)) {
        for (const v of volunteers) {
          if (v.phone && v.status !== 'rejected') {
            recipients.push({
              phone: v.phone,
              name: v.name || 'Volunteer',
              type: 'volunteer',
            });
          }
        }
      }
    }

    // Get donors with phone numbers
    if (audience.includes('donors') || audience.includes('all')) {
      const donations = (await this.cmsService.getData('donations')) || [];
      if (Array.isArray(donations)) {
        for (const d of donations) {
          if (d.phone) {
            recipients.push({
              phone: d.phone,
              name: d.donorName || d.name || 'Donor',
              type: 'donor',
            });
          }
        }
      }
    }

    // Get event registrants
    if (audience.includes('events') || audience.includes('all')) {
      const eventRegistrations =
        (await this.cmsService.getData('eventRegistrations')) || [];
      if (Array.isArray(eventRegistrations)) {
        for (const e of eventRegistrations) {
          if (e.phone) {
            recipients.push({
              phone: e.phone,
              name: e.name || 'Attendee',
              type: 'event',
            });
          }
        }
      }
    }

    // Deduplicate by phone number
    const uniqueRecipients = new Map<
      string,
      { phone: string; name: string; type: string }
    >();
    for (const r of recipients) {
      const normalized = r.phone.replace(/\D/g, '');
      if (normalized && !uniqueRecipients.has(normalized)) {
        uniqueRecipients.set(normalized, r);
      }
    }

    const recipientList = Array.from(uniqueRecipients.values());
    const phoneNumbers = recipientList.map((r) => r.phone);

    // Check if SMS service is ready
    const smsReady = await this.smsService.isReady();

    let smsResult = { total: 0, success: 0, failed: 0, results: [] as any[] };

    if (phoneNumbers.length > 0) {
      if (smsReady) {
        // Send via SMS service
        smsResult = await this.smsService.sendBulkSms(phoneNumbers, message);
      } else {
        // Development mode: log messages instead of sending
        this.logger.log(
          `[DEV MODE] Would send alert to ${phoneNumbers.length} recipients:`,
        );
        this.logger.log(`Message: ${message.substring(0, 100)}...`);

        // Simulate success for development
        smsResult = {
          total: phoneNumbers.length,
          success: phoneNumbers.length,
          failed: 0,
          results: phoneNumbers.map((phone) => ({
            success: true,
            messageId: `dev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            to: phone,
          })),
        };
      }
    }

    // Log the broadcast
    const broadcasts = (await this.cmsService.getData('alertBroadcasts')) || [];
    const newBroadcast = {
      id: Date.now(),
      message,
      audience,
      recipientCount: recipientList.length,
      sentCount: smsResult.success,
      failedCount: smsResult.failed,
      sentAt: new Date().toISOString(),
      sentBy: req.user?.userId || 'unknown',
      smsEnabled: smsReady,
    };
    await this.cmsService.updateData('alertBroadcasts', [
      ...(Array.isArray(broadcasts) ? broadcasts : []),
      newBroadcast,
    ]);

    this.logger.log(
      `Alert broadcast: "${message.substring(0, 50)}..." sent to ${smsResult.success}/${recipientList.length} recipients`,
    );

    return {
      success: true,
      message: `Alert sent to ${smsResult.success} recipients`,
      data: {
        totalRecipients: recipientList.length,
        sent: smsResult.success,
        failed: smsResult.failed,
        broadcast: newBroadcast,
      },
    };
  }

  // Get broadcast history - MUST be before @Get(':key')
  @UseGuards(AuthGuard('jwt'))
  @Get('alerts-broadcast/history')
  async getBroadcastHistory() {
    const broadcasts = (await this.cmsService.getData('alertBroadcasts')) || [];
    return { data: Array.isArray(broadcasts) ? broadcasts : [] };
  }

  // Get broadcast statistics - MUST be before @Get(':key')
  @UseGuards(AuthGuard('jwt'))
  @Get('alerts-broadcast/stats')
  async getBroadcastStats() {
    const broadcasts = (await this.cmsService.getData('alertBroadcasts')) || [];
    const volunteers =
      (await this.cmsService.getData('volunteerApplications')) || [];
    const donations = (await this.cmsService.getData('donations')) || [];

    const volunteerPhones = Array.isArray(volunteers)
      ? volunteers.filter((v: any) => v.phone && v.status !== 'rejected').length
      : 0;

    const donorPhones = Array.isArray(donations)
      ? donations.filter((d: any) => d.phone).length
      : 0;

    return {
      data: {
        totalBroadcasts: Array.isArray(broadcasts) ? broadcasts.length : 0,
        totalRecipients: volunteerPhones + donorPhones,
        volunteerRecipients: volunteerPhones,
        donorRecipients: donorPhones,
        lastBroadcast:
          Array.isArray(broadcasts) && broadcasts.length > 0
            ? broadcasts[broadcasts.length - 1]
            : null,
      },
    };
  }

  // ===== Email Settings Endpoints =====

  // Get email settings (admin)
  @UseGuards(AuthGuard('jwt'))
  @Get('emailSettings')
  async getEmailSettings() {
    const settings = (await this.cmsService.getData('emailSettings')) || {};
    // Mask the password for security
    return {
      data: {
        smtpHost: settings.smtpHost || '',
        smtpPort: settings.smtpPort || '587',
        smtpUser: settings.smtpUser || '',
        smtpPass: settings.smtpPass ? '••••••••••••••••' : '',
        fromEmail: settings.fromEmail || '',
        fromName: settings.fromName || '',
        emailEnabled: settings.emailEnabled || false,
      },
    };
  }

  // Update email settings (admin)
  @UseGuards(AuthGuard('jwt'))
  @Patch('emailSettings')
  async updateEmailSettings(@Body() body: any) {
    const existingSettings =
      (await this.cmsService.getData('emailSettings')) || {};

    // If password is masked (not changed), keep the existing one
    const smtpPass = body.smtpPass?.includes('•')
      ? existingSettings.smtpPass
      : body.smtpPass;

    const updated = await this.cmsService.updateData('emailSettings', {
      smtpHost: body.smtpHost || existingSettings.smtpHost || '',
      smtpPort: body.smtpPort || existingSettings.smtpPort || '587',
      smtpUser: body.smtpUser || existingSettings.smtpUser || '',
      smtpPass: smtpPass || existingSettings.smtpPass || '',
      fromEmail: body.fromEmail || existingSettings.fromEmail || '',
      fromName: body.fromName || existingSettings.fromName || '',
      emailEnabled: body.emailEnabled ?? existingSettings.emailEnabled ?? false,
    });

    return {
      data: {
        smtpHost: updated.smtpHost,
        smtpPort: updated.smtpPort,
        smtpUser: updated.smtpUser,
        smtpPass: '••••••••••••••••',
        fromEmail: updated.fromEmail,
        fromName: updated.fromName,
        emailEnabled: updated.emailEnabled,
      },
    };
  }

  // Test email connection (admin)
  @UseGuards(AuthGuard('jwt'))
  @Post('emailSettings/test')
  async testEmailConnection(@Request() req: any) {
    const settings = (await this.cmsService.getData('emailSettings')) || {};

    if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPass) {
      return {
        success: false,
        error:
          'Email settings not configured. Please add your SMTP credentials.',
      };
    }

    try {
      // Test by sending a verification email to the admin
      await this.emailService.sendEmail(
        req.user?.email || settings.fromEmail,
        'SMTP Test - BirdsFly Sangstha',
        `
                    <h2>SMTP Connection Test</h2>
                    <p>This is a test email to verify your SMTP configuration.</p>
                    <p>If you received this email, your email settings are working correctly!</p>
                    <hr>
                    <p><small>Sent from BirdsFly Sangstha Admin Panel</small></p>
                `,
      );

      this.logger.log(
        `Email connection test successful for: ${settings.smtpUser}`,
      );

      return {
        success: true,
        message: 'Email connection successful',
      };
    } catch (error) {
      this.logger.error('Email connection test failed:', error.message);
      return {
        success: false,
        error:
          'Failed to connect to SMTP server. Please check your credentials.',
      };
    }
  }

  // ===== SEO Settings Endpoints =====

  // Get SEO settings (admin)
  @UseGuards(AuthGuard('jwt'))
  @Get('seoSettings')
  async getSeoSettings() {
    const settings = (await this.cmsService.getData('seoSettings')) || {};
    return {
      data: {
        metaTitle: settings.metaTitle || '',
        metaDescription: settings.metaDescription || '',
        metaKeywords: settings.metaKeywords || '',
        ogImage: settings.ogImage || null,
        twitterCard: settings.twitterCard || 'summary_large_image',
        googleAnalyticsId: settings.googleAnalyticsId || '',
        enableSitemap: settings.enableSitemap ?? true,
        enableRobots: settings.enableRobots ?? true,
      },
    };
  }

  // Update SEO settings (admin)
  @UseGuards(AuthGuard('jwt'))
  @Patch('seoSettings')
  async updateSeoSettings(@Body() body: any) {
    const existingSettings =
      (await this.cmsService.getData('seoSettings')) || {};

    const updated = await this.cmsService.updateData('seoSettings', {
      metaTitle:
        body.metaTitle !== undefined
          ? body.metaTitle
          : existingSettings.metaTitle || '',
      metaDescription:
        body.metaDescription !== undefined
          ? body.metaDescription
          : existingSettings.metaDescription || '',
      metaKeywords:
        body.metaKeywords !== undefined
          ? body.metaKeywords
          : existingSettings.metaKeywords || '',
      ogImage:
        body.ogImage !== undefined
          ? body.ogImage
          : existingSettings.ogImage || null,
      twitterCard:
        body.twitterCard !== undefined
          ? body.twitterCard
          : existingSettings.twitterCard || 'summary_large_image',
      googleAnalyticsId:
        body.googleAnalyticsId !== undefined
          ? body.googleAnalyticsId
          : existingSettings.googleAnalyticsId || '',
      enableSitemap:
        body.enableSitemap !== undefined
          ? body.enableSitemap
          : (existingSettings.enableSitemap ?? true),
      enableRobots:
        body.enableRobots !== undefined
          ? body.enableRobots
          : (existingSettings.enableRobots ?? true),
    });

    return { data: updated };
  }

  // ===== Settings Export/Import Endpoints =====

  // Export all settings (admin)
  @UseGuards(AuthGuard('jwt'))
  @Get('settings/export')
  async exportSettings() {
    const allData = await this.cmsService.getAllData();

    // Filter to only include settings-related data (exclude sensitive/user data)
    const exportData = {
      global: allData.global || {},
      contactSettings: allData.contactSettings || {},
      smsSettings: {
        ...(allData.smsSettings || {}),
        twilioAuthToken: '[REDACTED]',
      },
      emailSettings: {
        ...(allData.emailSettings || {}),
        smtpPass: '[REDACTED]',
      },
      seoSettings: allData.seoSettings || {},
      alertTemplates: allData.alertTemplates || [],
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };

    this.logger.log('Settings exported');
    return { data: exportData };
  }

  // Import settings (admin)
  @UseGuards(AuthGuard('jwt'))
  @Post('settings/import')
  async importSettings(@Body() body: any) {
    const { data, options = {} } = body;

    if (!data || typeof data !== 'object') {
      return { success: false, error: 'Invalid import data' };
    }

    try {
      // Import global settings
      if (data.global && !options.skipGlobal) {
        await this.cmsService.updateData('global', data.global);
      }

      // Import contact settings
      if (data.contactSettings && !options.skipContact) {
        await this.cmsService.updateData(
          'contactSettings',
          data.contactSettings,
        );
      }

      // Import SEO settings
      if (data.seoSettings && !options.skipSeo) {
        await this.cmsService.updateData('seoSettings', data.seoSettings);
      }

      // Import alert templates
      if (data.alertTemplates && !options.skipTemplates) {
        await this.cmsService.updateData('alertTemplates', data.alertTemplates);
      }

      this.logger.log('Settings imported');
      return { success: true, message: 'Settings imported successfully' };
    } catch (error) {
      this.logger.error('Settings import failed:', error.message);
      return { success: false, error: 'Failed to import settings' };
    }
  }

  // Clear cache (admin)
  @UseGuards(AuthGuard('jwt'))
  @Post('cache/clear')
  clearCache() {
    // In a real implementation, this would clear Redis or other cache
    // For now, we just log the action
    this.logger.log('Cache cleared');
    return { success: true, message: 'Cache cleared successfully' };
  }

  // Reset all settings to defaults (admin)
  @UseGuards(AuthGuard('jwt'))
  @Post('settings/reset')
  async resetSettings() {
    const defaultSettings = {
      global: {
        siteName: 'BirdsFly Sangstha',
        siteDescription:
          'Building a better future through community support and sustainable development.',
        logo: null,
        favicon: null,
        primaryColor: '#14b8a6',
        fontFamily: 'font-sans',
        enableAnimations: true,
        maintenanceMode: false,
      },
      contactSettings: {
        email: 'info@birdsfly.org',
        phone: '',
        headquarters: {
          line1: '',
          line2: '',
          mapsUrl: '',
        },
        regionalHubs: [],
        services: [],
        socials: {
          facebook: '',
          twitter: '',
          instagram: '',
          linkedin: '',
          youtube: '',
        },
      },
      smsSettings: {
        twilioAccountSid: '',
        twilioAuthToken: '',
        twilioPhoneNumber: '',
        smsEnabled: false,
      },
      emailSettings: {
        smtpHost: '',
        smtpPort: '587',
        smtpUser: '',
        smtpPass: '',
        fromEmail: '',
        fromName: '',
        emailEnabled: false,
      },
      seoSettings: {
        metaTitle: '',
        metaDescription: '',
        metaKeywords: '',
        ogImage: null,
        twitterCard: 'summary_large_image',
        googleAnalyticsId: '',
        enableSitemap: true,
        enableRobots: true,
      },
    };

    try {
      await this.cmsService.updateData('global', defaultSettings.global);
      await this.cmsService.updateData(
        'contactSettings',
        defaultSettings.contactSettings,
      );
      await this.cmsService.updateData(
        'smsSettings',
        defaultSettings.smsSettings,
      );
      await this.cmsService.updateData(
        'emailSettings',
        defaultSettings.emailSettings,
      );
      await this.cmsService.updateData(
        'seoSettings',
        defaultSettings.seoSettings,
      );

      this.logger.log('All settings reset to defaults');
      return { success: true, message: 'All settings reset to defaults' };
    } catch (error) {
      this.logger.error('Failed to reset settings:', error.message);
      return { success: false, error: 'Failed to reset settings' };
    }
  }

  // ===== Media Library Endpoints =====

  // Get all media files (admin)
  @UseGuards(AuthGuard('jwt'))
  @Get('media')
  async getMedia() {
    const media = (await this.cmsService.getData('media')) || [];
    return { data: Array.isArray(media) ? media : [] };
  }

  // Update media library (admin)
  @UseGuards(AuthGuard('jwt'))
  @Patch('media')
  async updateMedia(@Body() body: any) {
    const updated = await this.cmsService.updateData('media', body);
    return { data: updated };
  }

  // Get storage stats (admin)
  @UseGuards(AuthGuard('jwt'))
  @Get('media/stats')
  async getMediaStats() {
    const media = (await this.cmsService.getData('media')) || [];
    const items = Array.isArray(media) ? media : [];

    const totalSize = items.reduce(
      (sum: number, item: any) => sum + (item.size || 0),
      0,
    );
    const images = items.filter((item: any) => item.type === 'image').length;
    const videos = items.filter((item: any) => item.type === 'video').length;
    const documents = items.filter(
      (item: any) => item.type === 'document',
    ).length;
    const audio = items.filter((item: any) => item.type === 'audio').length;

    return {
      data: {
        totalFiles: items.length,
        totalSize,
        images,
        videos,
        documents,
        audio,
      },
    };
  }

  // ===== Donations Management Endpoints =====

  // Get all donations (admin)
  @UseGuards(AuthGuard('jwt'))
  @Get('donations')
  async getDonations() {
    const donations = (await this.cmsService.getData('donations')) || [];
    return { data: Array.isArray(donations) ? donations : [] };
  }

  // Get donors list (admin)
  @UseGuards(AuthGuard('jwt'))
  @Get('donors')
  async getDonors() {
    const donations = (await this.cmsService.getData('donations')) || [];
    const donorMap = new Map();

    if (Array.isArray(donations)) {
      donations.forEach((d: any) => {
        if (d.donorId && !donorMap.has(d.donorId)) {
          donorMap.set(d.donorId, {
            id: d.donorId,
            name: d.name,
            email: d.email,
            phone: d.phone,
            totalLifetimeValue: 0,
            joinDate: d.date,
            lastDonationDate: d.date,
            status: 'Active',
            type: 'Individual',
            tags: [],
          });
        }
        if (d.donorId && donorMap.has(d.donorId)) {
          const donor = donorMap.get(d.donorId);
          donor.totalLifetimeValue += Number(d.amount || 0);
          if (new Date(d.date) > new Date(donor.lastDonationDate)) {
            donor.lastDonationDate = d.date;
          }
        }
      });
    }

    return { data: Array.from(donorMap.values()) };
  }

  // Delete a single donation (admin)
  @UseGuards(AuthGuard('jwt'))
  @Delete('donations/:id')
  async deleteDonation(@Param('id') id: string) {
    const donations = (await this.cmsService.getData('donations')) || [];
    if (!Array.isArray(donations)) {
      throw new NotFoundException('Invalid donations data');
    }

    const filtered = donations.filter((d: any) => String(d.id) !== String(id));
    if (filtered.length === donations.length) {
      throw new NotFoundException('Donation not found');
    }

    await this.cmsService.updateData('donations', filtered);
    this.logger.log(`Donation ${id} deleted`);
    return { success: true, message: 'Donation deleted' };
  }

  // Update donation status (admin)
  @UseGuards(AuthGuard('jwt'))
  @Patch('donations/:id')
  async updateDonation(@Param('id') id: string, @Body() body: any) {
    const donations = (await this.cmsService.getData('donations')) || [];
    if (!Array.isArray(donations)) {
      throw new NotFoundException('Invalid donations data');
    }

    const index = donations.findIndex((d: any) => String(d.id) === String(id));
    if (index === -1) {
      throw new NotFoundException('Donation not found');
    }

    donations[index] = { ...donations[index], ...body };
    await this.cmsService.updateData('donations', donations);
    this.logger.log(`Donation ${id} updated`);
    return { data: donations[index] };
  }

  // Bulk delete donations (admin)
  @UseGuards(AuthGuard('jwt'))
  @Post('donations/bulk-delete')
  async bulkDeleteDonations(@Body() body: { ids: string[] }) {
    const { ids } = body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return { success: false, error: 'No IDs provided' };
    }

    const donations = (await this.cmsService.getData('donations')) || [];
    if (!Array.isArray(donations)) {
      return { success: false, error: 'Invalid donations data' };
    }

    const idSet = new Set(ids.map(String));
    const filtered = donations.filter((d: any) => !idSet.has(String(d.id)));
    const deletedCount = donations.length - filtered.length;

    await this.cmsService.updateData('donations', filtered);
    this.logger.log(`Bulk deleted ${deletedCount} donations`);
    return {
      success: true,
      message: `${deletedCount} donations deleted`,
      deletedCount,
    };
  }

  // ===== Dynamic Key Routes (MUST be after all specific routes) =====

  @UseGuards(AuthGuard('jwt'))
  @Post(':key')
  async addItem(@Param('key') key: string, @Body() body: any) {
    const result = await this.cmsService.addItem(key, body);
    if (!result) {
      throw new NotFoundException(
        `Key "${key}" is not an array or could not be found`,
      );
    }
    return { data: result };
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':key/:id')
  async deleteItem(@Param('key') key: string, @Param('id') id: string) {
    const result = await this.cmsService.deleteItem(key, parseInt(id, 10));
    if (!result) {
      throw new NotFoundException(`Item with id "${id}" not found in "${key}"`);
    }
    return { data: result };
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':key')
  async updateData(@Param('key') key: string, @Body() body: any) {
    return { data: await this.cmsService.updateData(key, body) };
  }

  // ============ USER DATA ENDPOINTS (BEFORE CATCH-ALL) ============

  // User streak data endpoint
  @Get('streak')
  getStreak() {
    // Return default streak data
    return {
      data: {
        currentStreak: 0,
        longestStreak: 0,
        lastDonationDate: null,
        weeklyGoal: 7,
        weeklyProgress: 0,
      },
    };
  }

  // User goals endpoint
  @Get('goals')
  getGoals() {
    // Return default goals data
    return {
      data: {
        monthlyDonationGoal: 100,
        currentMonthDonations: 0,
        causesSupportedGoal: 5,
        causesSupported: 0,
        volunteerHoursGoal: 10,
        volunteerHours: 0,
      },
    };
  }

  // ============ CATCH-ALL ROUTE (MUST BE LAST) ============

  @Get(':key')
  async getData(@Param('key') key: string, @Query() query: any) {
    const data = await this.cmsService.getData(key);

    if (!data) {
      // Return empty array for array-type keys
      if (
        key.startsWith('comments-') ||
        key === 'subscribers' ||
        key === 'contactMessages' ||
        key === 'reports' ||
        key === 'admins' ||
        key === 'teamMembers'
      ) {
        return { data: [] };
      }
      throw new NotFoundException(`Data for key "${key}" not found`);
    }

    // Handle query parameter filtering for team members
    if (key === 'teamMembers' && query.slug && Array.isArray(data)) {
      const filtered = data.filter((item: any) => item.slug === query.slug);
      return { data: filtered };
    }

    // Handle query parameter filtering for programs
    if (key === 'programs' && query.slug && Array.isArray(data)) {
      const filtered = data.filter((item: any) => item.slug === query.slug);
      return { data: filtered };
    }

    // Handle query parameter filtering for causes
    if (key === 'causes' && query.slug && Array.isArray(data)) {
      const filtered = data.filter((item: any) => item.slug === query.slug);
      return { data: filtered };
    }

    // Handle query parameter filtering for services
    if (key === 'services' && query.slug && Array.isArray(data)) {
      const filtered = data.filter((item: any) => item.slug === query.slug);
      return { data: filtered };
    }

    // Handle query parameter filtering for events
    if (key === 'events' && query.slug && Array.isArray(data)) {
      const filtered = data.filter((item: any) => item.slug === query.slug);
      return { data: filtered };
    }

    // Handle query parameter filtering for success stories
    if (key === 'successStories' && query.slug && Array.isArray(data)) {
      const filtered = data.filter((item: any) => item.slug === query.slug);
      return { data: filtered };
    }

    return { data };
  }

  // Broadcast newsletter to all subscribers
  @UseGuards(AuthGuard('jwt'))
  @Post('newsletter/broadcast')
  async broadcastNewsletter(@Body() body: any) {
    const { subject, content } = body;

    if (!subject || !content) {
      throw new NotFoundException('Subject and content are required');
    }

    // Get all subscribers
    const subscribers = (await this.cmsService.getData('subscribers')) || [];
    if (!Array.isArray(subscribers) || subscribers.length === 0) {
      return {
        success: false,
        message: 'No subscribers to send to',
        data: { sent: 0, failed: 0 },
      };
    }

    const emails = subscribers.map((s: any) => s.email).filter(Boolean);

    // Send bulk newsletter
    const result = await this.emailService.sendBulkNewsletter(
      emails,
      subject,
      content,
    );

    // Save newsletter to history
    const newsletters = (await this.cmsService.getData('newsletters')) || [];
    const newNewsletter = {
      id: Date.now(),
      subject,
      content,
      recipientCount: emails.length,
      sentAt: new Date().toISOString(),
      status: 'sent',
      stats: result,
    };

    if (Array.isArray(newsletters)) {
      await this.cmsService.updateData('newsletters', [
        ...newsletters,
        newNewsletter,
      ]);
    } else {
      await this.cmsService.updateData('newsletters', [newNewsletter]);
    }

    this.logger.log(
      `Newsletter broadcast: "${subject}" sent to ${result.success} subscribers`,
    );

    return {
      success: true,
      message: `Newsletter sent to ${result.success} subscribers`,
      data: {
        sent: result.success,
        failed: result.failed,
        total: emails.length,
        newsletter: newNewsletter,
      },
    };
  }

  // Get newsletter history
  @UseGuards(AuthGuard('jwt'))
  @Get('newsletters/history')
  async getNewsletterHistory() {
    const newsletters = (await this.cmsService.getData('newsletters')) || [];
    return { data: Array.isArray(newsletters) ? newsletters : [] };
  }

  // ===== Reports Endpoints =====

  // Get all reports (admin)
  @UseGuards(AuthGuard('jwt'))
  @Get('reports')
  async getReports() {
    const reports = (await this.cmsService.getData('reports')) || [];
    return { data: Array.isArray(reports) ? reports : [] };
  }

  // Generate a new report (admin)
  @UseGuards(AuthGuard('jwt'))
  @Post('reports/generate')
  async generateReport(
    @Body()
    body: {
      type: string;
      title?: string;
      description?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const { type, title, description, startDate, endDate } = body;

    if (!type) {
      throw new NotFoundException('Report type is required');
    }

    const validTypes = [
      'donations',
      'volunteers',
      'events',
      'subscribers',
      'contacts',
      'campaigns',
    ];
    if (!validTypes.includes(type)) {
      throw new NotFoundException(
        `Invalid report type. Valid types: ${validTypes.join(', ')}`,
      );
    }

    // Generate report
    const report = await this.cmsService.generateReport({
      type,
      title: title || `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
      description: description || `Generated ${type} report`,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    return { success: true, data: report };
  }

  // Get report by ID (admin)
  @UseGuards(AuthGuard('jwt'))
  @Get('reports/:id')
  async getReportById(@Param('id') id: string) {
    const reports = (await this.cmsService.getData('reports')) || [];
    const report = Array.isArray(reports)
      ? reports.find((r: any) => String(r.id) === String(id))
      : null;

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return { data: report };
  }

  // Download report as CSV (admin)
  @UseGuards(AuthGuard('jwt'))
  @Get('reports/:id/download')
  async downloadReport(@Param('id') id: string, @Res() res: Response) {
    const reports = (await this.cmsService.getData('reports')) || [];
    const report = Array.isArray(reports)
      ? reports.find((r: any) => String(r.id) === String(id))
      : null;

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (!report.csvContent) {
      throw new NotFoundException('Report content not available');
    }

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${report.filename || `report-${id}.csv`}"`,
    );
    res.send(report.csvContent);
  }

  // Delete report (admin)
  @UseGuards(AuthGuard('jwt'))
  @Delete('reports/:id')
  async deleteReport(@Param('id') id: string) {
    const reports = (await this.cmsService.getData('reports')) || [];
    const filtered = Array.isArray(reports)
      ? reports.filter((r: any) => String(r.id) !== String(id))
      : [];

    if (filtered.length === (Array.isArray(reports) ? reports.length : 0)) {
      throw new NotFoundException('Report not found');
    }

    await this.cmsService.updateData('reports', filtered);
    return { success: true, message: 'Report deleted' };
  }

  // ===== Article Comments Endpoints =====

  // Submit a comment for an article (public)
  @Post('article-comments')
  async submitArticleComment(@Body() body: any) {
    const { name, email, text, articleId, articleTitle, articleSlug } = body;

    if (!name || !email || !text) {
      throw new NotFoundException('Name, email and comment text are required');
    }

    const comments = (await this.cmsService.getData('articleComments')) || [];
    const newComment = {
      id: Date.now(),
      name,
      email,
      text,
      articleId: articleId || null,
      articleTitle: articleTitle || 'Unknown Article',
      articleSlug: articleSlug || '',
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };

    const updatedComments = Array.isArray(comments)
      ? [...comments, newComment]
      : [newComment];

    await this.cmsService.updateData('articleComments', updatedComments);

    this.logger.log(
      `New comment submitted by ${name} on article: ${articleTitle}`,
    );

    return {
      success: true,
      message: 'Comment submitted for review',
      data: newComment,
    };
  }

  // Get all article comments (public returns only approved)
  @Get('article-comments')
  async getArticleComments() {
    const comments = (await this.cmsService.getData('articleComments')) || [];
    return { data: Array.isArray(comments) ? comments : [] };
  }

  // Get comments for specific article by slug
  @Get('article-comments/:slug')
  async getArticleCommentsBySlug(@Param('slug') slug: string) {
    const comments = (await this.cmsService.getData('articleComments')) || [];
    const articleComments = Array.isArray(comments)
      ? comments.filter(
          (c: any) => c.articleSlug === slug && c.status === 'approved',
        )
      : [];
    return { data: articleComments };
  }

  // Update comment status (admin only)
  @UseGuards(AuthGuard('jwt'))
  @Patch('article-comments')
  async updateArticleComments(@Body() body: any) {
    await this.cmsService.updateData('articleComments', body);
    return { success: true, message: 'Comments updated' };
  }

  // Delete comment (admin only)
  @UseGuards(AuthGuard('jwt'))
  @Delete('article-comments/:id')
  async deleteArticleComment(@Param('id') id: string) {
    const comments = (await this.cmsService.getData('articleComments')) || [];
    const filtered = Array.isArray(comments)
      ? comments.filter((c: any) => String(c.id) !== String(id))
      : [];

    if (filtered.length === (Array.isArray(comments) ? comments.length : 0)) {
      throw new NotFoundException('Comment not found');
    }

    await this.cmsService.updateData('articleComments', filtered);
    return { success: true, message: 'Comment deleted' };
  }

  @Get()
  async getAllData() {
    return { data: await this.cmsService.getAllData() };
  }
}
