import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
    ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GoalsService } from './goals.service';
import type { CreateGoalDto, UpdateGoalDto } from './goals.service';

@Controller('goals')
export class GoalsController {
    constructor(private readonly goalsService: GoalsService) {}

    // Public endpoint - returns aggregated goals data from all users
    @Get()
    async getGoals() {
        const stats = await this.goalsService.getAggregatedGoals();
        return { data: stats };
    }

    // Authenticated endpoint for user-specific goals
    @Get('user')
    @UseGuards(AuthGuard('jwt'))
    async getUserGoals(@Request() req: any) {
        const userId = req.user?.userId || req.user?.sub || req.user?.id;
        if (!userId) {
            return { data: [], message: 'User not authenticated' };
        }

        const goals = await this.goalsService.getOrCreateDefaultGoals(userId);
        return { data: goals };
    }

    @Get('stats')
    async getGoalStats(@Request() req: any) {
        const userId = req.user?.userId || req.user?.sub || req.user?.id;
        if (!userId) {
            return { data: null, message: 'User not authenticated' };
        }

        const stats = await this.goalsService.getGoalStats(userId);
        return { data: stats };
    }

    @Post()
    async createGoal(@Request() req: any, @Body() dto: CreateGoalDto) {
        const userId = req.user?.userId || req.user?.sub || req.user?.id;
        if (!userId) {
            return { data: null, message: 'User not authenticated' };
        }

        const goal = await this.goalsService.createGoal(userId, dto);
        return { data: goal };
    }

    @Put(':id')
    async updateGoal(
        @Request() req: any,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateGoalDto,
    ) {
        const userId = req.user?.userId || req.user?.sub || req.user?.id;
        if (!userId) {
            return { data: null, message: 'User not authenticated' };
        }

        const goal = await this.goalsService.updateGoal(id, userId, dto);
        return { data: goal };
    }

    @Delete(':id')
    async deleteGoal(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
        const userId = req.user?.userId || req.user?.sub || req.user?.id;
        if (!userId) {
            return { data: null, message: 'User not authenticated' };
        }

        const result = await this.goalsService.deleteGoal(id, userId);
        return { data: result };
    }
}
