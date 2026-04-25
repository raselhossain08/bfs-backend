import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CmsService } from '../cms/cms.service';

interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
  to?: string;
}

interface BulkSmsResult {
  total: number;
  success: number;
  failed: number;
  results: SmsResult[];
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    private configService: ConfigService,
    @Inject(forwardRef(() => CmsService))
    private cmsService: CmsService,
  ) {}

  /**
   * Get SMS credentials from database or environment
   */
  private async getCredentials(): Promise<{
    accountSid: string | null;
    authToken: string | null;
    phoneNumber: string | null;
    enabled: boolean;
  }> {
    try {
      // First, try to get from database settings
      const settings = (await this.cmsService.getData('smsSettings')) || {};

      if (
        settings.twilioAccountSid &&
        settings.twilioAuthToken &&
        settings.smsEnabled
      ) {
        return {
          accountSid: settings.twilioAccountSid,
          authToken: settings.twilioAuthToken,
          phoneNumber: settings.twilioPhoneNumber,
          enabled: true,
        };
      }
    } catch (error) {
      this.logger.warn(
        'Could not fetch SMS settings from database, using environment variables',
      );
    }

    // Fallback to environment variables
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const phoneNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');

    return {
      accountSid: accountSid || null,
      authToken: authToken || null,
      phoneNumber: phoneNumber || null,
      enabled: !!(accountSid && authToken),
    };
  }

  /**
   * Check if SMS service is properly configured
   */
  async isReady(): Promise<boolean> {
    const creds = await this.getCredentials();
    return creds.enabled && !!creds.accountSid && !!creds.authToken;
  }

  /**
   * Send SMS to a single recipient
   */
  async sendSms(to: string, message: string): Promise<SmsResult> {
    // Validate phone number format
    const formattedPhone = this.formatPhoneNumber(to);
    if (!formattedPhone) {
      return {
        success: false,
        error: 'Invalid phone number format',
        to,
      };
    }

    const credentials = await this.getCredentials();

    if (
      !credentials.enabled ||
      !credentials.accountSid ||
      !credentials.authToken
    ) {
      // Development mode: log the SMS instead of sending
      this.logger.log(
        `[DEV MODE] SMS would be sent to ${formattedPhone}: ${message.substring(0, 50)}...`,
      );
      return {
        success: true,
        messageId: `dev-${Date.now()}`,
        to: formattedPhone,
      };
    }

    try {
      // Dynamic import to avoid errors when Twilio is not installed
      const twilio = require('twilio');
      const client = twilio(credentials.accountSid, credentials.authToken);

      const result = await client.messages.create({
        body: message,
        from: credentials.phoneNumber,
        to: formattedPhone,
      });

      this.logger.log(
        `SMS sent successfully to ${formattedPhone}: ${result.sid}`,
      );

      return {
        success: true,
        messageId: result.sid,
        to: formattedPhone,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send SMS to ${formattedPhone}:`,
        error.message,
      );
      return {
        success: false,
        error: error.message,
        to: formattedPhone,
      };
    }
  }

  /**
   * Send SMS to multiple recipients
   */
  async sendBulkSms(
    recipients: string[],
    message: string,
  ): Promise<BulkSmsResult> {
    const results: SmsResult[] = [];
    let successCount = 0;
    let failedCount = 0;

    // Process in batches of 10 to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map((phone) => this.sendSms(phone, message)),
      );

      for (const result of batchResults) {
        results.push(result);
        if (result.success) {
          successCount++;
        } else {
          failedCount++;
        }
      }

      // Small delay between batches
      if (i + batchSize < recipients.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    this.logger.log(
      `Bulk SMS complete: ${successCount} sent, ${failedCount} failed`,
    );

    return {
      total: recipients.length,
      success: successCount,
      failed: failedCount,
      results,
    };
  }

  /**
   * Format phone number to E.164 format
   */
  private formatPhoneNumber(phone: string): string | null {
    if (!phone) return null;

    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');

    // Handle Bangladesh numbers (default)
    if (cleaned.length === 11 && cleaned.startsWith('01')) {
      return `+880${cleaned.substring(1)}`;
    }

    // Already has country code
    if (cleaned.length > 11) {
      // If starts with 880, add +
      if (cleaned.startsWith('880')) {
        return `+${cleaned}`;
      }
      // Assume it needs + prefix
      return `+${cleaned}`;
    }

    // Invalid length
    if (cleaned.length < 10) {
      return null;
    }

    // Default: assume Bangladesh number without country code
    return `+880${cleaned}`;
  }
}
