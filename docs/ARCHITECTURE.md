# BFS NGO Backend - Architecture Documentation

## Overview

This is a comprehensive NGO management backend for **Birds Fly Sangstha (BFS)** built with **NestJS** and **TypeORM**. It handles donations, campaigns, user management, content, events, and volunteer coordination.

## System Architecture

### Technology Stack
- **Framework**: NestJS 11
- **Language**: TypeScript 5.7
- **Database**: PostgreSQL
- **ORM**: TypeORM 0.3.28
- **Authentication**: JWT + Passport.js
- **Payments**: Stripe
- **Communication**: Socket.io (WebSockets), Nodemailer, Twilio

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CORE USER SYSTEM                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   ┌──────────────┐         ┌──────────────────┐         ┌──────────────────┐   │
│   │   Session    │────────▶│      User        │◀────────│ TwoFactorAuth    │   │
│   │              │   N:1   │                  │   1:1   │                  │   │
│   └──────────────┘         └────────┬─────────┘         └──────────────────┘   │
│                                      │                                          │
│                   ┌──────────────────┼──────────────────┐                        │
│                   │                  │                  │                        │
│                   ▼                  ▼                  ▼                        │
│   ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐           │
│   │ PaymentMethod    │    │ RecurringDonation│    │      Goal      │           │
│   │     (N:1)        │    │     (N:1)        │    │     (N:1)      │           │
│   └──────────────────┘    └──────────────────┘    └──────────────────┘           │
│                                                                                 │
│   ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐        │
│   │  SavedCampaign   │    │     Donation     │    │     Referral     │        │
│   │     (N:1)        │    │     (N:1)        │    │   (referrer)     │        │
│   └──────────────────┘    └──────────────────┘    └──────────────────┘        │
│                                                                                 │
│   ┌──────────────────┐    ┌──────────────────┐                               │
│   │  Referral        │    │  AuditLog        │                               │
│   │  (referred)      │    │  (N:1 - actor)   │                               │
│   └──────────────────┘    └──────────────────┘                               │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                           CAUSES & DONATIONS                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   ┌──────────────────┐         ┌──────────────────┐                            │
│   │  CauseCategory   │◀────────│      Cause       │                            │
│   │    (parent)      │   N:1   │                  │                            │
│   └──────────────────┘         └────────┬─────────┘                            │
│                                         │                                       │
│                        ┌────────────────┼────────────────┐                    │
│                        │                │                │                    │
│                        ▼                ▼                ▼                    │
│   ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐          │
│   │    Donation      │    │ SavedCampaign    │    │ RecurringDonation│          │
│   │     (N:1)        │    │     (N:1)        │    │     (N:1)        │          │
│   └──────────────────┘    └──────────────────┘    └──────────────────┘          │
│                                                                                 │
│   ┌──────────────────┐                                                         │
│   │      Goal        │  (causeId FK only - no relationship)                    │
│   │  (causeId: int)  │                                                         │
│   └──────────────────┘                                                         │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                           CONTENT MANAGEMENT                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   ┌──────────────────┐         ┌──────────────────┐                            │
│   │    Category      │◀────────│     Article      │                            │
│   │  (self-ref:      │   N:1   │                  │                            │
│   │  parentId)       │         └──────────────────┘                            │
│   └──────────────────┘                                                        │
│          ▲                                                                      │
│          │                                                                      │
│   ┌──────┴───────────────┐                                                    │
│   │  Page ──▶ Section    │  (1:N relationship)                               │
│   └──────────────────────┘                                                    │
│                                                                                 │
│   ┌──────────────────┐                                                         │
│   │    CmsItem       │  (key-value storage)                                   │
│   └──────────────────┘                                                         │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              EVENTS MODULE                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   ┌──────────────────┐         ┌──────────────────┐                            │
│   │    EventType     │◀────────│      Event       │                            │
│   │                  │   N:1   │                  │                            │
│   └──────────────────┘         └────────┬─────────┘                            │
│                                         │                                       │
│                                         ▼                                       │
│                              ┌──────────────────┐                              │
│                              │ EventRegistration│                             │
│                              │      (N:1)       │                             │
│                              └──────────────────┘                              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                             SERVICES MODULE                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   ┌──────────────────┐         ┌──────────────────┐                            │
│   │ ServiceCategory  │◀────────│      Service     │                            │
│   │                  │   N:1   │                  │                            │
│   └──────────────────┘         └────────┬─────────┘                            │
│                                         │                                       │
│                                         ▼                                       │
│                              ┌──────────────────┐                              │
│                              │  ServiceInquiry  │                             │
│                              │      (N:1)       │                             │
│                              └──────────────────┘                              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                           LIVE CHAT SYSTEM                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   ┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐│
│   │  ChatSession     │◀────────│ ChatMessageEntity│         │   ChatAgent      ││
│   │                  │   1:N   │                  │         │                  ││
│   └────────┬─────────┘         └──────────────────┘         └──────────────────┘│
│            │                                                                    │
│            │         ┌──────────────────┐                                        │
│            └────────▶│  ChatAnalytics   │                                        │
│                      │                  │                                        │
│                      └──────────────────┘                                        │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                           OTHER ENTITIES                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐          │
│   │     Program      │    │  SuccessStory    │    │     Comment      │          │
│   │                  │    │                  │    │                  │          │
│   └──────────────────┘    └──────────────────┘    └──────────────────┘          │
│                                                                                 │
│   ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐          │
│   │     Setting      │    │     Volunteer    │    │ VolunteerApp     │          │
│   │                  │    │                  │    │                  │          │
│   └──────────────────┘    └──────────────────┘    └──────────────────┘          │
│                                                                                 │
│   ┌──────────────────┐    ┌──────────────────┐                                  │
│   │ Subscriber       │    │ SupportTicket    │                                  │
│   │ (newsletter)     │    │                  │                                  │
│   └──────────────────┘    └──────────────────┘                                  │
│                                                                                 │
│   ┌──────────────────┐    ┌──────────────────┐                                  │
│   │ AlertTemplate    │    │ AlertBroadcast   │                                  │
│   │                  │    │                  │                                  │
│   └──────────────────┘    └──────────────────┘                                  │
│                                                                                 │
│   ┌──────────────────┐                                                          │
│   │ DonationSection  │                                                          │
│   │                  │                                                          │
│   └──────────────────┘                                                          │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Module Dependencies

```
AppModule
├── AuthModule
│   ├── UsersModule
│   └── ReferralModule (forwardRef)
├── UsersModule
│   └── CausesModule
├── CausesModule
│   └── ReferralModule (forwardRef)  ⚠️ CIRCULAR
├── ReferralModule
│   └── EmailModule
├── StripeModule
│   └── CmsService
├── RecurringDonationsModule
│   └── User/PaymentMethod/Cause Repos
├── GoalsModule
├── SavedCampaignsModule
│   └── CauseRepository
├── PaymentMethodsModule
│   └── UserRepository
├── VolunteersModule
├── CategoriesModule
├── ArticlesModule
├── EventsModule
├── ServicesModule
├── PagesModule
├── ProgramsModule
├── CommentsModule
├── SuccessStoriesModule
├── DonationsModule
├── CmsModule
├── DashboardModule
├── SupportModule
├── ChatModule
├── EmailModule
├── NotificationsModule
├── SmsModule
├── AdminModule
├── AuditModule
└── SessionsModule
```

## Database Schema

### Critical Relationship Issues

#### 1. **User Entity - Missing Relationships**
**Problem**: User has no `@OneToMany` decorators despite having many child entities

```typescript
// CURRENT STATE - User Entity has NO relationships defined
@Entity()
export class User {
    // ... fields only, no @OneToMany
}

// SHOULD HAVE:
@OneToMany(() => Donation, donation => donation.donor, { cascade: true })
donations: Donation[];

@OneToMany(() => PaymentMethod, pm => pm.user, { cascade: true })
paymentMethods: PaymentMethod[];

@OneToMany(() => RecurringDonation, rd => rd.user, { cascade: true })
recurringDonations: RecurringDonation[];

@OneToMany(() => Goal, goal => goal.user, { cascade: true })
goals: Goal[];

@OneToMany(() => SavedCampaign, sc => sc.user, { cascade: true })
savedCampaigns: SavedCampaign[];
```

#### 2. **Goal Entity - Incomplete Relationships**
**Problem**: Has `causeId` column but no `@ManyToOne` relationship

```typescript
// CURRENT - Just an ID
@Column({ type: 'int', nullable: true })
causeId: number;

// SHOULD BE:
@Column({ nullable: true })
causeId: number;

@ManyToOne(() => Cause, { nullable: true })
@JoinColumn({ name: 'causeId' })
cause: Cause;
```

#### 3. **User.referredBy - Not a Foreign Key**
**Problem**: Just stores a number without referential integrity

```typescript
// CURRENT
@Column({ nullable: true })
referredBy: number; // Just a number

// SHOULD BE:
@Column({ nullable: true })
referredBy: number;

@ManyToOne(() => User, { nullable: true })
@JoinColumn({ name: 'referredBy' })
referrer: User;
```

## Data Flow Issues

### 1. **Donation Processing Flow**
```
Current Flow (BROKEN):
1. Stripe Webhook → StripeService.handleCheckoutSessionCompleted()
2. Creates Donation entity
3. Calls updateCauseStats() - SEPARATE DB OPERATIONS
4. CausesService would need to call ReferralService
   ↳ BUT CausesModule can't import ReferralModule (circular)
   ↳ So referral tracking is skipped

Problem:
- No transaction wrapping
- If step 3 fails, donation is recorded but stats wrong
- Referral tracking is decoupled/inconsistent
```

### 2. **Goal Progress Updates**
```
Current Flow (BROKEN):
1. Donation is made
2. GoalsService.updateGoalProgress() exists
3. But CausesService doesn't call it
4. Goal progress becomes stale

Missing: Event-driven architecture to update goals on donation
```

### 3. **User Deletion Cascade**
```
Current State (DANGEROUS):
- User entity has no cascade rules
- Deleting user leaves orphaned:
  - Donations (should keep for records?)
  - PaymentMethods (should cascade)
  - RecurringDonations (should cascade)
  - Goals (should cascade)
  - SavedCampaigns (should cascade)
  - Referrals (should keep but anonymize)

Recommendation: Implement soft delete with cascade
```

## Recommended Fixes Priority

### Priority 1 - Critical (Data Integrity)
1. Add proper User relationships with cascade rules
2. Wrap donation processing in transactions
3. Fix circular dependency CausesModule ↔ ReferralModule
4. Add missing indexes on foreign keys
5. Complete Goal entity relationships

### Priority 2 - High (Performance & Consistency)
1. Implement event-driven architecture (EventEmitter)
2. Standardize currency defaults
3. Add database constraints
4. Fix duplicate session entity

### Priority 3 - Medium (Code Quality)
1. Add missing DTO validation
2. Standardize error handling
3. Add API documentation
4. Implement proper logging strategy

## Entity Count

| Category | Count |
|----------|-------|
| Core (User, Auth) | 5 |
| Payments | 4 |
| Causes | 3 |
| Content | 5 |
| Events | 3 |
| Services | 3 |
| Communication | 8 |
| Other | 12 |
| **Total** | **43** |

## File Locations

- **Entities**: `src/**/entities/*.entity.ts`
- **Services**: `src/**/*.service.ts`
- **Controllers**: `src/**/*.controller.ts`
- **Modules**: `src/**/*.module.ts`
- **DTOs**: `src/**/dto/*.dto.ts`
- **Database Config**: `src/app.module.ts:96-145`

---

*Last Updated: 2026-04-16*
*Version: 1.0*
