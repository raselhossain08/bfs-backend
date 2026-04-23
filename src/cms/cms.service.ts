import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CmsItem } from './entities/cms-item.entity';

@Injectable()
export class CmsService implements OnModuleInit {
    constructor(
        @InjectRepository(CmsItem)
        private cmsRepository: Repository<CmsItem>,
    ) { }

    onModuleInit() {
        // Data loading is now handled by seed.ts
    }

    async logActivity(action: string, target: string, userName: string = "Admin") {
        const activities = await this.getData('dashboard-activities') || [];
        const newActivity = {
            id: Date.now(),
            user: {
                name: userName,
                image: userName === "System" ? "https://i.pravatar.cc/100?img=33" : "https://i.pravatar.cc/100?img=1"
            },
            action,
            target,
            time: new Date().toISOString()
        };
        const updatedActivities = [newActivity, ...activities].slice(0, 20);
        await this.updateData('dashboard-activities', updatedActivities);
    }

    async getData(key: string) {
        const item = await this.cmsRepository.findOne({ where: { key } });
        return item ? item.data : null;
    }

    async updateData(key: string, newData: any) {
        let item = await this.cmsRepository.findOne({ where: { key } });
        if (!item) {
            item = this.cmsRepository.create({ key, data: newData });
        } else {
            item.data = newData;
        }
        await this.cmsRepository.save(item);

        // Don't log self
        if (key !== 'dashboard-activities') {
            await this.logActivity("Updated", key);
        }

        return item.data;
    }

    async addItem(key: string, dataItem: any) {
        let item = await this.cmsRepository.findOne({ where: { key } });

        if (!item) {
            item = this.cmsRepository.create({ key, data: [] });
        }

        if (Array.isArray(item.data)) {
            const newItem = {
                id: Date.now(),
                ...dataItem,
                createdAt: new Date().toISOString()
            };
            item.data.push(newItem);
            await this.cmsRepository.save(item);

            await this.logActivity("Added new record to", key);

            return newItem;
        }
        return null;
    }

    async deleteItem(key: string, itemId: number) {
        const item = await this.cmsRepository.findOne({ where: { key } });
        if (!item || !Array.isArray(item.data)) return null;

        const original = item.data.length;
        item.data = item.data.filter((d: any) => d.id !== itemId);
        if (item.data.length === original) return null;

        await this.cmsRepository.save(item);

        await this.logActivity("Deleted record from", key);

        return { deleted: true, remaining: item.data.length };
    }

    async getAllData() {
        const items = await this.cmsRepository.find();
        const result: any = {};
        for (const item of items) {
            result[item.key] = item.data;
        }
        return result;
    }

    async generateReport(params: { type: string; title: string; description?: string; startDate?: Date; endDate?: Date }) {
        const { type, title, description, startDate, endDate } = params;

        // Get data based on report type
        let data: any[] = [];
        let fields: string[] = [];
        let colorClass = 'bg-teal-500';

        switch (type) {
            case 'donations':
                data = await this.getData('donations') || [];
                fields = ['id', 'donorName', 'email', 'phone', 'amount', 'paymentMethod', 'campaignName', 'date', 'status'];
                colorClass = 'bg-emerald-500';
                break;
            case 'volunteers':
                data = await this.getData('volunteerApplications') || [];
                fields = ['id', 'name', 'email', 'phone', 'interest', 'location', 'skills', 'status', 'submittedAt'];
                colorClass = 'bg-blue-500';
                break;
            case 'events':
                data = await this.getData('eventRegistrations') || [];
                fields = ['id', 'name', 'email', 'phone', 'organization', 'eventTitle', 'status', 'submittedAt'];
                colorClass = 'bg-purple-500';
                break;
            case 'subscribers':
                data = await this.getData('subscribers') || [];
                fields = ['id', 'email', 'subscribedAt'];
                colorClass = 'bg-cyan-500';
                break;
            case 'contacts':
                data = await this.getData('contactMessages') || [];
                fields = ['id', 'name', 'email', 'service', 'message', 'status', 'submittedAt'];
                colorClass = 'bg-orange-500';
                break;
            case 'campaigns':
                data = await this.getData('causes') || [];
                fields = ['id', 'title', 'category', 'goal', 'raised', 'donors', 'progress', 'location'];
                colorClass = 'bg-pink-500';
                break;
            default:
                throw new Error(`Unknown report type: ${type}`);
        }

        // Filter by date range if provided
        if (startDate || endDate) {
            data = data.filter((item: any) => {
                const itemDate = new Date(item.date || item.submittedAt || item.createdAt);
                if (startDate && itemDate < startDate) return false;
                if (endDate && itemDate > endDate) return false;
                return true;
            });
        }

        // Generate CSV content
        const csvContent = this.generateCSV(data, fields);

        // Calculate size
        const sizeInKB = csvContent.length / 1024;
        const size = sizeInKB >= 1024
            ? `${(sizeInKB / 1024).toFixed(2)} MB`
            : `${sizeInKB.toFixed(1)} KB`;

        // Create report record
        const reportId = `R${Date.now()}`;
        const now = new Date();
        const newReport = {
            id: reportId,
            title,
            description: description || `${type.charAt(0).toUpperCase() + type.slice(1)} report generated on ${now.toLocaleDateString()}`,
            type: 'CSV',
            date: now.toISOString(),
            dateFormatted: this.formatDate(now),
            size,
            color: colorClass,
            status: 'completed',
            recordCount: data.length,
            filename: `${type}-report-${reportId}.csv`,
            csvContent,
            reportType: type,
        };

        // Save to reports
        const reports = await this.getData('reports') || [];
        const updatedReports = Array.isArray(reports)
            ? [newReport, ...reports]
            : [newReport];

        await this.updateData('reports', updatedReports);

        // Return without full CSV content for listing
        const { csvContent: _, ...reportMeta } = newReport;
        return reportMeta;
    }

    private generateCSV(data: any[], fields: string[]): string {
        if (!data || data.length === 0) {
            return fields.join(',') + '\n';
        }

        const headers = fields.join(',');
        const rows = data.map(item => {
            return fields.map(field => {
                const value = item[field];
                if (value === null || value === undefined) {
                    return '';
                }
                // Escape quotes and wrap in quotes if contains comma, quote, or newline
                const strValue = String(value).replace(/"/g, '""');
                if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
                    return `"${strValue}"`;
                }
                return strValue;
            }).join(',');
        });

        return [headers, ...rows].join('\n');
    }

    private formatDate(date: Date): string {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Generated today';
        if (diffDays === 1) return 'Generated yesterday';
        if (diffDays < 7) return `Generated ${diffDays} days ago`;
        if (diffDays < 30) return `Generated ${Math.floor(diffDays / 7)} weeks ago`;
        return `Generated on ${date.toLocaleDateString()}`;
    }
}
