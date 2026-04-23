// Chat DTOs
// Note: Validation is handled by the gateway/service layer

export class CreateMessageDto {
    content: string;
    sessionId: number;
    tempId?: string;
}

export class StartSessionDto {
    pageUrl?: string;
    userAgent?: string;
}

export class AssignAgentDto {
    sessionId: number;
    agentId: number;
}

export class UpdateAgentStatusDto {
    status: 'online' | 'busy' | 'away' | 'offline';
}

export class SubmitFeedbackDto {
    sessionId: number;
    rating: number;
    feedback?: string;
}