import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Goal, GoalType } from './entities/goal.entity';

export interface CreateGoalDto {
    type: GoalType;
    title: string;
    target: number;
    color?: string;
    reward?: string;
    deadline?: Date;
    causeId?: number;
}

export interface UpdateGoalDto {
    title?: string;
    target?: number;
    color?: string;
    reward?: string;
    deadline?: Date;
    isActive?: boolean;
}

@Injectable()
export class GoalsService {
    constructor(
        @InjectRepository(Goal)
        private goalRepository: Repository<Goal>,
    ) {}

    async createGoal(userId: number, dto: CreateGoalDto): Promise<Goal> {
        const goal = this.goalRepository.create({
            ...dto,
            userId,
            current: 0,
            isActive: true,
        });
        return this.goalRepository.save(goal);
    }

    async findUserGoals(userId: number): Promise<Goal[]> {
        return this.goalRepository.find({
            where: { userId, isActive: true },
            order: { createdAt: 'DESC' },
        });
    }

    async findOneGoal(id: number, userId: number): Promise<Goal> {
        const goal = await this.goalRepository.findOne({
            where: { id, userId },
        });

        if (!goal) {
            throw new NotFoundException(`Goal with id ${id} not found`);
        }

        return goal;
    }

    async updateGoal(id: number, userId: number, dto: UpdateGoalDto): Promise<Goal> {
        const goal = await this.findOneGoal(id, userId);
        Object.assign(goal, dto);
        return this.goalRepository.save(goal);
    }

    async deleteGoal(id: number, userId: number): Promise<{ success: boolean }> {
        const goal = await this.findOneGoal(id, userId);
        await this.goalRepository.remove(goal);
        return { success: true };
    }

    async updateGoalProgress(userId: number, type: GoalType, amount: number): Promise<void> {
        const goals = await this.goalRepository.find({
            where: { userId, type, isActive: true },
        });

        for (const goal of goals) {
            goal.current = parseFloat(goal.current.toString()) + amount;
            await this.goalRepository.save(goal);
        }
    }

    async getGoalStats(userId: number): Promise<{
        totalGoals: number;
        completedGoals: number;
        totalTarget: number;
        totalCurrent: number;
    }> {
        const goals = await this.goalRepository.find({
            where: { userId, isActive: true },
        });

        const totalGoals = goals.length;
        const completedGoals = goals.filter(g => parseFloat(g.current.toString()) >= parseFloat(g.target.toString())).length;
        const totalTarget = goals.reduce((sum, g) => sum + parseFloat(g.target.toString()), 0);
        const totalCurrent = goals.reduce((sum, g) => sum + parseFloat(g.current.toString()), 0);

        return {
            totalGoals,
            completedGoals,
            totalTarget,
            totalCurrent,
        };
    }

    async getOrCreateDefaultGoals(userId: number): Promise<Goal[]> {
        const existingGoals = await this.findUserGoals(userId);

        if (existingGoals.length > 0) {
            return existingGoals;
        }

        // Create default goals for new users
        const defaultGoals: CreateGoalDto[] = [
            {
                type: 'monthly',
                title: 'Monthly Giving Goal',
                target: 500,
                color: '#14b8a6',
                reward: 'Supporter Badge',
            },
            {
                type: 'yearly',
                title: 'Annual Impact Goal',
                target: 5000,
                color: '#f59e0b',
                reward: 'Champion Status',
            },
            {
                type: 'lifetime',
                title: 'Lifetime Milestone',
                target: 10000,
                color: '#8b5cf6',
                reward: 'Legacy Donor',
            },
        ];

        const createdGoals: Goal[] = [];
        for (const goalDto of defaultGoals) {
            const goal = await this.createGoal(userId, goalDto);
            createdGoals.push(goal);
        }

        return createdGoals;
    }

    async getAggregatedGoals(): Promise<{
        monthlyDonationGoal: number;
        currentMonthDonations: number;
        causesSupportedGoal: number;
        causesSupported: number;
        volunteerHoursGoal: number;
        volunteerHours: number;
    }> {
        const allGoals = await this.goalRepository.find({
            where: { isActive: true },
            relations: ['cause'],
        });

        // Calculate monthly donation goal and current progress
        const monthlyGoals = allGoals.filter(g => g.type === 'monthly');
        const monthlyDonationGoal = monthlyGoals.reduce((sum, g) => sum + parseFloat(g.target.toString()), 0);
        const currentMonthDonations = monthlyGoals.reduce((sum, g) => sum + parseFloat(g.current.toString()), 0);

        // Count unique causes supported
        const causesWithGoals = new Set(allGoals.filter(g => g.causeId).map(g => g.causeId));
        const causesSupported = causesWithGoals.size;
        const causesSupportedGoal = 10; // Target to support 10 causes

        // Volunteer hours from goals
        const volunteerGoals = allGoals.filter(g => g.title.toLowerCase().includes('volunteer') || g.title.toLowerCase().includes('hour'));
        const volunteerHoursGoal = volunteerGoals.reduce((sum, g) => sum + parseFloat(g.target.toString()), 0);
        const volunteerHours = volunteerGoals.reduce((sum, g) => sum + parseFloat(g.current.toString()), 0);

        return {
            monthlyDonationGoal: monthlyDonationGoal || 100,
            currentMonthDonations: currentMonthDonations || 0,
            causesSupportedGoal,
            causesSupported,
            volunteerHoursGoal: volunteerHoursGoal || 10,
            volunteerHours: volunteerHours || 0,
        };
    }
}
