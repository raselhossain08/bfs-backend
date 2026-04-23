import { Injectable } from '@nestjs/common';

export interface BotResponse {
    content: string;
    shouldEscalate: boolean;
    matchedPattern?: string;
}

@Injectable()
export class BotService {
    private escalationKeywords = [
        'speak to human',
        'talk to person',
        'human agent',
        'real person',
        'representative',
        'urgent',
        'manager',
        'complaint',
        'supervisor',
        'not helping',
        'not satisfied',
        'transfer me',
    ];

    private responsePatterns = [
        {
            patterns: [/\b(hello|hi|hey|greetings|good morning|good afternoon|good evening)\b/i],
            response: "Hello! 👋 Welcome to Birdsfly Support. I'm here to help you with donations, campaigns, or any questions. How can I assist you today?",
            category: 'greeting'
        },
        {
            patterns: [/\b(donation|donate|give|contribute|contributing)\b/i],
            response: "I'd be happy to help with donations! 💝\n\nYou can:\n• Make a one-time donation at birdsfly.org/donate\n• Set up monthly recurring donations\n• Choose a specific cause to support\n\nWould you like me to guide you through the donation process?",
            category: 'donation'
        },
        {
            patterns: [/\b(receipt|tax|tax-deductible|deduction|invoice)\b/i],
            response: "For donation receipts:\n\n1. Log in to your account\n2. Go to 'My Donations'\n3. Click 'Download Receipt' for any donation\n\nAll donations are tax-deductible. The receipt includes our charity registration number.\n\nWould you like me to help you find your donation history?",
            category: 'receipt'
        },
        {
            patterns: [/\b(volunteer|volunteering|volunteer opportunity)\b/i],
            response: "Great that you're interested in volunteering! 🙌\n\nWe have opportunities in:\n• Event support\n• Fundraising\n• Admin assistance\n• Field work\n\nApply at birdsfly.org/become-a-volunteer\n\nWould you like more information about any specific role?",
            category: 'volunteer'
        },
        {
            patterns: [/\b(event|events|upcoming|activities)\b/i],
            response: "We have exciting upcoming events! 📅\n\nView all events at birdsfly.org/events\n\nSome events require registration. Would you like me to help you register for a specific event?",
            category: 'events'
        },
        {
            patterns: [/\b(campaign|cause|project|fundraise)\b/i],
            response: "We have several active campaigns making real impact! 🎯\n\nExplore them at birdsfly.org/causes\n\nEach campaign shows:\n• Progress toward goals\n• Impact stories\n• How donations help\n\nInterested in a specific cause?",
            category: 'campaign'
        },
        {
            patterns: [/\b(payment|pay|card|billing|credit card|debit)\b/i],
            response: "For payment questions:\n\n✅ We accept: Credit/Debit cards, PayPal, Bank transfers\n✅ All transactions are secure and encrypted\n✅ You'll receive confirmation via email\n\nHaving payment issues? Please describe what's happening and I'll help troubleshoot.",
            category: 'payment'
        },
        {
            patterns: [/\b(refund|cancel donation|money back)\b/i],
            response: "I understand you need refund assistance.\n\nOur refund policy:\n• Donations can be refunded within 7 days\n• Please contact support with your donation ID\n• Refunds take 5-10 business days\n\nWould you like me to connect you with our finance team?",
            category: 'refund'
        },
        {
            patterns: [/\b(account|profile|login|password|sign in|sign up|register)\b/i],
            response: "For account help:\n\n1. Go to birdsfly.org/login\n2. Use 'Forgot Password' if needed\n3. Update profile in Settings\n\nHaving trouble logging in? I can help troubleshoot.",
            category: 'account'
        },
        {
            patterns: [/\b(impact|where.*money|how.*help|difference|effect)\b/i],
            response: "Your impact matters! 💚\n\n100% of your donation goes to:\n• Food programs: 40%\n• Education: 30%\n• Healthcare: 20%\n• Admin costs: 10%\n\nVisit birdsfly.org/about to see success stories and impact reports!",
            category: 'impact'
        },
        {
            patterns: [/\b(thank|thanks|appreciate|grateful)\b/i],
            response: "You're welcome! 😊 Thank you for supporting our mission. Is there anything else I can help you with?",
            category: 'thanks'
        },
        {
            patterns: [/\b(bye|goodbye|see you|later|exit|quit)\b/i],
            response: "Thank you for chatting with Birdsfly! 🙏\n\nYour support makes a real difference. Have a wonderful day!",
            category: 'goodbye'
        },
        {
            patterns: [/\b(error|bug|issue|problem|not working|broken|fail|can't)\b/i],
            response: "I'm sorry you're experiencing technical issues. 🔧\n\nLet's try:\n1. Refresh the page (F5)\n2. Clear browser cache\n3. Try a different browser\n\nStill not working? I'll connect you with our tech support team.",
            category: 'technical'
        },
        {
            patterns: [/\b(contact|phone|email|reach|call)\b/i],
            response: "You can reach us at:\n\n📧 Email: support@birdsfly.org\n📞 Phone: +880-XXX-XXXX\n📍 Address: Dhaka, Bangladesh\n\nOr fill out our contact form at birdsfly.org/contact\n\nPrefer to chat with a real person?",
            category: 'contact'
        },
    ];

    async processMessage(message: string, context?: { previousMessages?: string[] }): Promise<BotResponse> {
        const lowerMessage = message.toLowerCase().trim();

        // Check for escalation keywords first
        if (this.shouldEscalate(lowerMessage)) {
            return {
                content: "I understand you'd like to speak with a human agent. Let me connect you with our support team. 🔗\n\nAn agent will join shortly. In the meantime, please describe your issue in detail so they can assist you better.",
                shouldEscalate: true,
                matchedPattern: 'escalation'
            };
        }

        // Try pattern matching
        for (const pattern of this.responsePatterns) {
            for (const regex of pattern.patterns) {
                if (regex.test(lowerMessage)) {
                    return {
                        content: pattern.response,
                        shouldEscalate: false,
                        matchedPattern: pattern.category
                    };
                }
            }
        }

        // Default fallback response
        return {
            content: "Thank you for your message. I want to make sure I understand your needs correctly. Could you provide more details?\n\nOr if you'd prefer, I can connect you with a human support agent who can assist you further.",
            shouldEscalate: false,
            matchedPattern: 'fallback'
        };
    }

    shouldEscalate(message: string): boolean {
        return this.escalationKeywords.some(keyword =>
            message.toLowerCase().includes(keyword.toLowerCase())
        );
    }

    getQuickActions(): Array<{ id: string; label: string; response: string }> {
        return [
            { id: 'donate', label: 'Make a Donation', response: "I'd like to make a donation" },
            { id: 'receipt', label: 'Get Receipt', response: "I need help with donation receipts" },
            { id: 'volunteer', label: 'Volunteer', response: "I'm interested in volunteering" },
            { id: 'human', label: 'Speak to Human', response: "I'd like to speak to a human agent" },
        ];
    }
}