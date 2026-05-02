import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TestimonialsService } from './testimonials.service';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  Roles,
  FULL_ADMIN_ROLES,
  EDITOR_ROLES,
} from '../common/decorators/roles.decorator';
import {
  CreateTestimonialDto,
  UpdateTestimonialDto,
  TestimonialQueryDto,
  ReorderTestimonialsDto,
} from './dto/testimonial.dto';

@Controller('testimonials')
export class TestimonialsController {
  private readonly logger = new Logger(TestimonialsController.name);

  constructor(private readonly testimonialsService: TestimonialsService) {}

  // Public routes
  @Get()
  async findAllPublic(@Query() query: TestimonialQueryDto) {
    return this.testimonialsService.findAllPublic(query);
  }

  @Get('featured')
  async findFeatured(@Query('limit') limit: number) {
    return this.testimonialsService.findAllPublic({
      isFeatured: true,
      limit: limit || 6,
    });
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.testimonialsService.findById(Number(id));
  }

  // Admin routes
  @Get('admin/all')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FULL_ADMIN_ROLES, ...EDITOR_ROLES)
  async findAllAdmin(@Query() query: TestimonialQueryDto) {
    return this.testimonialsService.findAllAdmin(query);
  }

  @Get('admin/stats')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FULL_ADMIN_ROLES)
  async getStats() {
    return this.testimonialsService.getStats();
  }

  @Post('admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FULL_ADMIN_ROLES, ...EDITOR_ROLES)
  async create(@Body() createDto: CreateTestimonialDto) {
    return this.testimonialsService.create(createDto);
  }

  @Patch('admin/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FULL_ADMIN_ROLES, ...EDITOR_ROLES)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTestimonialDto,
  ) {
    return this.testimonialsService.update(Number(id), updateDto);
  }

  @Delete('admin/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FULL_ADMIN_ROLES)
  async delete(@Param('id') id: string) {
    return this.testimonialsService.delete(Number(id));
  }

  @Post('admin/reorder')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FULL_ADMIN_ROLES, ...EDITOR_ROLES)
  async reorder(@Body() dto: ReorderTestimonialsDto) {
    return this.testimonialsService.reorder(dto);
  }
}
