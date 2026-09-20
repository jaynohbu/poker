import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CreateArticleUseCase } from './application/create-article.use-case';
import { GetArticleUseCase } from './application/get-article.use-case';
import { ArticleNotFoundError } from './application/article-not-found.error';
import { ListArticlesUseCase } from './application/list-articles.use-case';
import { Article, ArticleBodyFormat, CreateArticleInput } from './domain/article';
import { ArticlesFeed } from './domain/articles.repository';

@Controller('articles')
export class ArticlesController {
  constructor(
    private readonly listArticlesUseCase: ListArticlesUseCase,
    private readonly getArticleUseCase: GetArticleUseCase,
    private readonly createArticleUseCase: CreateArticleUseCase,
  ) {}

  @Get()
  getArticles(
    @Query('limit') limit = '10',
    @Query('offset') offset = '0',
  ): Promise<ArticlesFeed> {
    const normalizedLimit = parsePositiveInt(limit, 10, 100);
    const normalizedOffset = parsePositiveInt(offset, 0, 100000);
    return this.listArticlesUseCase.execute(normalizedLimit, normalizedOffset);
  }

  @Get(':slug')
  async getArticle(@Param('slug') slug: string): Promise<{ article: Article }> {
    try {
      const article = await this.getArticleUseCase.execute(slug);
      return { article };
    } catch (error) {
      if (error instanceof ArticleNotFoundError) {
        throw new NotFoundException({ errors: { body: [error.message] } });
      }
      throw error;
    }
  }

  @Post()
  async createArticle(@Body() payload: { article?: Partial<CreateArticleInput> }): Promise<{ article: Article }> {
    const input = parseCreateArticleInput(payload);
    const article = await this.createArticleUseCase.execute(input);
    return { article };
  }
}

function parsePositiveInt(value: string, fallback: number, max: number): number {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  if (parsed < 0) return 0;
  return parsed > max ? max : parsed;
}

function parseCreateArticleInput(payload: { article?: Partial<CreateArticleInput> }): CreateArticleInput {
  const article = payload.article ?? {};
  const title = requireText(article.title, 'title');
  const description = requireText(article.description, 'description');
  const body = requireText(article.body, 'body');
  const bodyFormat = parseBodyFormat(article.bodyFormat);
  const tagList = parseTagList(article.tagList);
  return { title, description, body, bodyFormat, tagList };
}

function requireText(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new BadRequestException({ errors: { body: [`${field} is required`] } });
  }
  return value;
}

function parseTagList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((tag): tag is string => typeof tag === 'string');
}

function parseBodyFormat(value: unknown): ArticleBodyFormat {
  if (value === 'html') return 'html';
  return 'text';
}
