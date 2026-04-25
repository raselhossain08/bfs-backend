import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RecurringDonationsService } from './recurring-donations.service';
import { CreateRecurringDonationDto } from './dto/create-recurring.dto';
import { UpdateRecurringDonationDto } from './dto/update-recurring.dto';

@Controller('users/me/recurring-donations')
export class RecurringDonationsController {
  constructor(
    private readonly recurringDonationsService: RecurringDonationsService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(@Request() req: any) {
    const userId = req.user?.userId || req.user?.sub || req.user?.id;
    const donations = await this.recurringDonationsService.findAll(userId);
    return { data: donations };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    const userId = req.user?.userId || req.user?.sub || req.user?.id;
    const donation = await this.recurringDonationsService.findOne(
      userId,
      parseInt(id, 10),
    );
    return { data: donation };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Request() req: any, @Body() dto: CreateRecurringDonationDto) {
    const userId = req.user?.userId || req.user?.sub || req.user?.id;
    const donation = await this.recurringDonationsService.create(userId, dto);
    return { success: true, data: donation };
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateRecurringDonationDto,
  ) {
    const userId = req.user?.userId || req.user?.sub || req.user?.id;
    const donation = await this.recurringDonationsService.update(
      userId,
      parseInt(id, 10),
      dto,
    );
    return { success: true, data: donation };
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/pause')
  async pause(@Request() req: any, @Param('id') id: string) {
    const userId = req.user?.userId || req.user?.sub || req.user?.id;
    const donation = await this.recurringDonationsService.pause(
      userId,
      parseInt(id, 10),
    );
    return { success: true, data: donation };
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/resume')
  async resume(@Request() req: any, @Param('id') id: string) {
    const userId = req.user?.userId || req.user?.sub || req.user?.id;
    const donation = await this.recurringDonationsService.resume(
      userId,
      parseInt(id, 10),
    );
    return { success: true, data: donation };
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async cancel(@Request() req: any, @Param('id') id: string) {
    const userId = req.user?.userId || req.user?.sub || req.user?.id;
    const result = await this.recurringDonationsService.cancel(
      userId,
      parseInt(id, 10),
    );
    return result;
  }
}
