import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaymentMethodsService } from './payment-methods.service';
import {
  CreatePaymentMethodDto,
  UpdatePaymentMethodDto,
} from './dto/payment-method.dto';

@Controller('payment-methods')
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  // ============ USER ENDPOINTS (Require Authentication) ============

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getUserPaymentMethods(@Request() req: any) {
    const paymentMethods = await this.paymentMethodsService.findAll(
      req.user.userId,
    );
    return { data: paymentMethods };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async getPaymentMethod(@Request() req: any, @Param('id') id: string) {
    const paymentMethod = await this.paymentMethodsService.findOne(
      req.user.userId,
      parseInt(id, 10),
    );
    return { data: paymentMethod };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async createPaymentMethod(
    @Request() req: any,
    @Body() dto: CreatePaymentMethodDto,
  ) {
    const paymentMethod = await this.paymentMethodsService.create(
      req.user.userId,
      dto,
    );
    return { success: true, data: paymentMethod };
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  async updatePaymentMethod(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdatePaymentMethodDto,
  ) {
    const paymentMethod = await this.paymentMethodsService.update(
      req.user.userId,
      parseInt(id, 10),
      dto,
    );
    return { success: true, data: paymentMethod };
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/default')
  async setDefaultPaymentMethod(@Request() req: any, @Param('id') id: string) {
    const paymentMethod = await this.paymentMethodsService.setDefault(
      req.user.userId,
      parseInt(id, 10),
    );
    return { success: true, data: paymentMethod };
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async deletePaymentMethod(@Request() req: any, @Param('id') id: string) {
    const result = await this.paymentMethodsService.remove(
      req.user.userId,
      parseInt(id, 10),
    );
    return result;
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('sync')
  async syncPaymentMethods(@Request() req: any) {
    const paymentMethods = await this.paymentMethodsService.syncFromStripe(
      req.user.userId,
    );
    return { success: true, data: paymentMethods };
  }

  // ============ SETUP INTENT ENDPOINT (For Frontend) ============

  @UseGuards(AuthGuard('jwt'))
  @Post('setup-intent')
  async createSetupIntent(@Request() req: any) {
    const setupIntent = await this.paymentMethodsService.createSetupIntent(
      req.user.userId,
    );
    return { data: setupIntent };
  }
}
