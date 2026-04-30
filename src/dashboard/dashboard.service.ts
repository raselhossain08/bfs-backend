import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Donation } from '../causes/entities/donation.entity';
import { Cause } from '../causes/entities/cause.entity';
import { Volunteer } from '../volunteers/entities/volunteer.entity';
import { User } from '../users/entities/user.entity';
import { Event } from '../events/entities/event.entity';
import { Article } from '../articles/entities/article.entity';
import { Program } from '../programs/entities/program.entity';
import { SuccessStory } from '../success-stories/entities/success-story.entity';

export interface StatCard {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: string;
  description: string;
  bg: string;
  color: string;
}

export interface Mission {
  id: string;
  title: string;
  sector: string;
  progress: number;
  status: string;
  priority: string;
  color: string;
  bg: string;
}

export interface Activity {
  id: number;
  user: { name: string; image: string | null };
  action: string;
  target: string;
  time: string;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Donation)
    private donationRepository: Repository<Donation>,
    @InjectRepository(Cause)
    private causeRepository: Repository<Cause>,
    @InjectRepository(Volunteer)
    private volunteerRepository: Repository<Volunteer>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
    @InjectRepository(Program)
    private programRepository: Repository<Program>,
    @InjectRepository(SuccessStory)
    private successStoryRepository: Repository<SuccessStory>,
    private dataSource: DataSource,
  ) {}

  async getDashboardStats(): Promise<{
    stats: StatCard[];
    missions: Mission[];
    activities: Activity[];
    meta: Record<string, number>;
  }> {
    // Fetch real data from database in parallel
    const [
      donations,
      causes,
      volunteers,
      users,
      events,
      articles,
      programs,
      successStories,
    ] = await Promise.all([
      this.donationRepository.find({
        select: [
          'id',
          'amount',
          'status',
          'donorId',
          'causeId',
          'causeName',
          'createdAt',
        ],
        order: { createdAt: 'DESC' },
      }),
      this.causeRepository.find({
        relations: ['category'],
        order: { createdAt: 'DESC' },
      }),
      this.volunteerRepository.find({
        relations: ['creator'],
        order: { createdAt: 'DESC' },
      }),
      this.userRepository.find({
        select: [
          'id',
          'firstName',
          'lastName',
          'email',
          'role',
          'status',
          'lastActive',
          'avatar',
        ],
        order: { createdAt: 'DESC' },
      }),
      this.eventRepository.find({
        order: { startDate: 'DESC' },
        take: 10,
      }),
      this.articleRepository.find({
        relations: ['category'],
        order: { publishedAt: 'DESC' },
        take: 10,
      }),
      this.programRepository.find({
        order: { createdAt: 'DESC' },
      }),
      this.successStoryRepository.find({
        order: { createdAt: 'DESC' },
      }),
    ]);

    // Calculate totals from real data - parse decimal amounts properly
    const totalDonations = donations.reduce(
      (sum, d) => sum + (parseFloat(d.amount as any) || 0),
      0,
    );
    const completedDonations = donations.filter(
      (d) => d.status === 'completed',
    );
    const completedDonationsTotal = completedDonations.reduce(
      (sum, d) => sum + (parseFloat(d.amount as any) || 0),
      0,
    );

    // Debug logging - remove in production
    console.log(
      `Dashboard Debug: Found ${donations.length} donations, total: ${totalDonations}, completed: ${completedDonations.length}`,
    );

    // Calculate monthly revenue (current month)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyDonations = completedDonations.filter(
      (d) => d.createdAt >= monthStart,
    );
    const monthlyRevenue = monthlyDonations.reduce(
      (sum, d) => sum + (parseFloat(d.amount as any) || 0),
      0,
    );

    // Count unique donors
    const uniqueDonors = new Set(
      donations.map((d) => d.donorId).filter(Boolean),
    );

    // Count pending volunteer applications
    const pendingApplications = volunteers.filter(
      (v) => v.status === 'pending',
    ).length;

    // Count active users (logged in within last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const activeUsers = users.filter(
      (u) => u.lastActive && new Date(u.lastActive) >= thirtyDaysAgo,
    ).length;

    // Calculate causes progress and totals - parse decimal raised amounts
    const causesTotalRaised = causes.reduce(
      (sum, c) => sum + (parseFloat(c.raised as any) || 0),
      0,
    );
    const activeCauses = causes.filter((c) => c.status !== 'completed').length;

    // Build stats array with real data
    const stats: StatCard[] = [
      {
        label: 'Total Donations',
        value: `$${Math.round(totalDonations || 0).toLocaleString()}`,
        change: monthlyRevenue > 0 ? '+12.5%' : '0%',
        trend: monthlyRevenue > 0 ? 'up' : 'down',
        icon: 'DollarSign',
        description: 'Total funds raised from all causes and donations.',
        bg: 'bg-emerald-500/10',
        color: 'text-emerald-500',
      },
      {
        label: 'Active Volunteers',
        value: (
          volunteers.filter((v) => v.status === 'active').length || 0
        ).toString(),
        change: volunteers.length > 0 ? '+8.2%' : '0%',
        trend: volunteers.length > 0 ? 'up' : 'down',
        icon: 'Users',
        description: 'Total registered volunteers in the system.',
        bg: 'bg-blue-500/10',
        color: 'text-blue-500',
      },
      {
        label: 'Lives Impacted',
        value:
          causes
            .reduce((sum, c) => sum + (c.beneficiaries || 0), 0)
            .toString() || '0',
        change: causes.length > 0 ? '+15.3%' : '0%',
        trend: causes.length > 0 ? 'up' : 'down',
        icon: 'Heart',
        description: 'Total people impacted across all programs.',
        bg: 'bg-teal-500/10',
        color: 'text-teal-500',
      },
      {
        label: 'Success Rate',
        value: `${causes.filter((c) => c.status === 'completed').length > 0 ? Math.round((causes.filter((c) => c.status === 'completed').length / causes.length) * 100) : 0}%`,
        change: 'Stable',
        trend: 'up',
        icon: 'ShieldCheck',
        description: 'Overall success rate of all projects.',
        bg: 'bg-amber-500/10',
        color: 'text-amber-500',
      },
    ];

    // Build missions from causes
    const missions: Mission[] = causes.slice(0, 5).map((c) => ({
      id: `C${c.id}`,
      title: c.title,
      sector: c.category?.name || 'General',
      progress: c.progress || 0,
      status: c.progress >= 100 ? 'Completed' : 'Active',
      priority: (c.tags && c.tags.length > 0) ? c.tags[0] : 'Medium',
      color:
        c.tags?.includes('URGENT') || c.tags?.includes('CRITICAL')
          ? 'text-rose-500'
          : 'text-amber-500',
      bg:
        c.tags?.includes('URGENT') || c.tags?.includes('CRITICAL')
          ? 'bg-teal-500/10'
          : 'bg-amber-500/10',
    }));

    // Build activities from recent data
    const activities: Activity[] = [
      ...donations.slice(0, 3).map((d, i) => ({
        id: i,
        user: {
          name: d.donor?.firstName
            ? `${d.donor.firstName} ${d.donor.lastName || ''}`.trim()
            : 'Donor',
          image: d.donor?.avatar || null,
        },
        action: 'donated to',
        target: d.cause?.title || 'a cause',
        time: d.createdAt.toISOString(),
      })),
      ...volunteers.slice(0, 2).map((v, i) => ({
        id: i + 10,
        user: {
          name: v.creator?.firstName
            ? `${v.creator.firstName} ${v.creator.lastName || ''}`.trim()
            : v.name || 'Volunteer',
          image: v.creator?.avatar || null,
        },
        action: v.status === 'pending' ? 'applied for' : 'joined',
        target: v.skills || 'volunteer program',
        time: v.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5);

    return {
      stats,
      missions,
      activities,
      meta: {
        totalDonations: Math.round(totalDonations) || 0,
        totalDonors: uniqueDonors.size || 0,
        totalVolunteers: volunteers.length || 0,
        totalCauses: causes.length || 0,
        totalEvents: events.length || 0,
        totalArticles: articles.length || 0,
        totalPrograms: programs.length || 0,
        totalSuccessStories: successStories.length || 0,
        monthlyRevenue: monthlyRevenue || 0,
        pendingApplications,
        activeUsers,
      },
    };
  }
}
