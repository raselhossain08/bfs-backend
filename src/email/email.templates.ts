export interface PasswordResetEmailData {
  name: string;
  resetLink: string;
}

export interface ContactNotificationData {
  name: string;
  email: string;
  service: string;
  message: string;
}

export interface ContactAutoReplyData {
  name: string;
}

export interface NewsletterWelcomeData {
  email: string;
}

export interface NewsletterBroadcastData {
  subject: string;
  content: string;
  unsubscribeLink?: string;
}

export interface DonorCredentialsData {
  name: string;
  email: string;
  password: string;
  loginUrl: string;
  donationAmount: string;
  causeName: string;
}

export interface OTPLoginData {
  name: string;
  otp: string;
  expiryMinutes: number;
}

export interface VolunteerApplicationData {
  name: string;
  email: string;
  phone: string;
  interest: string;
  location: string;
  causeTitle: string;
  message?: string;
}

export interface VolunteerApplicationAdminData {
  name: string;
  email: string;
  phone: string;
  interest: string;
  location: string;
  causeTitle: string;
  message?: string;
  submittedAt: string;
}

export interface DonationReceiptData {
  donorName: string;
  donationAmount: string;
  causeName: string;
  transactionId: string;
  donationDate: string;
  paymentMethod: string;
}

export class EmailTemplates {
  static getPasswordResetHTML(data: PasswordResetEmailData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset - Birdsfly Sangstha</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
    <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="background-color: #f4f4f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" cellspacing="0" cellpadding="0" width="600" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 40px 40px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Birdsfly Sangstha</h1>
                            <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Password Reset Request</p>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 40px;">
                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">Hello ${data.name || 'there'},</p>
                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">We received a request to reset your password for your Birdsfly Sangstha account. Click the button below to create a new password:</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${data.resetLink}" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px;">Reset Password</a>
                            </div>
                            <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">This link will expire in <strong>1 hour</strong> for security reasons. If you did not request a password reset, you can safely ignore this email.</p>
                            <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">If the button above doesn't work, copy and paste this link into your browser:</p>
                            <p style="margin: 10px 0 0 0; color: #0d9488; font-size: 13px; word-break: break-all;">${data.resetLink}</p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; text-align: center;">Need help? Contact us at <a href="mailto:info@birdsfly.org" style="color: #0d9488; text-decoration: none;">info@birdsfly.org</a></p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Birdsfly Sangstha. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
  }

  static getPasswordResetSubject(): string {
    return 'Reset Your Password - Birdsfly Sangstha';
  }

  static getContactNotificationHTML(data: ContactNotificationData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Contact Message - Birdsfly Sangstha</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
    <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="background-color: #f4f4f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" cellspacing="0" cellpadding="0" width="600" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 30px 40px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">New Contact Message</h1>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 40px;">
                            <p style="margin: 0 0 30px 0; color: #374151; font-size: 16px; line-height: 1.6;">A new contact message has been received from your website:</p>

                            <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 12px 0;">
                                        <p style="margin: 0; color: #6b7280; font-size: 13px;">Name</p>
                                        <p style="margin: 5px 0 0 0; color: #111827; font-size: 16px; font-weight: 600;">${data.name}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0; border-top: 1px solid #e5e7eb;">
                                        <p style="margin: 0; color: #6b7280; font-size: 13px;">Email</p>
                                        <p style="margin: 5px 0 0 0; color: #111827; font-size: 16px; font-weight: 600;"><a href="mailto:${data.email}" style="color: #0d9488; text-decoration: none;">${data.email}</a></p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0; border-top: 1px solid #e5e7eb;">
                                        <p style="margin: 0; color: #6b7280; font-size: 13px;">Service Category</p>
                                        <p style="margin: 5px 0 0 0; color: #111827; font-size: 16px; font-weight: 600;">${data.service}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0; border-top: 1px solid #e5e7eb;">
                                        <p style="margin: 0; color: #6b7280; font-size: 13px;">Message</p>
                                        <p style="margin: 10px 0 0 0; color: #111827; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${data.message}</p>
                                    </td>
                                </tr>
                            </table>

                            <div style="text-align: center; margin: 30px 0;">
                                <a href="mailto:${data.email}" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 10px; font-weight: 600; font-size: 15px;">Reply to ${data.name}</a>
                            </div>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 20px 40px; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">Received on ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
  }

  static getContactNotificationSubject(name: string): string {
    return `New Contact Message from ${name} - Birdsfly Sangstha`;
  }

  static getContactAutoReplyHTML(data: ContactAutoReplyData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Message Received - Birdsfly Sangstha</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
    <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="background-color: #f4f4f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" cellspacing="0" cellpadding="0" width="600" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 40px 40px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Birdsfly Sangstha</h1>
                            <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Thank You for Contacting Us</p>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 40px;">
                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">Dear ${data.name},</p>
                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">Thank you for reaching out to Birdsfly Sangstha. We have received your message and appreciate you taking the time to contact us.</p>
                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">Our team will review your message and get back to you within <strong>24-48 hours</strong>. If your inquiry is urgent, please call us directly at <strong>+880 1410-565758</strong>.</p>

                            <div style="background-color: #f0fdfa; border-left: 4px solid #0d9488; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
                                <p style="margin: 0 0 10px 0; color: #0f766e; font-size: 14px; font-weight: 600;">Contact Information</p>
                                <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.8;">
                                    📧 Email: info@birdsfly.org<br>
                                    📞 Phone: +880 1410-565758<br>
                                    📍 Address: Bashundhara Tower 3rd Floor, Satkhira 9400, Bangladesh
                                </p>
                            </div>

                            <p style="margin: 20px 0 0 0; color: #374151; font-size: 16px; line-height: 1.6;">We look forward to assisting you!</p>
                            <p style="margin: 20px 0 0 0; color: #374151; font-size: 16px; line-height: 1.6;">Warm regards,<br><strong>Birdsfly Sangstha Team</strong></p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; text-align: center;">Follow us on social media for updates on our programs and impact stories.</p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Birdsfly Sangstha. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
  }

  static getContactAutoReplySubject(): string {
    return 'We Received Your Message - Birdsfly Sangstha';
  }

  static getNewsletterWelcomeHTML(data: NewsletterWelcomeData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Our Newsletter - Birdsfly Sangstha</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
    <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="background-color: #f4f4f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" cellspacing="0" cellpadding="0" width="600" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 40px 40px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Birdsfly Sangstha</h1>
                            <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Welcome to Our Newsletter!</p>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 40px;">
                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">Dear Subscriber,</p>
                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">Thank you for subscribing to the Birdsfly Sangstha newsletter! We're thrilled to have you as part of our community.</p>
                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">As a subscriber, you'll receive:</p>
                            <ul style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.8; padding-left: 20px;">
                                <li>Monthly updates on our programs and initiatives</li>
                                <li>Impact stories from the communities we serve</li>
                                <li>Exclusive invitations to events and volunteer opportunities</li>
                                <li>Ways you can make a difference</li>
                            </ul>

                            <div style="text-align: center; margin: 30px 0;">
                                <a href="https://birdsfly.org" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 10px; font-weight: 600; font-size: 15px;">Visit Our Website</a>
                            </div>

                            <p style="margin: 20px 0 0 0; color: #374151; font-size: 16px; line-height: 1.6;">Together, we can create lasting change!</p>
                            <p style="margin: 20px 0 0 0; color: #374151; font-size: 16px; line-height: 1.6;">Warm regards,<br><strong>Birdsfly Sangstha Team</strong></p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; text-align: center;">You're receiving this email because you subscribed to our newsletter.</p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Birdsfly Sangstha. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
  }

  static getNewsletterWelcomeSubject(): string {
    return 'Welcome to Birdsfly Sangstha Newsletter!';
  }

  static getNewsletterBroadcastHTML(data: NewsletterBroadcastData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.subject} - Birdsfly Sangstha</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
    <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="background-color: #f4f4f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" cellspacing="0" cellpadding="0" width="600" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 30px 40px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Birdsfly Sangstha</h1>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 40px;">
                            ${data.content}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; text-align: center;">
                                You're receiving this email because you subscribed to our newsletter.
                            </p>
                            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px; text-align: center;">
                                <a href="${data.unsubscribeLink || 'https://birdsfly.org/unsubscribe'}" style="color: #0d9488; text-decoration: none;">Unsubscribe</a> |
                                <a href="https://birdsfly.org" style="color: #0d9488; text-decoration: none;">Visit Website</a>
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Birdsfly Sangstha. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
  }

  static getNewsletterBroadcastSubject(subject: string): string {
    return `${subject} - Birdsfly Sangstha Newsletter`;
  }

  static getVolunteerApplicationConfirmationHTML(
    data: VolunteerApplicationData,
  ): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Volunteer Application Received - Birdsfly Sangstha</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
    <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="background-color: #f4f4f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" cellspacing="0" cellpadding="0" width="600" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 40px 40px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Birdsfly Sangstha</h1>
                            <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Volunteer Application Received</p>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 40px;">
                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">Dear ${data.name},</p>
                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">Thank you for your interest in volunteering with Birdsfly Sangstha! We've received your application for:</p>

                            <div style="background-color: #f0fdfa; border-radius: 12px; padding: 20px; margin: 30px 0; border-left: 4px solid #0d9488;">
                                <p style="margin: 0 0 10px 0; color: #0f766e; font-size: 16px; font-weight: 600;">${data.causeTitle}</p>
                                <p style="margin: 0; color: #6b7280; font-size: 14px;">Interest Area: ${data.interest}</p>
                            </div>

                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">Our volunteer coordination team will review your application and get back to you within <strong>3-5 business days</strong>.</p>

                            <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin: 30px 0;">
                                <p style="margin: 0 0 10px 0; color: #374151; font-size: 14px; font-weight: 600;">Your Application Details:</p>
                                <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">📍 Location: ${data.location}</p>
                                <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">📧 Email: ${data.email}</p>
                                <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">📞 Phone: ${data.phone}</p>
                            </div>

                            <p style="margin: 20px 0 0 0; color: #374151; font-size: 16px; line-height: 1.6;">If you have any questions, please don't hesitate to contact us at <a href="mailto:info@birdsfly.org" style="color: #0d9488; text-decoration: none;">info@birdsfly.org</a></p>

                            <p style="margin: 20px 0 0 0; color: #374151; font-size: 16px; line-height: 1.6;">Warm regards,<br><strong>Birdsfly Sangstha Volunteer Team</strong></p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; text-align: center;">Follow us on social media for updates on our programs and volunteer opportunities.</p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Birdsfly Sangstha. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
  }

  static getVolunteerApplicationConfirmationSubject(
    causeTitle: string,
  ): string {
    return `Volunteer Application Received - ${causeTitle}`;
  }

  static getVolunteerApplicationAdminNotificationHTML(
    data: VolunteerApplicationAdminData,
  ): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Volunteer Application - Birdsfly Sangstha</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
    <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="background-color: #f4f4f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" cellspacing="0" cellpadding="0" width="600" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px 40px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">New Volunteer Application</h1>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 40px;">
                            <p style="margin: 0 0 30px 0; color: #374151; font-size: 16px; line-height: 1.6;">A new volunteer application has been submitted for review:</p>

                            <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 12px 0;">
                                        <p style="margin: 0; color: #6b7280; font-size: 13px;">Applicant Name</p>
                                        <p style="margin: 5px 0 0 0; color: #111827; font-size: 16px; font-weight: 600;">${data.name}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0; border-top: 1px solid #e5e7eb;">
                                        <p style="margin: 0; color: #6b7280; font-size: 13px;">Email</p>
                                        <p style="margin: 5px 0 0 0; color: #111827; font-size: 16px; font-weight: 600;"><a href="mailto:${data.email}" style="color: #0d9488; text-decoration: none;">${data.email}</a></p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0; border-top: 1px solid #e5e7eb;">
                                        <p style="margin: 0; color: #6b7280; font-size: 13px;">Phone</p>
                                        <p style="margin: 5px 0 0 0; color: #111827; font-size: 16px; font-weight: 600;">${data.phone}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0; border-top: 1px solid #e5e7eb;">
                                        <p style="margin: 0; color: #6b7280; font-size: 13px;">Location</p>
                                        <p style="margin: 5px 0 0 0; color: #111827; font-size: 16px; font-weight: 600;">${data.location}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0; border-top: 1px solid #e5e7eb;">
                                        <p style="margin: 0; color: #6b7280; font-size: 13px;">Cause / Program</p>
                                        <p style="margin: 5px 0 0 0; color: #111827; font-size: 16px; font-weight: 600;">${data.causeTitle}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0; border-top: 1px solid #e5e7eb;">
                                        <p style="margin: 0; color: #6b7280; font-size: 13px;">Interest Area</p>
                                        <p style="margin: 5px 0 0 0; color: #111827; font-size: 16px; font-weight: 600;">${data.interest}</p>
                                    </td>
                                </tr>
                                ${
                                  data.message
                                    ? `
                                <tr>
                                    <td style="padding: 12px 0; border-top: 1px solid #e5e7eb;">
                                        <p style="margin: 0; color: #6b7280; font-size: 13px;">Message</p>
                                        <p style="margin: 10px 0 0 0; color: #111827; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${data.message}</p>
                                    </td>
                                </tr>
                                `
                                    : ''
                                }
                            </table>

                            <div style="text-align: center; margin: 30px 0;">
                                <a href="https://birdsfly.org/admin/dashboard/volunteers" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 10px; font-weight: 600; font-size: 15px;">Review Application</a>
                            </div>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 20px 40px; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">Submitted on ${new Date(data.submittedAt).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
  }

  static getVolunteerApplicationAdminSubject(causeTitle: string): string {
    return `New Volunteer Application: ${causeTitle} - Birdsfly Sangstha`;
  }

  // Pre-designed newsletter templates
  static getNewsletterTemplates() {
    return [
      {
        id: 'welcome',
        name: 'Welcome Newsletter',
        description:
          'Welcome new subscribers with an introduction to Birdsfly Sangstha',
        subject: 'Welcome to Birdsfly Sangstha!',
        content: `<h2 style="margin: 0 0 20px 0; color: #0d9488; font-size: 24px; font-weight: 700;">Welcome to Our Community!</h2>
<p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">Thank you for joining the Birdsfly Sangstha newsletter. We're excited to have you as part of our journey to create positive change.</p>
<p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">Here's what you can expect from us:</p>
<ul style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.8; padding-left: 20px;">
    <li>Monthly program updates</li>
    <li>Impact stories from the field</li>
    <li>Event invitations</li>
    <li>Volunteer opportunities</li>
</ul>
<div style="text-align: center; margin: 30px 0;">
    <a href="https://birdsfly.org" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 10px; font-weight: 600; font-size: 15px;">Explore Our Programs</a>
</div>`,
      },
      {
        id: 'event',
        name: 'Event Announcement',
        description: 'Announce upcoming events, workshops, or fundraisers',
        subject: 'Upcoming Event: [Event Name]',
        content: `<h2 style="margin: 0 0 20px 0; color: #0d9488; font-size: 24px; font-weight: 700;">🗓️ Upcoming Event</h2>
<p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">We're excited to invite you to our upcoming event!</p>
<div style="background-color: #f0fdfa; border-radius: 12px; padding: 20px; margin: 20px 0;">
    <p style="margin: 0 0 10px 0; color: #0f766e; font-size: 14px; font-weight: 600;">Event Details</p>
    <p style="margin: 0 0 5px 0; color: #374151; font-size: 15px;"><strong>Date:</strong> [Event Date]</p>
    <p style="margin: 0 0 5px 0; color: #374151; font-size: 15px;"><strong>Time:</strong> [Event Time]</p>
    <p style="margin: 0 0 5px 0; color: #374151; font-size: 15px;"><strong>Location:</strong> [Event Location]</p>
</div>
<p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">[Event description goes here]</p>
<div style="text-align: center; margin: 30px 0;">
    <a href="#" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 10px; font-weight: 600; font-size: 15px;">Register Now</a>
</div>`,
      },
      {
        id: 'impact',
        name: 'Impact Update',
        description: 'Share success stories and impact metrics',
        subject: 'Our Impact This Month',
        content: `<h2 style="margin: 0 0 20px 0; color: #0d9488; font-size: 24px; font-weight: 700;">✨ Impact Update</h2>
<p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">Thanks to your support, we've achieved incredible milestones this month!</p>
<div style="display: flex; justify-content: space-around; margin: 30px 0; text-align: center;">
    <div>
        <p style="margin: 0; color: #0d9488; font-size: 32px; font-weight: 700;">[Number]</p>
        <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Lives Impacted</p>
    </div>
    <div>
        <p style="margin: 0; color: #0d9488; font-size: 32px; font-weight: 700;">[Number]</p>
        <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Projects Completed</p>
    </div>
    <div>
        <p style="margin: 0; color: #0d9488; font-size: 32px; font-weight: 700;">[Number]</p>
        <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Volunteers</p>
    </div>
</div>
<p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">[Impact story details]</p>
<div style="text-align: center; margin: 30px 0;">
    <a href="#" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 10px; font-weight: 600; font-size: 15px;">Read Full Story</a>
</div>`,
      },
      {
        id: 'donation',
        name: 'Donation Appeal',
        description: 'Request donations for specific causes or campaigns',
        subject: 'Help Us Make a Difference',
        content: `<h2 style="margin: 0 0 20px 0; color: #0d9488; font-size: 24px; font-weight: 700;">💙 Your Support Matters</h2>
<p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">With your generous contribution, we can continue our mission to empower communities.</p>
<div style="background-color: #fef3c7; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
    <p style="margin: 0 0 10px 0; color: #92400e; font-size: 14px; font-weight: 600;">Campaign Goal</p>
    <p style="margin: 0; color: #92400e; font-size: 28px; font-weight: 700;">[Goal Amount]</p>
    <p style="margin: 10px 0 0 0; color: #92400e; font-size: 14px;">Raised so far: [Current Amount]</p>
</div>
<p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">[Campaign description and beneficiary story]</p>
<div style="text-align: center; margin: 30px 0;">
    <a href="#" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 10px; font-weight: 600; font-size: 15px;">Donate Now</a>
</div>`,
      },
      {
        id: 'volunteer',
        name: 'Volunteer Call',
        description: 'Recruit volunteers for programs and activities',
        subject: 'Volunteer Opportunity: [Program Name]',
        content: `<h2 style="margin: 0 0 20px 0; color: #0d9488; font-size: 24px; font-weight: 700;">🤝 Volunteer With Us</h2>
<p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">We're looking for passionate volunteers to join our mission!</p>
<div style="background-color: #f0fdfa; border-radius: 12px; padding: 20px; margin: 20px 0;">
    <p style="margin: 0 0 10px 0; color: #0f766e; font-size: 14px; font-weight: 600;">Volunteer Details</p>
    <p style="margin: 0 0 5px 0; color: #374151; font-size: 15px;"><strong>Program:</strong> [Program Name]</p>
    <p style="margin: 0 0 5px 0; color: #374151; font-size: 15px;"><strong>Location:</strong> [Location]</p>
    <p style="margin: 0 0 5px 0; color: #374151; font-size: 15px;"><strong>Duration:</strong> [Duration]</p>
    <p style="margin: 0 0 5px 0; color: #374151; font-size: 15px;"><strong>Skills Needed:</strong> [Skills]</p>
</div>
<p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">[Program description and impact]</p>
<div style="text-align: center; margin: 30px 0;">
    <a href="#" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 10px; font-weight: 600; font-size: 15px;">Apply Now</a>
</div>`,
      },
      {
        id: 'monthly',
        name: 'Monthly Newsletter',
        description: 'Regular monthly update with news and activities',
        subject: 'Birdsfly Sangstha Monthly Update',
        content: `<h2 style="margin: 0 0 20px 0; color: #0d9488; font-size: 24px; font-weight: 700;">📰 Monthly Update</h2>
<p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">Here's what happened at Birdsfly Sangstha this month:</p>
<h3 style="margin: 0 0 10px 0; color: #0d9488; font-size: 18px; font-weight: 600;">🌟 Highlights</h3>
<p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">[Monthly highlights and achievements]</p>
<h3 style="margin: 0 0 10px 0; color: #0d9488; font-size: 18px; font-weight: 600;">📊 By the Numbers</h3>
<p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">[Statistics and metrics]</p>
<h3 style="margin: 0 0 10px 0; color: #0d9488; font-size: 18px; font-weight: 600;">📅 Upcoming Events</h3>
<p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">[List of upcoming events]</p>
<div style="text-align: center; margin: 30px 0;">
    <a href="https://birdsfly.org" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 10px; font-weight: 600; font-size: 15px;">Learn More</a>
</div>`,
      },
    ];
  }

  // Volunteer Approval Email
  static getVolunteerApprovalHTML(data: {
    name: string;
    causeTitle: string;
  }): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to the Team - Birdsfly Sangstha</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
    <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="background-color: #f4f4f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" cellspacing="0" cellpadding="0" width="600" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 40px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🎉 Welcome to the Team!</h1>
                            <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Your volunteer application has been approved</p>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 40px;">
                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">Dear <strong>${data.name}</strong>,</p>
                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">We are thrilled to inform you that your volunteer application for <strong>${data.causeTitle || 'General Volunteering'}</strong> has been <strong style="color: #059669;">approved</strong>!</p>
                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">Welcome to the Birdsfly Sangstha family. Your commitment to making a difference is truly inspiring, and we're excited to have you on board.</p>

                            <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0; border-radius: 8px;">
                                <h3 style="margin: 0 0 15px 0; color: #047857; font-size: 18px; font-weight: 600;">📋 Next Steps</h3>
                                <ul style="margin: 0; color: #374151; font-size: 15px; line-height: 1.8; padding-left: 20px;">
                                    <li>Check your email for orientation details</li>
                                    <li>Complete your volunteer profile</li>
                                    <li>Join our volunteer community group</li>
                                    <li>Review the volunteer handbook</li>
                                </ul>
                            </div>

                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">If you have any questions, please don't hesitate to reach out to us at <a href="mailto:volunteers@birdsfly.org" style="color: #0d9488; text-decoration: none;">volunteers@birdsfly.org</a></p>

                            <p style="margin: 20px 0 0 0; color: #374151; font-size: 16px; line-height: 1.6;">Together, we can create lasting change!</p>
                            <p style="margin: 10px 0 0 0; color: #374151; font-size: 16px; font-weight: 600;">The Birdsfly Sangstha Team</p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; text-align: center;">Need help? Contact us at <a href="mailto:info@birdsfly.org" style="color: #0d9488; text-decoration: none;">info@birdsfly.org</a></p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Birdsfly Sangstha. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
  }

  static getVolunteerApprovalSubject(): string {
    return '🎉 Welcome to the Team! - Your Volunteer Application is Approved';
  }

  // Volunteer Rejection Email
  static getVolunteerRejectionHTML(data: {
    name: string;
    notes?: string;
  }): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Volunteer Application Update - Birdsfly Sangstha</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
    <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="background-color: #f4f4f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" cellspacing="0" cellpadding="0" width="600" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 40px 40px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Volunteer Application Update</h1>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 40px;">
                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">Dear <strong>${data.name}</strong>,</p>
                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">Thank you for your interest in volunteering with Birdsfly Sangstha. We truly appreciate the time and effort you put into your application.</p>
                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">After careful consideration, we regret to inform you that we are unable to proceed with your application at this time. This was a difficult decision, as we receive many wonderful applications from dedicated individuals like yourself.</p>
                            ${
                              data.notes
                                ? `
                            <div style="background-color: #f9fafb; border-left: 4px solid #6b7280; padding: 20px; margin: 30px 0; border-radius: 8px;">
                                <h4 style="margin: 0 0 10px 0; color: #374151; font-size: 16px; font-weight: 600;">Additional Notes:</h4>
                                <p style="margin: 0; color: #6b7280; font-size: 15px; line-height: 1.6;">${data.notes}</p>
                            </div>
                            `
                                : ''
                            }
                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">We encourage you to apply again in the future. Our volunteer needs change throughout the year, and we would love to consider your application at a later time.</p>
                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">In the meantime, please consider:</p>
                            <ul style="margin: 0 0 20px 0; color: #374151; font-size: 15px; line-height: 1.8; padding-left: 20px;">
                                <li>Following us on social media for updates</li>
                                <li>Participating in our public events</li>
                                <li>Supporting our causes through donations</li>
                            </ul>
                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">Thank you again for your interest in making a difference. We wish you all the best in your future endeavors.</p>
                            <p style="margin: 20px 0 0 0; color: #374151; font-size: 16px; line-height: 1.6;">Warm regards,</p>
                            <p style="margin: 10px 0 0 0; color: #374151; font-size: 16px; font-weight: 600;">The Birdsfly Sangstha Team</p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; text-align: center;">Questions? Contact us at <a href="mailto:info@birdsfly.org" style="color: #0d9488; text-decoration: none;">info@birdsfly.org</a></p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Birdsfly Sangstha. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
  }

  static getVolunteerRejectionSubject(): string {
    return 'Volunteer Application Update - Birdsfly Sangstha';
  }

  static getOTPLoginHTML(data: OTPLoginData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Login Code - Birdsfly Sangstha</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
    <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="background-color: #f4f4f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" cellspacing="0" cellpadding="0" width="600" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    <tr>
                        <td style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 40px 40px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Birdsfly Sangstha</h1>
                            <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Your Login Verification Code</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 40px;">
                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">Hello <strong>${data.name}</strong>,</p>
                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">Use the following verification code to log in to your account:</p>

                            <div style="text-align: center; margin: 30px 0;">
                                <div style="display: inline-block; background: linear-gradient(135deg, #f0fdfa 0%, #e6fffa 100%); border: 2px dashed #0d9488; border-radius: 16px; padding: 20px 48px;">
                                    <p style="margin: 0 0 8px 0; color: #0f766e; font-size: 13px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;">Verification Code</p>
                                    <p style="margin: 0; color: #111827; font-size: 36px; font-weight: 800; letter-spacing: 8px; font-family: 'Courier New', monospace;">${data.otp}</p>
                                </div>
                            </div>

                            <div style="background-color: #fef3c7; border-radius: 12px; padding: 16px 20px; margin: 30px 0;">
                                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;"><strong>Please note:</strong> This code expires in <strong>${data.expiryMinutes} minutes</strong>. Do not share this code with anyone.</p>
                            </div>

                            <p style="margin: 20px 0 0 0; color: #374151; font-size: 16px; line-height: 1.6;">If you did not request this code, you can safely ignore this email.</p>
                            <p style="margin: 20px 0 0 0; color: #374151; font-size: 16px; line-height: 1.6;">Warm regards,<br><strong>Birdsfly Sangstha Team</strong></p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; text-align: center;">Need help? Contact us at <a href="mailto:info@birdsfly.org" style="color: #0d9488; text-decoration: none;">info@birdsfly.org</a></p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Birdsfly Sangstha. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
  }

  static getOTPLoginSubject(): string {
    return 'Your Login Verification Code - Birdsfly Sangstha';
  }

  static getDonorCredentialsHTML(data: DonorCredentialsData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Account Has Been Created - Birdsfly Sangstha</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
    <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="background-color: #f4f4f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" cellspacing="0" cellpadding="0" width="600" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    <tr>
                        <td style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 40px 40px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Birdsfly Sangstha</h1>
                            <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Your Account Has Been Created</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 40px;">
                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">Dear <strong>${data.name}</strong>,</p>
                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">Thank you for your generous donation of <strong>${data.donationAmount}</strong>${data.causeName ? ` to <strong>${data.causeName}</strong>` : ''}! An account has been created for you so you can track your donations and stay connected with our cause.</p>

                            <div style="background-color: #f0fdfa; border-radius: 12px; padding: 24px; margin: 30px 0; border-left: 4px solid #0d9488;">
                                <p style="margin: 0 0 16px 0; color: #0f766e; font-size: 16px; font-weight: 600;">Your Login Credentials</p>
                                <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                                    <tr>
                                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 100px;">Email:</td>
                                        <td style="padding: 8px 0; color: #111827; font-size: 15px; font-weight: 600;">${data.email}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb;">Password:</td>
                                        <td style="padding: 8px 0; color: #111827; font-size: 15px; font-weight: 600; border-top: 1px solid #e5e7eb;">${data.password}</td>
                                    </tr>
                                </table>
                            </div>

                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${data.loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px;">Log In to Your Account</a>
                            </div>

                            <div style="background-color: #fef3c7; border-radius: 12px; padding: 20px; margin: 30px 0;">
                                <p style="margin: 0 0 10px 0; color: #92400e; font-size: 14px; font-weight: 600;">Important Security Notice</p>
                                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">For your security, we strongly recommend changing your password after your first login. You can do this from your dashboard under Profile Settings.</p>
                            </div>

                            <p style="margin: 20px 0 0 0; color: #374151; font-size: 16px; line-height: 1.6;">Through your account, you can view your donation history, download tax receipts, and track the impact of your contributions.</p>
                            <p style="margin: 20px 0 0 0; color: #374151; font-size: 16px; line-height: 1.6;">Warm regards,<br><strong>Birdsfly Sangstha Team</strong></p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; text-align: center;">Need help? Contact us at <a href="mailto:info@birdsfly.org" style="color: #0d9488; text-decoration: none;">info@birdsfly.org</a></p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Birdsfly Sangstha. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
  }

  static getDonorCredentialsSubject(): string {
    return 'Your Birdsfly Sangstha Account Has Been Created';
  }

  static getReferralInviteHTML(data: {
    referrerName: string;
    referralLink: string;
    customMessage?: string;
  }): string {
    return `
    <!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You're Invited to Birdsfly Sangstha</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <table style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="padding: 40px 20px;">
                <table style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #0d9488 0%, #059669 100%); padding: 40px 40px 30px 40px; text-align: center;">
                            <h1 style="margin: 0 0 10px 0; color: #ffffff; font-size: 28px; font-weight: 700;">You're Invited!</h1>
                            <p style="margin: 0; color: #d1fae5; font-size: 16px;">Join Birdsfly Sangstha and make a difference</p>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 40px;">
                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                                <strong>${data.referrerName}</strong> thinks you'd be a great addition to our community!
                            </p>
                            ${
                              data.customMessage
                                ? `
                            <div style="background-color: #f0fdfa; border-left: 4px solid #0d9488; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                                <p style="margin: 0; color: #115e59; font-style: italic;">"${data.customMessage}"</p>
                                <p style="margin: 10px 0 0 0; color: #0d9488; font-size: 14px;">— ${data.referrerName}</p>
                            </div>
                            `
                                : ''
                            }
                            <p style="margin: 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                                Birdsfly Sangstha connects passionate individuals with meaningful causes. When you sign up using their referral link:
                            </p>
                            <ul style="margin: 0 0 20px 20px; color: #374151; font-size: 15px; line-height: 1.8;">
                                <li>You'll join a community of change-makers</li>
                                <li>Discover causes that need your support</li>
                                <li>Track your impact and contributions</li>
                                <li>Help ${data.referrerName} earn referral badges</li>
                            </ul>
                            <!-- CTA Button -->
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${data.referralLink}" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #059669 100%); color: #ffffff; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600;">
                                    Accept Invitation
                                </a>
                            </div>
                            <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; text-align: center;">
                                Or copy this link: <a href="${data.referralLink}" style="color: #0d9488; text-decoration: none; word-break: break-all;">${data.referralLink}</a>
                            </p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; text-align: center;">Questions? Contact us at <a href="mailto:info@birdsfly.org" style="color: #0d9488; text-decoration: none;">info@birdsfly.org</a></p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Birdsfly Sangstha. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
  }

  static getDonationReceiptSubject(): string {
    return 'Your Donation Receipt - Birdsfly Sangstha';
  }

  static getDonationReceiptHTML(data: DonationReceiptData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Donation Receipt - Birdsfly Sangstha</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
    <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="background-color: #f4f4f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" cellspacing="0" cellpadding="0" width="600" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 40px 40px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Birdsfly Sangstha</h1>
                            <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Donation Receipt</p>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 40px;">
                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">Dear ${data.donorName || 'Supporter'},</p>
                            <p style="margin: 0 0 30px 0; color: #374151; font-size: 16px; line-height: 1.6;">Thank you for your generous donation! Your contribution makes a real difference in the lives of those we serve. This email serves as your official donation receipt.</p>
                            
                            <!-- Receipt Details Box -->
                            <div style="background-color: #f0fdfa; border: 2px solid #0d9488; border-radius: 12px; padding: 25px; margin: 30px 0;">
                                <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                                    <tr>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #ccfbf1;">
                                            <span style="color: #6b7280; font-size: 14px;">Donation Amount:</span>
                                        </td>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #ccfbf1; text-align: right;">
                                            <span style="color: #0d9488; font-size: 20px; font-weight: 700;">${data.donationAmount}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #ccfbf1;">
                                            <span style="color: #6b7280; font-size: 14px;">Cause:</span>
                                        </td>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #ccfbf1; text-align: right;">
                                            <span style="color: #374151; font-size: 14px; font-weight: 600;">${data.causeName}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #ccfbf1;">
                                            <span style="color: #6b7280; font-size: 14px;">Transaction ID:</span>
                                        </td>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #ccfbf1; text-align: right;">
                                            <span style="color: #374151; font-size: 14px;">${data.transactionId}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #ccfbf1;">
                                            <span style="color: #6b7280; font-size: 14px;">Donation Date:</span>
                                        </td>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #ccfbf1; text-align: right;">
                                            <span style="color: #374151; font-size: 14px;">${data.donationDate}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0;">
                                            <span style="color: #6b7280; font-size: 14px;">Payment Method:</span>
                                        </td>
                                        <td style="padding: 10px 0; text-align: right;">
                                            <span style="color: #374151; font-size: 14px;">${data.paymentMethod}</span>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            
                            <p style="margin: 20px 0 0 0; color: #374151; font-size: 16px; line-height: 1.6;"><strong>Tax Information:</strong> Birdsfly Sangstha is a registered non-profit organization. Your donation may be tax-deductible to the extent allowed by law. Please consult with your tax advisor for specific guidance.</p>
                            
                            <p style="margin: 30px 0 0 0; color: #374151; font-size: 16px; line-height: 1.6;">Questions about your donation? Contact us at <a href="mailto:info@birdsfly.org" style="color: #0d9488; text-decoration: none;">info@birdsfly.org</a></p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; text-align: center;">Birdsfly Sangstha | 123 Charity Lane, New York, NY 10001</p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Birdsfly Sangstha. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
  }
}
