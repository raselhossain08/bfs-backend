import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Testimonial, TestimonialStatus } from './entities/testimonial.entity';
import {
  CreateTestimonialDto,
  UpdateTestimonialDto,
  TestimonialQueryDto,
  ReorderTestimonialsDto,
} from './dto/testimonial.dto';

@Injectable()
export class TestimonialsService {
  private readonly logger = new Logger(TestimonialsService.name);

  constructor(
    @InjectRepository(Testimonial)
    private readonly testimonialRepository: Repository<Testimonial>,
  ) {}

  async findAllPublic(query: TestimonialQueryDto) {
    const where: any = { status: TestimonialStatus.ACTIVE };

    if (query.isFeatured !== undefined) {
      where.isFeatured = query.isFeatured === true;
    }

    const limit = query.limit ? Number(query.limit) : 10;
    const page = query.page ? Number(query.page) : 1;
    const skip = (page - 1) * limit;

    const [data, total] = await this.testimonialRepository.findAndCount({
      where,
      order: { order: 'ASC', createdAt: 'DESC' },
      take: limit,
      skip,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAllAdmin(query: TestimonialQueryDto) {
    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.isFeatured !== undefined) {
      where.isFeatured = query.isFeatured === true;
    }

    const limit = query.limit ? Number(query.limit) : 20;
    const page = query.page ? Number(query.page) : 1;
    const skip = (page - 1) * limit;

    const [data, total] = await this.testimonialRepository.findAndCount({
      where,
      order: { order: 'ASC', createdAt: 'DESC' },
      take: limit,
      skip,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: number) {
    const testimonial = await this.testimonialRepository.findOne({
      where: { id },
    });

    if (!testimonial) {
      throw new NotFoundException('Testimonial not found');
    }

    return testimonial;
  }

  async create(createDto: CreateTestimonialDto) {
    const testimonial = this.testimonialRepository.create(createDto);
    return this.testimonialRepository.save(testimonial);
  }

  async update(id: number, updateDto: UpdateTestimonialDto) {
    const testimonial = await this.findById(id);
    Object.assign(testimonial, updateDto);
    return this.testimonialRepository.save(testimonial);
  }

  async delete(id: number) {
    const testimonial = await this.findById(id);
    await this.testimonialRepository.remove(testimonial);
    return { success: true, message: 'Testimonial deleted successfully' };
  }

  async reorder(dto: ReorderTestimonialsDto) {
    const { ids } = dto;

    for (let i = 0; i < ids.length; i++) {
      await this.testimonialRepository.update(ids[i], { order: i });
    }

    return { success: true, message: 'Testimonials reordered successfully' };
  }

  async getStats() {
    const total = await this.testimonialRepository.count();
    const active = await this.testimonialRepository.count({
      where: { status: TestimonialStatus.ACTIVE },
    });
    const inactive = await this.testimonialRepository.count({
      where: { status: TestimonialStatus.INACTIVE },
    });
    const featured = await this.testimonialRepository.count({
      where: { isFeatured: true },
    });

    return {
      total,
      active,
      inactive,
      featured,
    };
  }
}
