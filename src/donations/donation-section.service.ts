import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DonationSection } from './entities/donation-section.entity';
import { CreateDonationSectionDto, UpdateDonationSectionDto } from './dto/donation-section.dto';

@Injectable()
export class DonationSectionService {
    private readonly logger = new Logger(DonationSectionService.name);

    constructor(
        @InjectRepository(DonationSection)
        private donationSectionRepository: Repository<DonationSection>,
    ) {}

    async getOrCreateDefault(): Promise<DonationSection> {
        let section = await this.donationSectionRepository.findOne({
            where: {},
            order: { createdAt: 'DESC' },
        });

        if (!section) {
            // Create default section
            section = this.donationSectionRepository.create({
                title: 'Your Gift Saves Lives.',
                subtitle: 'Resource Mobilization',
                description: '100% of your donation goes directly to communities in need.',
                badgeText: 'Make a Difference',
                primaryColor: '#14b8a6',
                impactStats: [],
                impactItems: [
                    { id: '1', amount: '$10', label: 'Provides school supplies for 1 child', icon: 'Star' },
                    { id: '2', amount: '$25', label: 'Feeds a family for one week', icon: 'Heart' },
                    { id: '3', amount: '$50', label: 'Clean water access for a month', icon: 'Target' },
                    { id: '4', amount: '$100', label: 'Medical supplies for a clinic', icon: 'Users' },
                ],
                amountPresets: [
                    { value: 10 },
                    { value: 25 },
                    { value: 50 },
                    { value: 100, isDefault: true },
                    { value: 250 },
                    { value: 500 },
                ],
                donorCount: 1230,
                enableRecurring: true,
                enableCustomAmount: true,
                minAmount: 1,
                maxAmount: 10000,
                securityBadges: [
                    { id: '1', icon: 'ShieldCheck', text: 'SSL Encrypted', enabled: true },
                    { id: '2', icon: 'CheckCircle', text: 'Tax Deductible', enabled: true },
                ],
                thankYouMessage: 'Thank you for your generosity! Your donation will help us make a real difference.',
                receiptEnabled: true,
            });

            const saved = await this.donationSectionRepository.save(section);
            this.logger.log('Created default donation section');
            return saved;
        }

        return section;
    }

    async update(id: number, dto: UpdateDonationSectionDto): Promise<DonationSection> {
        const section = await this.donationSectionRepository.findOne({ where: { id } });
        if (!section) {
            throw new NotFoundException('Donation section not found');
        }

        Object.assign(section, dto);
        const saved = await this.donationSectionRepository.save(section);
        this.logger.log('Donation section updated');
        return saved;
    }

    async findAll(): Promise<DonationSection[]> {
        return this.donationSectionRepository.find({
            order: { createdAt: 'DESC' },
        });
    }
}
