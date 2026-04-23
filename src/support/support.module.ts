import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { ChatMessage } from './entities/chat-message.entity';
import { SupportTicket } from './entities/support-ticket.entity';
import { AnonymousSession } from './entities/anonymous-session.entity';
import { TicketReply } from './entities/ticket-reply.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([ChatMessage, SupportTicket, AnonymousSession, TicketReply]),
    ],
    controllers: [SupportController],
    providers: [SupportService],
    exports: [SupportService],
})
export class SupportModule { }
