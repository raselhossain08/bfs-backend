import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import {
  CreateAdminDto,
  UpdateAdminDto,
  UpdateRoleDto,
  UpdateStatusDto,
  AdminListQueryDto,
  UserRole,
} from './admin.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit-log.entity';
import { Request } from 'express';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  private readonly adminRoles = [
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.EDITOR,
    UserRole.MANAGER,
  ];

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly auditService: AuditService,
    private readonly dataSource: DataSource,
  ) {}

  private sanitizeUser(user: User) {
    const {
      password,
      resetToken,
      resetTokenExpiry,
      refreshToken,
      otpLoginCode,
      otpLoginExpiry,
      otpAttemptsResetAt,
      twoFactorSecret,
      twoFactorBackupCodes,
      ...safe
    } = user;
    return safe;
  }

  async findAll(query?: AdminListQueryDto): Promise<any[]> {
    if (query?.search) {
      const searchTerm = `%${query.search}%`;
      const where: any = {};
      if (query?.role) {
        where.role = query.role;
      }
      if (query?.status) {
        where.status = query.status;
      }
      return this.usersRepository
        .find({
          where: [
            { ...where, firstName: Like(searchTerm) },
            { ...where, lastName: Like(searchTerm) },
            { ...where, email: Like(searchTerm) },
          ],
          order: { createdAt: 'DESC' },
        })
        .then((users) => users.map((u) => this.sanitizeUser(u)));
    }

    const where: any = {};
    if (query?.role) {
      where.role = query.role;
    }
    if (query?.status) {
      where.status = query.status;
    }

    return this.usersRepository
      .find({
        where,
        order: { createdAt: 'DESC' },
      })
      .then((users) => users.map((u) => this.sanitizeUser(u)));
  }

  async findOne(id: number): Promise<any> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.sanitizeUser(user);
  }

  async create(
    dto: CreateAdminDto,
    actorId: number,
    request?: Request,
  ): Promise<any> {
    // Check if email already exists
    const existing = await this.usersRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new BadRequestException(
        'An account with this email already exists',
      );
    }

    // Validate role is an admin role
    if (!this.adminRoles.includes(dto.role as any)) {
      throw new BadRequestException('Invalid admin role');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Generate avatar URL if not provided
    const fullName = `${dto.firstName} ${dto.lastName}`;
    const avatar =
      dto.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=e11d48&color=fff&bold=true`;

    const user = this.usersRepository.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      password: hashedPassword,
      phone: dto.phone,
      role: dto.role,
      avatar,
      status: 'active',
    });

    const savedUser = await this.usersRepository.save(user);
    this.logger.log(`Admin user created: ${dto.email} with role ${dto.role}`);

    // Audit log
    await this.auditService.log({
      action: AuditAction.USER_CREATE,
      entityType: 'user',
      entityId: savedUser.id,
      actorId,
      newValues: {
        email: savedUser.email,
        role: savedUser.role,
        status: savedUser.status,
      },
      description: `Created admin user ${savedUser.email} with role ${savedUser.role}`,
      request,
    });

    // Return without password
    return this.sanitizeUser(savedUser);
  }

  async update(
    id: number,
    dto: UpdateAdminDto,
    actorId: number,
    request?: Request,
  ): Promise<any> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Store old values for audit
    const oldValues = { ...user };

    // Check email uniqueness if changing
    if (dto.email && dto.email !== user.email) {
      const existing = await this.usersRepository.findOne({
        where: { email: dto.email },
      });
      if (existing) {
        throw new BadRequestException(
          'An account with this email already exists',
        );
      }
    }

    // Validate role if changing
    if (dto.role && !this.adminRoles.includes(dto.role as any)) {
      throw new BadRequestException('Invalid admin role');
    }

    // Hash password if provided
    let hashedPassword: string | undefined;
    if (dto.password) {
      hashedPassword = await bcrypt.hash(dto.password, 10);
    }

    // Update fields
    if (dto.firstName !== undefined) user.firstName = dto.firstName;
    if (dto.lastName !== undefined) user.lastName = dto.lastName;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.role !== undefined) user.role = dto.role;
    if (hashedPassword) user.password = hashedPassword;
    if (dto.avatar !== undefined) user.avatar = dto.avatar;

    // Update avatar if name changed
    if (dto.firstName || dto.lastName) {
      const fullName = `${user.firstName} ${user.lastName}`;
      user.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=e11d48&color=fff&bold=true`;
    }

    const savedUser = await this.usersRepository.save(user);
    this.logger.log(`Admin user updated: ${user.email}`);

    // Audit log
    await this.auditService.log({
      action: AuditAction.USER_UPDATE,
      entityType: 'user',
      entityId: savedUser.id,
      actorId,
      oldValues: {
        firstName: oldValues.firstName,
        lastName: oldValues.lastName,
        email: oldValues.email,
        role: oldValues.role,
      },
      newValues: {
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        email: savedUser.email,
        role: savedUser.role,
      },
      description: `Updated admin user ${savedUser.email}`,
      request,
    });

    return this.sanitizeUser(savedUser);
  }

  async updateRole(
    id: number,
    dto: UpdateRoleDto,
    actorId: number,
    request?: Request,
  ): Promise<any> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const oldRole = user.role;

    // Validate role is an admin role
    if (!this.adminRoles.includes(dto.role as any)) {
      throw new BadRequestException('Invalid admin role');
    }

    user.role = dto.role;
    const savedUser = await this.usersRepository.save(user);
    this.logger.log(`Admin role updated: ${user.email} -> ${dto.role}`);

    // Audit log
    await this.auditService.log({
      action: AuditAction.USER_ROLE_CHANGE,
      entityType: 'user',
      entityId: savedUser.id,
      actorId,
      oldValues: { role: oldRole },
      newValues: { role: dto.role },
      description: `Changed role from ${oldRole} to ${dto.role} for ${savedUser.email}`,
      request,
    });

    return this.sanitizeUser(savedUser);
  }

  async updateStatus(
    id: number,
    dto: UpdateStatusDto,
    actorId: number,
    request?: Request,
  ): Promise<any> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const oldStatus = user.status;

    user.status = dto.status;
    const savedUser = await this.usersRepository.save(user);
    this.logger.log(`Admin status updated: ${user.email} -> ${dto.status}`);

    // Audit log
    await this.auditService.log({
      action: AuditAction.USER_STATUS_CHANGE,
      entityType: 'user',
      entityId: savedUser.id,
      actorId,
      oldValues: { status: oldStatus },
      newValues: { status: dto.status },
      description: `Changed status from ${oldStatus} to ${dto.status} for ${savedUser.email}`,
      request,
    });

    return this.sanitizeUser(savedUser);
  }

  async remove(
    id: number,
    actorId: number,
    request?: Request,
  ): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userEmail = user.email;

    await this.usersRepository.remove(user);
    this.logger.log(`Admin user removed: ${userEmail}`);

    // Audit log
    await this.auditService.log({
      action: AuditAction.USER_DELETE,
      entityType: 'user',
      entityId: id,
      actorId,
      oldValues: { email: userEmail },
      description: `Deleted admin user ${userEmail}`,
      request,
    });

    return { message: 'User access removed successfully' };
  }

  // Bulk operations
  async bulkUpdateStatus(
    ids: number[],
    status: string,
    actorId: number,
    request?: Request,
  ): Promise<{ success: boolean; count: number }> {
    return await this.dataSource.transaction(async (manager) => {
      const users = await manager.find(User, { where: { id: In(ids) } });

      if (users.length === 0) {
        throw new NotFoundException('No users found');
      }

      await manager.update(User, { id: In(ids) }, { status });

      // Audit log
      await this.auditService.log({
        action: AuditAction.BULK_STATUS_CHANGE,
        entityType: 'user',
        entityId: 0,
        actorId,
        newValues: { ids, status },
        description: `Bulk status change to ${status} for ${ids.length} users`,
        request,
      });

      return { success: true, count: users.length };
    });
  }

  async bulkUpdateRole(
    ids: number[],
    role: string,
    actorId: number,
    request?: Request,
  ): Promise<{ success: boolean; count: number }> {
    if (!this.adminRoles.includes(role as any)) {
      throw new BadRequestException('Invalid admin role');
    }

    return await this.dataSource.transaction(async (manager) => {
      const users = await manager.find(User, { where: { id: In(ids) } });

      if (users.length === 0) {
        throw new NotFoundException('No users found');
      }

      // Prevent demoting super_admin unless actor is super_admin
      const superAdmins = users.filter(u => u.role === 'super_admin');
      if (superAdmins.length > 0 && role !== 'super_admin') {
        const actor = await manager.findOne(User, { where: { id: actorId } });
        if (!actor || actor.role !== 'super_admin') {
          throw new ForbiddenException('Only super_admin can change super_admin roles');
        }
      }

      await manager.update(User, { id: In(ids) }, { role });

      // Audit log
      await this.auditService.log({
        action: AuditAction.BULK_ROLE_CHANGE,
        entityType: 'user',
        entityId: 0,
        actorId,
        newValues: { ids, role },
        description: `Bulk role change to ${role} for ${ids.length} users`,
        request,
      });

      return { success: true, count: users.length };
    });
  }

  async bulkDelete(
    ids: number[],
    actorId: number,
    request?: Request,
  ): Promise<{ success: boolean; count: number }> {
    return await this.dataSource.transaction(async (manager) => {
      const users = await manager.find(User, { where: { id: In(ids) } });

      if (users.length === 0) {
        throw new NotFoundException('No users found');
      }

      // Prevent deleting super_admin unless actor is super_admin
      const superAdmins = users.filter(u => u.role === 'super_admin');
      if (superAdmins.length > 0) {
        const actor = await manager.findOne(User, { where: { id: actorId } });
        if (!actor || actor.role !== 'super_admin') {
          throw new ForbiddenException('Only super_admin can delete super_admin accounts');
        }
      }

      await manager.delete(User, { id: In(ids) });

      // Audit log
      await this.auditService.log({
        action: AuditAction.BULK_DELETE,
        entityType: 'user',
        entityId: 0,
        actorId,
        oldValues: { ids },
        description: `Bulk deleted ${ids.length} users`,
        request,
      });

      return { success: true, count: users.length };
    });
  }

  // Password reset
  async initiatePasswordReset(
    id: number,
    actorId: number,
    request?: Request,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate reset token
    const resetToken = bcrypt
      .genSaltSync(32)
      .replace(/[./]/g, '')
      .substring(0, 32);
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;

    await this.usersRepository.save(user);

    // Audit log
    await this.auditService.log({
      action: AuditAction.USER_PASSWORD_RESET,
      entityType: 'user',
      entityId: id,
      actorId,
      description: `Password reset initiated for ${user.email}`,
      request,
    });

    // In production, send email with reset link
    this.logger.log(
      `Password reset token generated for ${user.email}: ${resetToken}`,
    );

    return {
      success: true,
      message: 'Password reset email sent successfully',
    };
  }

  // Export users
  async exportUsers(
    format: 'csv' | 'json',
    actorId: number,
    request?: Request,
  ): Promise<{ data: User[]; format: string }> {
    // Enforce export limit to prevent performance issues
    const EXPORT_LIMIT = 10000;
    const users = await this.usersRepository.find({
      where: { role: In(this.adminRoles) },
      order: { createdAt: 'DESC' },
      take: EXPORT_LIMIT,
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'role',
        'status',
        'phone',
        'lastActive',
        'createdAt',
      ],
    });

    // Audit log
    await this.auditService.log({
      action: 'user_export' as any,
      entityType: 'user',
      entityId: 0,
      actorId,
      description: `Exported ${users.length} users as ${format.toUpperCase()} (limit: ${EXPORT_LIMIT})`,
      request,
    });

    return { data: users, format };
  }

  async updateLastActive(id: number): Promise<void> {
    await this.usersRepository.update(id, { lastActive: new Date() });
  }

  async getStats(): Promise<{
    total: number;
    superAdmins: number;
    admins: number;
    editors: number;
    managers: number;
    donors: number;
    active: number;
  }> {
    const [total, superAdmins, admins, editors, managers, donors, active] =
      await Promise.all([
        this.usersRepository.count(),
        this.usersRepository.count({ where: { role: UserRole.SUPER_ADMIN } }),
        this.usersRepository.count({ where: { role: UserRole.ADMIN } }),
        this.usersRepository.count({ where: { role: UserRole.EDITOR } }),
        this.usersRepository.count({ where: { role: UserRole.MANAGER } }),
        this.usersRepository.count({ where: { role: UserRole.USER } }),
        this.usersRepository.count({ where: { status: 'active' } }),
      ]);

    return { total, superAdmins, admins, editors, managers, donors, active };
  }
}
