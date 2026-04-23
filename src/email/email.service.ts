import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailTemplates } from './email.templates';

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter;
    private readonly logger = new Logger(EmailService.name);
    private readonly emailFrom: string;

    constructor(private configService: ConfigService) {
        this.emailFrom = this.configService.get<string>('EMAIL_FROM') || 'info@birdsfly.org';

        this.transporter = nodemailer.createTransport({
            host: this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com',
            port: this.configService.get<number>('SMTP_PORT') || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: this.configService.get<string>('SMTP_USER') || 'info@birdsfly.org',
                pass: this.configService.get<string>('SMTP_PASS') || 'ypoqrniaecqtnany',
            },
            tls: {
                rejectUnauthorized: true,
            },
        });

        this.verifyConnection();
    }

    private async verifyConnection() {
        try {
            await this.transporter.verify();
            this.logger.log('SMTP connection verified successfully');
        } catch (error) {
            this.logger.error('SMTP connection failed:', error.message);
        }
    }

    async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
        try {
            const mailOptions: nodemailer.SendMailOptions = {
                from: `"BFS Foundation" <${this.emailFrom}>`,
                to,
                subject,
                html,
            };

            const info = await this.transporter.sendMail(mailOptions);
            this.logger.log(`Email sent successfully to ${to}: ${info.messageId}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send email to ${to}:`, error.message);
            return false;
        }
    }

    async sendPasswordResetEmail(to: string, name: string, resetLink: string): Promise<boolean> {
        const html = EmailTemplates.getPasswordResetHTML({ name, resetLink });
        const subject = EmailTemplates.getPasswordResetSubject();
        return this.sendEmail(to, subject, html);
    }

    async sendContactNotification(
        to: string,
        data: { name: string; email: string; service: string; message: string }
    ): Promise<boolean> {
        const html = EmailTemplates.getContactNotificationHTML(data);
        const subject = EmailTemplates.getContactNotificationSubject(data.name);
        return this.sendEmail(to, subject, html);
    }

    async sendContactAutoReply(to: string, name: string): Promise<boolean> {
        const html = EmailTemplates.getContactAutoReplyHTML({ name });
        const subject = EmailTemplates.getContactAutoReplySubject();
        return this.sendEmail(to, subject, html);
    }

    async sendNewsletterWelcome(to: string): Promise<boolean> {
        const html = EmailTemplates.getNewsletterWelcomeHTML({ email: to });
        const subject = EmailTemplates.getNewsletterWelcomeSubject();
        return this.sendEmail(to, subject, html);
    }

    async sendNewsletterBroadcast(
        to: string,
        subject: string,
        content: string,
    ): Promise<boolean> {
        // Generate unsubscribe link with encoded email
        const unsubscribeToken = Buffer.from(to).toString('base64');
        const baseUrl = this.configService.get<string>('FRONTEND_URL') || 'https://birdsfly.org';
        const unsubscribeLink = `${baseUrl}/unsubscribe/${unsubscribeToken}`;

        const html = EmailTemplates.getNewsletterBroadcastHTML({
            subject,
            content,
            unsubscribeLink,
        });
        const emailSubject = EmailTemplates.getNewsletterBroadcastSubject(subject);
        return this.sendEmail(to, emailSubject, html);
    }

    async sendBulkNewsletter(
        recipients: string[],
        subject: string,
        content: string,
    ): Promise<{ success: number; failed: number }> {
        const results = await Promise.allSettled(
            recipients.map((email) => this.sendNewsletterBroadcast(email, subject, content)),
        );

        const success = results.filter((r) => r.status === 'fulfilled' && r.value === true).length;
        const failed = results.length - success;

        this.logger.log(`Newsletter broadcast complete: ${success} sent, ${failed} failed`);
        return { success, failed };
    }

    async sendVolunteerApplicationConfirmation(
        to: string,
        data: { name: string; email: string; phone: string; interest: string; location: string; causeTitle: string; message?: string }
    ): Promise<boolean> {
        const html = EmailTemplates.getVolunteerApplicationConfirmationHTML(data);
        const subject = EmailTemplates.getVolunteerApplicationConfirmationSubject(data.causeTitle);
        return this.sendEmail(to, subject, html);
    }

    async sendVolunteerApplicationAdminNotification(
        data: { name: string; email: string; phone: string; interest: string; location: string; causeTitle: string; message?: string; submittedAt: string }
    ): Promise<boolean> {
        const html = EmailTemplates.getVolunteerApplicationAdminNotificationHTML(data);
        const subject = EmailTemplates.getVolunteerApplicationAdminSubject(data.causeTitle);
        // Send to admin email from config
        const adminEmail = this.configService.get<string>('EMAIL_FROM') || 'info@birdsfly.org';
        return this.sendEmail(adminEmail, subject, html);
    }

    async sendVolunteerApprovalEmail(
        to: string,
        data: { name: string; causeTitle: string }
    ): Promise<boolean> {
        const html = EmailTemplates.getVolunteerApprovalHTML(data);
        const subject = EmailTemplates.getVolunteerApprovalSubject();
        return this.sendEmail(to, subject, html);
    }

    async sendVolunteerRejectionEmail(
        to: string,
        data: { name: string; notes?: string }
    ): Promise<boolean> {
        const html = EmailTemplates.getVolunteerRejectionHTML(data);
        const subject = EmailTemplates.getVolunteerRejectionSubject();
        return this.sendEmail(to, subject, html);
    }

    async sendOTPLoginEmail(to: string, name: string, otp: string): Promise<boolean> {
        const html = EmailTemplates.getOTPLoginHTML({
            name,
            otp,
            expiryMinutes: 10,
        });
        const subject = EmailTemplates.getOTPLoginSubject();
        return this.sendEmail(to, subject, html);
    }

    async sendDonorCredentialsEmail(
        to: string,
        data: { name: string; email: string; password: string; donationAmount: string; causeName: string }
    ): Promise<boolean> {
        const baseUrl = this.configService.get<string>('FRONTEND_URL') || 'https://birdsfly.org';
        const loginUrl = `${baseUrl}/login`;

        const html = EmailTemplates.getDonorCredentialsHTML({
            name: data.name,
            email: data.email,
            password: data.password,
            loginUrl,
            donationAmount: data.donationAmount,
            causeName: data.causeName,
        });
        const subject = EmailTemplates.getDonorCredentialsSubject();
        return this.sendEmail(to, subject, html);
    }

    async sendReferralInvite(
        to: string,
        referrerName: string,
        referralCode: string,
        customMessage?: string,
    ): Promise<boolean> {
        const baseUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
        const referralLink = `${baseUrl}/auth/register?ref=${referralCode}`;

        const html = EmailTemplates.getReferralInviteHTML({
            referrerName,
            referralLink,
            customMessage,
        });
        const subject = `${referrerName} invites you to join BFS Foundation`;
        return this.sendEmail(to, subject, html);
    }
}