import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

interface Notification {
  id: string;
  type: 'donation' | 'campaign' | 'system' | 'impact';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

// In-memory storage for notifications (replace with database in production)
const notificationsStore: Map<number, Notification[]> = new Map();

@Controller('notifications')
export class NotificationsController {
  constructor() {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getNotifications(@Request() req: any) {
    const userId = req.user?.sub || req.user?.id;

    // Get user notifications or return empty array
    const userNotifications = notificationsStore.get(userId) || [];

    return { data: userNotifications };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/mark-read')
  async markAsRead(@Request() req: any, @Param('id') id: string) {
    const userId = req.user?.sub || req.user?.id;

    const userNotifications = notificationsStore.get(userId) || [];
    const notification = userNotifications.find((n) => n.id === id);

    if (notification) {
      notification.read = true;
    }

    return { data: { success: true } };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('mark-read')
  async markAllAsRead(@Request() req: any) {
    const userId = req.user?.sub || req.user?.id;

    const userNotifications = notificationsStore.get(userId) || [];
    userNotifications.forEach((n) => (n.read = true));

    return { data: { success: true } };
  }
}
