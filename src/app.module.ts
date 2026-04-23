import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CmsModule } from './cms/cms.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { SupportModule } from './support/support.module';
import { ChatModule } from './chat/chat.module';
import { EmailModule } from './email/email.module';
import { NotificationsModule } from './notifications/notifications.module';
import { StripeModule } from './stripe/stripe.module';
import { SmsModule } from './sms/sms.module';
import { AdminModule } from './admin/admin.module';
import { AuditModule } from './audit/audit.module';
import { SessionsModule } from './sessions/sessions.module';
import { VolunteersModule } from './volunteers/volunteers.module';
import { CategoriesModule } from './categories/categories.module';
import { ArticlesModule } from './articles/articles.module';
import { EventsModule } from './events/events.module';
import { ServicesModule } from './services/services.module';
import { PagesModule } from './pages/pages.module';
import { CausesModule } from './causes/causes.module';
import { User } from './users/entities/user.entity';
import { CmsItem } from './cms/entities/cms-item.entity';
import { ChatMessage } from './support/entities/chat-message.entity';
import { SupportTicket } from './support/entities/support-ticket.entity';
import { ChatSession } from './chat/entities/chat-session.entity';
import { ChatMessageEntity } from './chat/entities/chat-message.entity';
import { ChatAgent } from './chat/entities/chat-agent.entity';
import { ChatAnalytics } from './chat/entities/chat-analytics.entity';
import { AuditLog } from './audit/audit-log.entity';
import { Session } from './sessions/entities/session.entity';
import { TwoFactorAuth } from './auth/two-factor.entity';
import { VolunteerApplication } from './volunteers/entities/volunteer-application.entity';
import { Volunteer } from './volunteers/entities/volunteer.entity';
import { Category } from './categories/entities/category.entity';
import { Article } from './articles/entities/article.entity';
import { Event } from './events/entities/event.entity';
import { EventType } from './events/entities/event-type.entity';
import { EventRegistration } from './events/entities/event-registration.entity';
import { Service } from './services/entities/service.entity';
import { ServiceCategory } from './services/entities/service-category.entity';
import { ServiceInquiry } from './services/entities/service-inquiry.entity';
import { Page } from './pages/entities/page.entity';
import { Section } from './pages/entities/section.entity';
import { Cause } from './causes/entities/cause.entity';
import { CauseCategory } from './causes/entities/cause-category.entity';
import { PaymentMethod } from './payment-methods/entities/payment-method.entity';
import { PaymentMethodsModule } from './payment-methods/payment-methods.module';
import { Referral } from './referral/entities/referral.entity';
import { ReferralModule } from './referral/referral.module';
import { Donation } from './causes/entities/donation.entity';
import { SavedCampaign } from './saved-campaigns/entities/saved-campaign.entity';
import { SavedCampaignsModule } from './saved-campaigns/saved-campaigns.module';
import { Program } from './programs/entities/program.entity';
import { ProgramsModule } from './programs/programs.module';
import { Comment } from './comments/entities/comment.entity';
import { CommentsModule } from './comments/comments.module';
import { SuccessStory } from './success-stories/entities/success-story.entity';
import { SuccessStoriesModule } from './success-stories/success-stories.module';
import { DonationSection } from './donations/entities/donation-section.entity';
import { DonationsModule } from './donations/donations.module';
import { DonationsVerificationModule } from './donations/donations-verification.module';
import { Goal } from './goals/entities/goal.entity';
import { GoalsModule } from './goals/goals.module';
import { RecurringDonation } from './recurring-donations/entities/recurring-donation.entity';
import { RecurringDonationsModule } from './recurring-donations/recurring-donations.module';


@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        // Rate limiting
        ThrottlerModule.forRoot([
            {
                name: 'short',
                ttl: 1000, // 1 second
                limit: 3, // 3 requests per second
            },
            {
                name: 'medium',
                ttl: 10000, // 10 seconds
                limit: 20, // 20 requests per 10 seconds
            },
            {
                name: 'long',
                ttl: 60000, // 1 minute
                limit: 100, // 100 requests per minute
            },
        ]),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                type: 'postgres',
                host: configService.get<string>('DATABASE_HOST'),
                port: configService.get<number>('DATABASE_PORT'),
                username: configService.get<string>('DATABASE_USER'),
                password: configService.get<string>('DATABASE_PASSWORD'),
                database: configService.get<string>('DATABASE_NAME'),
                entities: [
                    User,
                    CmsItem,
                    ChatMessage,
                    SupportTicket,
                    ChatSession,
                    ChatMessageEntity,
                    ChatAgent,
                    ChatAnalytics,
                    AuditLog,
                    Session,
                    TwoFactorAuth,
                    VolunteerApplication,
                    Volunteer,
                    Category,
                    Article,
                    Event,
                    EventType,
                    EventRegistration,
                    Service,
                    ServiceCategory,
                    ServiceInquiry,
                    Page,
                    Section,
                    Cause,
                    CauseCategory,
                    Donation,
                    PaymentMethod,
                    Referral,
                    SavedCampaign,
        Program,
        Comment,
        SuccessStory,
        DonationSection,
                    Goal,
                    RecurringDonation,
                ],
                synchronize: true, // Auto-create tables (dev only)
            }),
            inject: [ConfigService],
        }),
        // Entity modules MUST be before CmsModule so their specific routes
        // take priority over the CMS catch-all @Get(':key') route
        CategoriesModule,
        ArticlesModule,
        EventsModule,
        ServicesModule,
        PagesModule,
        CausesModule,
        ProgramsModule,
        CommentsModule,
        SuccessStoriesModule,
        DonationsModule,
        EmailModule,
        NotificationsModule,
        SmsModule,
        PaymentMethodsModule,
        CmsModule,
        DashboardModule,
        UsersModule,
        AuthModule,
        SupportModule,
        ChatModule,
        StripeModule,
        AdminModule,
        AuditModule,
        SessionsModule,
        VolunteersModule,
        ReferralModule,
        SavedCampaignsModule,
        GoalsModule,
        RecurringDonationsModule,
        DonationsVerificationModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}