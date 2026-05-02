import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Comment } from './entities/comment.entity';
import {
  CreateCommentDto,
  UpdateCommentDto,
  ReplyCommentDto,
  BulkCommentStatusDto,
  CommentQueryDto,
} from './dto/comment.dto';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
  ) {}

  async create(dto: CreateCommentDto): Promise<Comment> {
    const comment = this.commentRepository.create({
      ...dto,
      status: 'pending',
      likes: 0,
    });

    const saved = await this.commentRepository.save(comment);
    this.logger.log(`Comment created: ${saved.id} by ${saved.name}`);
    return saved;
  }

  async findAll(query: CommentQueryDto) {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.text = Like(`%${search}%`);
    }

    const [data, total] = await this.commentRepository.findAndCount({
      where,
      order: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByArticleSlug(slug: string) {
    // Get all approved comments for this article
    const allComments = await this.commentRepository.find({
      where: { articleSlug: slug, status: 'approved' },
      order: { createdAt: 'ASC' },
      relations: ['children'],
    });

    // Build tree structure
    return this.buildCommentTree(allComments);
  }

  private buildCommentTree(comments: Comment[]): Comment[] {
    const commentMap = new Map<number, Comment & { children?: Comment[] }>();
    const rootComments: (Comment & { children?: Comment[] })[] = [];

    // Initialize map with all comments
    comments.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, children: [] });
    });

    // Build tree
    comments.forEach((comment) => {
      const commentWithChildren = commentMap.get(comment.id)!;
      if (comment.parentId && commentMap.has(comment.parentId)) {
        const parent = commentMap.get(comment.parentId)!;
        if (!parent.children) parent.children = [];
        parent.children.push(commentWithChildren);
      } else {
        rootComments.push(commentWithChildren);
      }
    });

    return rootComments;
  }

  async findById(id: number): Promise<Comment> {
    const comment = await this.commentRepository.findOne({ where: { id } });
    if (!comment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }
    return comment;
  }

  async update(id: number, dto: UpdateCommentDto): Promise<Comment> {
    const comment = await this.findById(id);
    Object.assign(comment, dto);
    return this.commentRepository.save(comment);
  }

  async reply(id: number, dto: ReplyCommentDto): Promise<Comment> {
    const comment = await this.findById(id);
    comment.replyText = dto.replyText;
    comment.replyDate = new Date();
    return this.commentRepository.save(comment);
  }

  async delete(id: number): Promise<void> {
    const comment = await this.findById(id);
    await this.commentRepository.remove(comment);
    this.logger.log(`Comment deleted: ${id}`);
  }

  async bulkUpdateStatus(dto: BulkCommentStatusDto) {
    const { ids, status } = dto;
    await this.commentRepository.update(ids, { status });
    this.logger.log(`Bulk status update: ${ids.length} comments to ${status}`);
    return { success: true, count: ids.length };
  }

  async bulkDelete(ids: number[]) {
    await this.commentRepository.delete(ids);
    this.logger.log(`Bulk delete: ${ids.length} comments`);
    return { success: true, count: ids.length };
  }

  async getStats() {
    const [total, pending, approved, rejected] = await Promise.all([
      this.commentRepository.count(),
      this.commentRepository.count({ where: { status: 'pending' } }),
      this.commentRepository.count({ where: { status: 'approved' } }),
      this.commentRepository.count({ where: { status: 'rejected' } }),
    ]);

    return { total, pending, approved, rejected };
  }

  async export(format: 'csv' | 'json', query: CommentQueryDto) {
    const { data } = await this.findAll({ ...query, limit: 10000 });

    if (format === 'json') {
      return data;
    }

    // CSV format
    const headers = [
      'ID',
      'Name',
      'Email',
      'Text',
      'Status',
      'Article Title',
      'Created At',
    ];
    const rows = data.map((c: Comment) => [
      c.id,
      `"${c.name}"`,
      `"${c.email}"`,
      `"${c.text?.substring(0, 100).replace(/"/g, '""')}"`,
      c.status,
      `"${c.articleTitle || ''}"`,
      c.createdAt.toISOString(),
    ]);

    return {
      headers: headers.join(','),
      rows: rows.map((r: any[]) => r.join(',')),
    };
  }
}
