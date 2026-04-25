# Auto-Registration System for Non-Logged-In Donors

## Overview
When a non-registered user makes a donation, they automatically receive:
1. A new user account created with their email
2. A secure random password generated
3. Welcome email with login credentials
4. Donation linked to their new account

## Flow

```
Donation (no donorId)
    ↓
Stripe Webhook triggered
    ↓
Check if donorId exists
    ↓ No
Check if email already registered
    ↓ No
Create new user account
    ↓
Generate secure password
    ↓
Hash password & save user
    ↓
Update donation with donorId
    ↓
Send welcome email with credentials
    ↓
Return success
```

## Implementation Files

1. `src/stripe/stripe.service.ts` - Modified webhook handler
2. `src/email/email.service.ts` - Welcome email template
3. `src/auth/auth.service.ts` - User creation helper

## Security Considerations

- Passwords are securely hashed with bcrypt
- Email is verified via Stripe (customer_email)
- Duplicate email prevention
- Transaction safety (atomic operations)
- Welcome email includes password change reminder

## Email Template

Subject: "Welcome to Birdsfly Sangstha - Your Donation & Account Details"

Body includes:
- Thank you message
- Login credentials (email + generated password)
- Security reminder to change password
- Link to view donation history
- Support contact info
