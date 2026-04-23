import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async findOne(email: string): Promise<User | null> {
        return this.usersRepository
            .createQueryBuilder('user')
            .where('user.email = :email', { email })
            .addSelect('user.password')
            .addSelect('user.refreshToken')
            .addSelect('user.resetToken')
            .addSelect('user.resetTokenExpiry')
            .addSelect('user.twoFactorSecret')
            .addSelect('user.twoFactorBackupCodes')
            .addSelect('user.otpLoginCode')
            .addSelect('user.otpLoginExpiry')
            .addSelect('user.otpAttempts')
            .addSelect('user.otpAttemptsResetAt')
            .addSelect('user.allowOtpLogin')
            .getOne();
    }

    async findById(id: number): Promise<User | null> {
        return this.usersRepository.findOne({ where: { id } });
    }

    async findByResetToken(token: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { resetToken: token } });
    }

    async create(user: Partial<User>): Promise<User> {
        const newUser = this.usersRepository.create(user);
        return this.usersRepository.save(newUser);
    }

    async update(id: number, data: Partial<User>): Promise<User | null> {
        await this.usersRepository.update(id, data);
        return this.usersRepository.findOne({ where: { id } });
    }

    async changePassword(userId: number, dto: ChangePasswordDto): Promise<{ success: boolean; message: string }> {
        // Get user with password
        const user = await this.usersRepository
            .createQueryBuilder('user')
            .where('user.id = :id', { id: userId })
            .addSelect('user.password')
            .getOne();

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        if (!user.password) {
            throw new BadRequestException('Cannot change password for OAuth accounts');
        }

        // Verify current password
        const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
        if (!isMatch) {
            throw new UnauthorizedException('Current password is incorrect');
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(dto.newPassword, 12);

        // Update password
        await this.usersRepository.update(userId, { password: hashedPassword });

        return { success: true, message: 'Password changed successfully' };
    }
}
