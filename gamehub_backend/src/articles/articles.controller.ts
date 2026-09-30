import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  MaxFileSizeValidator,
  NotFoundException,
  Param,
  Patch,
  Post,
  UploadedFile,
  Query,
  UseInterceptors,
  ParseFilePipe,
} from '@nestjs/common';
import { CreateArticleUseCase } from './application/create-article.use-case';
import { GetArticleUseCase } from './application/get-article.use-case';
import { ArticleNotFoundError } from './application/article-not-found.error';
import { ListArticlesUseCase } from './application/list-articles.use-case';
import { SyncArticleAuthorAvatarUseCase } from './application/sync-article-author-avatar.use-case';
import { UpdateArticleUseCase } from './application/update-article.use-case';
import { DeleteArticleUseCase } from './application/delete-article.use-case';
import { Article, ArticleBodyFormat, ArticleLanguage, ArticleUpdateScope, CreateArticleInput, UpdateArticleInput } from './domain/article';
import { ArticlesFeed } from './domain/articles.repository';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadArticleImageUseCase } from './application/upload-article-image.use-case';
import { UploadProfileImageUseCase } from './application/upload-profile-image.use-case';
import { DeleteArticleImageUseCase } from './application/delete-article-image.use-case';
import type { ArticleImageUploadFile } from './domain/article-image-upload';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

@Controller('articles')
export class ArticlesController {
  constructor(
    private readonly listArticlesUseCase: ListArticlesUseCase,
    private readonly getArticleUseCase: GetArticleUseCase,
    private readonly createArticleUseCase: CreateArticleUseCase,
    private readonly syncArticleAuthorAvatarUseCase: SyncArticleAuthorAvatarUseCase,
    private readonly updateArticleUseCase: UpdateArticleUseCase,
    private readonly deleteArticleUseCase: DeleteArticleUseCase,
    private readonly uploadArticleImageUseCase: UploadArticleImageUseCase,
    private readonly uploadProfileImageUseCase: UploadProfileImageUseCase,
    private readonly deleteArticleImageUseCase: DeleteArticleImageUseCase,
  ) {}

  @Get()
  getArticles(
    @Query('limit') limit = '10',
    @Query('offset') offset = '0',
    @Query('language') language = 'ko',
  ): Promise<ArticlesFeed> {
    const normalizedLimit = parsePositiveInt(limit, 10, 100);
    const normalizedOffset = parsePositiveInt(offset, 0, 100000);
    return this.listArticlesUseCase.execute(normalizedLimit, normalizedOffset, parseLanguage(language));
  }

  @Get(':slug')
  async getArticle(@Param('slug') slug: string, @Query('language') language = 'ko'): Promise<{ article: Article }> {
    try {
      const article = await this.getArticleUseCase.execute(slug, parseLanguage(language));
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

  @Patch('authors/avatar')
  syncAuthorAvatar(@Body() payload: { usernames?: string[]; image?: string }): Promise<{ updated: number }> {
    return this.syncArticleAuthorAvatarUseCase.execute({ usernames: payload.usernames ?? [], image: payload.image ?? '' });
  }

  @Patch(':slug')
  async updateArticle(
    @Param('slug') slug: string,
    @Body() payload: { article?: Partial<CreateArticleInput> & Pick<UpdateArticleInput, 'updateScope'> },
    @Headers('authorization') authorization = '',
  ): Promise<{ article: Article }> {
    try {
      const current = await this.getArticleUseCase.execute(slug, 'ko');
      assertCanEditArticle(current, authorization);
      const input = parseUpdateArticleInput(payload);
      const article = await this.updateArticleUseCase.execute(slug, input);
      return { article };
    } catch (error) {
      if (error instanceof ArticleNotFoundError) {
        throw new NotFoundException({ errors: { body: [error.message] } });
      }
      throw error;
    }
  }

  @Post('images')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: MAX_IMAGE_BYTES } }))
  async uploadImage(
    @Body('email') email: string,
    @UploadedFile(new ParseFilePipe({ validators: [new MaxFileSizeValidator({ maxSize: MAX_IMAGE_BYTES })] }))
    file: ArticleImageUploadFile,
  ): Promise<{ key: string; url: string }> {
    return this.uploadArticleImageUseCase.execute({ email, file });
  }

  @Post('profile-images')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: MAX_IMAGE_BYTES } }))
  async uploadProfileImage(
    @Body('email') email: string,
    @UploadedFile(new ParseFilePipe({ validators: [new MaxFileSizeValidator({ maxSize: MAX_IMAGE_BYTES })] }))
    file: ArticleImageUploadFile,
  ): Promise<{ key: string; url: string }> {
    return this.uploadProfileImageUseCase.execute({ email, file });
  }

  @Delete('images')
  deleteImage(@Query('key') key = ''): Promise<{ deleted: true }> {
    return this.deleteArticleImageUseCase.execute({ key });
  }

  @Delete(':slug')
  async deleteArticle(@Param('slug') slug: string): Promise<{ deleted: true }> {
    try {
      await this.deleteArticleUseCase.execute(slug);
      return { deleted: true };
    } catch (error) {
      if (error instanceof ArticleNotFoundError) {
        throw new NotFoundException({ errors: { body: [error.message] } });
      }
      throw error;
    }
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
  const language = parseLanguage(article.language);
  const title = requireText(article.title, 'title');
  const description = requireText(article.description, 'description');
  const body = requireText(article.body, 'body');
  const bodyFormat = parseBodyFormat(article.bodyFormat);
  const tagList = parseTagList(article.tagList);
  const author = parseAuthor(article.author);
  return { language, title, description, body, bodyFormat, tagList, author };
}

function parseUpdateArticleInput(payload: { article?: Partial<CreateArticleInput> & Pick<UpdateArticleInput, 'updateScope'> }): UpdateArticleInput {
  const article = payload.article;
  if (!article || typeof article !== 'object') {
    throw new BadRequestException({ errors: { body: ['article payload is required'] } });
  }

  const input: UpdateArticleInput = {};
  if (article.language !== undefined) input.language = parseLanguage(article.language);
  if (article.updateScope !== undefined) input.updateScope = parseUpdateScope(article.updateScope);
  if (typeof article.title === 'string') input.title = requireText(article.title, 'title');
  if (typeof article.description === 'string') input.description = requireText(article.description, 'description');
  if (typeof article.body === 'string') input.body = requireText(article.body, 'body');
  if (article.bodyFormat !== undefined) input.bodyFormat = parseBodyFormat(article.bodyFormat);
  if (article.tagList !== undefined) input.tagList = parseTagList(article.tagList);
  if (article.author !== undefined) input.author = parseAuthor(article.author);

  if (Object.keys(input).length === 0) {
    throw new BadRequestException({ errors: { body: ['at least one field is required'] } });
  }

  return input;
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

function parseLanguage(value: unknown): ArticleLanguage {
  if (value === 'en' || value === 'ko' || value === 'ja') return value;
  return 'ko';
}

function parseUpdateScope(value: unknown): ArticleUpdateScope {
  return value === 'current-language' ? 'current-language' : 'all-languages';
}

function parseAuthor(value: unknown): { username: string; image: string } | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  if (typeof record.username !== 'string') return undefined;
  const username = record.username.trim();
  if (!username) return undefined;
  const image = typeof record.image === 'string' ? record.image.trim() : '';
  return { username, image };
}

function assertCanEditArticle(article: Article, authorization: string): void {
  const identity = parseIdentityFromAuthorization(authorization);
  if (identity.role === 'admin') return;

  const owner = normalizeIdentityValue(article.author.username);
  if (!owner || identity.names.length === 0 || !identity.names.includes(owner)) {
    throw new ForbiddenException({ errors: { body: ['you can only edit your own articles'] } });
  }
}

function parseIdentityFromAuthorization(authorization: string): { role: ArticleRole; names: string[] } {
  const token = extractBearerToken(authorization);
  if (!token) return { role: 'viewer', names: [] };
  const payload = decodeJwtPayload(token);
  if (!payload) return { role: 'viewer', names: [] };

  const groups = toStringList(payload['cognito:groups']);
  const role = resolveRole(groups);
  const names = collectIdentityNames(payload);
  return { role, names };
}

function extractBearerToken(authorization: string): string {
  const value = authorization.trim();
  if (!value) return '';
  const matched = /^Bearer\s+(.+)$/i.exec(value);
  return matched?.[1]?.trim() ?? '';
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(parts[1].length / 4) * 4, '=');
  try {
    const decoded = Buffer.from(padded, 'base64').toString('utf8');
    const payload = JSON.parse(decoded);
    return payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

type ArticleRole = 'admin' | 'writer' | 'viewer';

function resolveRole(groups: string[]): ArticleRole {
  if (groups.some((group) => /(^|[-_:])admin(s)?($|[-_:])/.test(group))) return 'admin';
  if (groups.some((group) => /(^|[-_:])writer(s)?($|[-_:])/.test(group))) return 'writer';
  if (groups.some((group) => /(^|[-_:])viewer(s)?($|[-_:])/.test(group))) return 'viewer';
  return 'viewer';
}

function collectIdentityNames(payload: Record<string, unknown>): string[] {
  const nickname = asText(payload.nickname);
  const preferred = asText(payload.preferred_username);
  const cognitoUser = asText(payload['cognito:username']);
  const username = asText(payload.username);
  const emailLocal = toEmailLocal(asText(payload.email));
  return uniqueNormalized([nickname, preferred, cognitoUser, username, emailLocal]);
}

function toStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((x): x is string => typeof x === 'string').map((x) => x.trim().toLowerCase());
  if (typeof value !== 'string') return [];
  return value.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function toEmailLocal(email: string): string {
  const at = email.indexOf('@');
  return at > 0 ? email.slice(0, at) : '';
}

function uniqueNormalized(values: string[]): string[] {
  const set = new Set(values.map((value) => normalizeIdentityValue(value)).filter(Boolean));
  return [...set];
}

function normalizeIdentityValue(value: string): string {
  return value.trim().toLowerCase();
}
