import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { BotService } from './bot/bot.service';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessageEntity } from './entities/chat-message.entity';
import { ChatAgent } from './entities/chat-agent.entity';
import { ChatAnalytics } from './entities/chat-analytics.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChatSession,
      ChatMessageEntity,
      ChatAgent,
      ChatAnalytics,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService, BotService],
  exports: [ChatService, BotService],
})
export class ChatModule {}
