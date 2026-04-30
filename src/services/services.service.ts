import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Service } from './entities/service.entity';
import { ServiceCategory } from './entities/service-category.entity';
import { ServiceInquiry } from './entities/service-inquiry.entity';
import {
  CreateServiceDto,
  UpdateServiceDto,
  ServiceQueryDto,
  BulkServiceStatusDto,
  CreateServiceCategoryDto,
  UpdateServiceCategoryDto,
  ServiceCategoryQueryDto,
  CreateServiceInquiryDto,
  UpdateServiceInquiryDto,
  ServiceInquiryQueryDto,
  BulkInquiryStatusDto,
  ReorderServicesDto,
  ReorderCategoriesDto,
  BulkCreateServicesDto,
} from './dto/services.dto';

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);

  constructor(
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    @InjectRepository(ServiceCategory)
    private categoryRepository: Repository<ServiceCategory>,
    @InjectRepository(ServiceInquiry)
    private inquiryRepository: Repository<ServiceInquiry>,
  ) {}

  // ============ SERVICE CATEGORIES ============

  async createCategory(
    dto: CreateServiceCategoryDto,
  ): Promise<ServiceCategory> {
    const slug = dto.slug || this.generateSlug(dto.name);

    const existing = await this.categoryRepository.findOne({
      where: { slug },
    });

    if (existing) {
      throw new BadRequestException(
        `Category with slug '${slug}' already exists`,
      );
    }

    const category = this.categoryRepository.create({
      ...dto,
      slug,
      status: dto.status || 'active',
      order: dto.order || 0,
    });

    const saved = await this.categoryRepository.save(category);
    this.logger.log(
      `Service category created: ${saved.name} (id: ${saved.id})`,
    );

    return saved;
  }

  async findAllCategories(query: ServiceCategoryQueryDto) {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = 'order',
      sortOrder = 'ASC',
    } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.categoryRepository.createQueryBuilder('category');

    if (status && status !== 'all') {
      queryBuilder.andWhere('category.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere(
        '(category.name ILIKE :search OR category.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder.orderBy(`category.${sortBy}`, sortOrder);
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findActiveCategories(): Promise<ServiceCategory[]> {
    return this.categoryRepository.find({
      where: { status: 'active' },
      order: { order: 'ASC' },
    });
  }

  async findOneCategory(id: number): Promise<ServiceCategory> {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    return category;
  }

  async updateCategory(
    id: number,
    dto: UpdateServiceCategoryDto,
  ): Promise<ServiceCategory> {
    const category = await this.findOneCategory(id);

    if (dto.slug && dto.slug !== category.slug) {
      const existing = await this.categoryRepository.findOne({
        where: { slug: dto.slug },
      });
      if (existing) {
        throw new BadRequestException(
          `Category with slug '${dto.slug}' already exists`,
        );
      }
    }

    Object.assign(category, dto);
    const saved = await this.categoryRepository.save(category);
    this.logger.log(`Category updated: ${saved.name} (id: ${saved.id})`);

    return saved;
  }

  async removeCategory(id: number): Promise<{ success: boolean }> {
    const category = await this.findOneCategory(id);

    // Check if any services are using this category
    const servicesCount = await this.serviceRepository.count({
      where: { categoryId: id },
    });

    if (servicesCount > 0) {
      throw new BadRequestException(
        `Cannot delete category. ${servicesCount} services are using this category.`,
      );
    }

    await this.categoryRepository.remove(category);
    this.logger.log(`Category deleted: ${category.name} (id: ${id})`);

    return { success: true };
  }

  async reorderCategories(
    dto: ReorderCategoriesDto,
  ): Promise<{ success: boolean }> {
    for (const item of dto.orders) {
      await this.categoryRepository.update(item.id, { order: item.order });
    }
    this.logger.log(`Categories reordered`);
    return { success: true };
  }

  // ============ SERVICES ============

  async createService(dto: CreateServiceDto): Promise<Service> {
    const slug = dto.slug || this.generateSlug(dto.title);

    const existingSlug = await this.serviceRepository.findOne({
      where: { slug },
    });

    if (existingSlug) {
      throw new BadRequestException(
        `Service with slug '${slug}' already exists`,
      );
    }

    // Validate category if provided
    if (dto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException(
          `Category with id ${dto.categoryId} not found`,
        );
      }
    }

    const service = this.serviceRepository.create({
      ...dto,
      slug,
      status: dto.status || 'active',
      order: dto.order || 0,
      isFeatured: dto.isFeatured || false,
      views: 0,
      inquiryCount: 0,
    });

    const saved = await this.serviceRepository.save(service);
    this.logger.log(`Service created: ${saved.title} (id: ${saved.id})`);

    return this.findOneService(saved.id);
  }

  async bulkCreateServices(dto: BulkCreateServicesDto): Promise<{ count: number; failed: number; errors: { title: string; error: string }[] }> {
    const results = { count: 0, failed: 0, errors: [] as { title: string; error: string }[] };

    for (const item of dto.items) {
      try {
        await this.createService(item);
        results.count++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          title: item.title || 'Unknown',
          error: error.message || 'Failed to create service',
        });
      }
    }

    this.logger.log(`Bulk created ${results.count} services, ${results.failed} failed`);
    return results;
  }

  async findAllServices(query: ServiceQueryDto) {
    const {
      page = 1,
      limit = 10,
      status,
      categoryId,
      isFeatured,
      search,
      sortBy = 'order',
      sortOrder = 'ASC',
    } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.serviceRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.category', 'category');

    // Apply filters
    if (status && status !== 'all') {
      queryBuilder.andWhere('service.status = :status', { status });
    }

    if (categoryId) {
      queryBuilder.andWhere('service.categoryId = :categoryId', { categoryId });
    }

    if (isFeatured !== undefined) {
      queryBuilder.andWhere('service.isFeatured = :isFeatured', { isFeatured });
    }

    if (search) {
      queryBuilder.andWhere(
        '(service.title ILIKE :search OR service.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Apply sorting
    queryBuilder.orderBy(`service.${sortBy}`, sortOrder);

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findPublicServices(query: {
    limit?: number;
    categoryId?: number;
    isFeatured?: boolean;
  }) {
    const { limit = 10, categoryId, isFeatured } = query;

    const queryBuilder = this.serviceRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.category', 'category')
      .where('service.status = :status', { status: 'active' });

    if (categoryId) {
      queryBuilder.andWhere('service.categoryId = :categoryId', { categoryId });
    }

    if (isFeatured) {
      queryBuilder.andWhere('service.isFeatured = :isFeatured', {
        isFeatured: true,
      });
    }

    queryBuilder.orderBy('service.order', 'ASC').take(limit);

    return queryBuilder.getMany();
  }

  async findOneService(id: number): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!service) {
      throw new NotFoundException(`Service with id ${id} not found`);
    }

    return service;
  }

  async findBySlug(slug: string): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: { slug },
      relations: ['category'],
    });

    if (!service) {
      throw new NotFoundException(`Service with slug '${slug}' not found`);
    }

    // Increment views
    await this.serviceRepository.increment({ id: service.id }, 'views', 1);

    return service;
  }

  async updateService(id: number, dto: UpdateServiceDto): Promise<Service> {
    const service = await this.findOneService(id);

    // Check for duplicate slug if being changed
    if (dto.slug && dto.slug !== service.slug) {
      const existing = await this.serviceRepository.findOne({
        where: { slug: dto.slug },
      });
      if (existing) {
        throw new BadRequestException(
          `Service with slug '${dto.slug}' already exists`,
        );
      }
    }

    // Validate category if being changed
    if (dto.categoryId !== undefined && dto.categoryId !== null) {
      const category = await this.categoryRepository.findOne({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException(
          `Category with id ${dto.categoryId} not found`,
        );
      }
    }

    Object.assign(service, dto);

    const saved = await this.serviceRepository.save(service);
    this.logger.log(`Service updated: ${saved.title} (id: ${saved.id})`);

    return this.findOneService(saved.id);
  }

  async removeService(id: number): Promise<{ success: boolean }> {
    const service = await this.findOneService(id);
    await this.serviceRepository.remove(service);
    this.logger.log(`Service deleted: ${service.title} (id: ${id})`);

    return { success: true };
  }

  async bulkUpdateStatus(
    dto: BulkServiceStatusDto,
  ): Promise<{ success: boolean; count: number }> {
    const result = await this.serviceRepository.update(
      { id: In(dto.ids) },
      { status: dto.status },
    );

    this.logger.log(
      `Bulk status update: ${result.affected} services set to ${dto.status}`,
    );

    return { success: true, count: result.affected || 0 };
  }

  async reorderServices(
    dto: ReorderServicesDto,
  ): Promise<{ success: boolean }> {
    for (const item of dto.orders) {
      await this.serviceRepository.update(item.id, { order: item.order });
    }
    this.logger.log(`Services reordered`);
    return { success: true };
  }

  async getServiceStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    draft: number;
    featured: number;
    totalInquiries: number;
    totalViews: number;
  }> {
    const [total, active, inactive, draft, featured, inquiries, views] =
      await Promise.all([
        this.serviceRepository.count(),
        this.serviceRepository.count({ where: { status: 'active' } }),
        this.serviceRepository.count({ where: { status: 'inactive' } }),
        this.serviceRepository.count({ where: { status: 'draft' } }),
        this.serviceRepository.count({ where: { isFeatured: true } }),
        this.inquiryRepository.count(),
        this.serviceRepository
          .createQueryBuilder('service')
          .select('SUM(service.views)', 'total')
          .getRawOne(),
      ]);

    return {
      total,
      active,
      inactive,
      draft,
      featured,
      totalInquiries: inquiries,
      totalViews: parseInt(views?.total || '0', 10),
    };
  }

  async exportServices(format: 'csv' | 'json', query: ServiceQueryDto) {
    const { data } = await this.findAllServices({ ...query, limit: 10000 });

    if (format === 'json') {
      return data;
    }

    // CSV format
    const headers = [
      'ID',
      'Title',
      'Slug',
      'Status',
      'Category',
      'Featured',
      'Views',
      'Inquiries',
      'Created At',
    ];

    const rows = data.map((service) => [
      service.id,
      `"${(service.title || '').replace(/"/g, '""')}"`,
      service.slug,
      service.status,
      service.category?.name || '',
      service.isFeatured ? 'Yes' : 'No',
      service.views || 0,
      service.inquiryCount || 0,
      service.createdAt?.toISOString() || '',
    ]);

    return {
      headers: headers.join(','),
      rows: rows.map((row) => row.join(',')),
    };
  }

  // ============ SERVICE INQUIRIES ============

  async createInquiry(dto: CreateServiceInquiryDto): Promise<ServiceInquiry> {
    const service = await this.findOneService(dto.serviceId);

    const inquiry = this.inquiryRepository.create({
      ...dto,
      status: 'pending',
    });

    const saved = await this.inquiryRepository.save(inquiry);

    // Update inquiry count
    await this.serviceRepository.increment(
      { id: dto.serviceId },
      'inquiryCount',
      1,
    );

    this.logger.log(
      `Inquiry created for service ${dto.serviceId}: ${saved.name}`,
    );

    return saved;
  }

  async findAllInquiries(query: ServiceInquiryQueryDto) {
    const {
      page = 1,
      limit = 10,
      serviceId,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.inquiryRepository
      .createQueryBuilder('inquiry')
      .leftJoinAndSelect('inquiry.service', 'service');

    if (serviceId) {
      queryBuilder.andWhere('inquiry.serviceId = :serviceId', { serviceId });
    }

    if (status && status !== 'all') {
      queryBuilder.andWhere('inquiry.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere(
        '(inquiry.name ILIKE :search OR inquiry.email ILIKE :search OR inquiry.organization ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder.orderBy(`inquiry.${sortBy}`, sortOrder);
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOneInquiry(id: number): Promise<ServiceInquiry> {
    const inquiry = await this.inquiryRepository.findOne({
      where: { id },
      relations: ['service'],
    });

    if (!inquiry) {
      throw new NotFoundException(`Inquiry with id ${id} not found`);
    }

    return inquiry;
  }

  async updateInquiry(
    id: number,
    dto: UpdateServiceInquiryDto,
  ): Promise<ServiceInquiry> {
    const inquiry = await this.findOneInquiry(id);

    Object.assign(inquiry, dto);

    const saved = await this.inquiryRepository.save(inquiry);
    this.logger.log(`Inquiry updated: ${saved.id}`);

    return saved;
  }

  async bulkUpdateInquiryStatus(
    dto: BulkInquiryStatusDto,
  ): Promise<{ success: boolean; count: number }> {
    const result = await this.inquiryRepository.update(
      { id: In(dto.ids) },
      { status: dto.status },
    );

    this.logger.log(
      `Bulk inquiry status update: ${result.affected} inquiries set to ${dto.status}`,
    );

    return { success: true, count: result.affected || 0 };
  }

  async exportInquiries(serviceId: number | undefined, format: 'csv' | 'json') {
    const { data } = await this.findAllInquiries({ serviceId, limit: 10000 });

    if (format === 'json') {
      return data;
    }

    // CSV format
    const headers = [
      'ID',
      'Name',
      'Email',
      'Phone',
      'Organization',
      'Message',
      'Status',
      'Service',
      'Created At',
    ];

    const rows = data.map((inquiry) => [
      inquiry.id,
      `"${(inquiry.name || '').replace(/"/g, '""')}"`,
      inquiry.email,
      inquiry.phone || '',
      `"${(inquiry.organization || '').replace(/"/g, '""')}"`,
      `"${(inquiry.message || '').replace(/"/g, '""')}"`,
      inquiry.status,
      `"${(inquiry.service?.title || '').replace(/"/g, '""')}"`,
      inquiry.createdAt?.toISOString() || '',
    ]);

    return {
      headers: headers.join(','),
      rows: rows.map((row) => row.join(',')),
    };
  }

  // ============ HELPERS ============

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
