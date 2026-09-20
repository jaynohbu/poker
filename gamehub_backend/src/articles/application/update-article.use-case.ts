import { Inject, Injectable } from '@nestjs/common';
import { Article, UpdateArticleInput } from '../domain/article';
import { ARTICLES_REPOSITORY } from '../domain/articles.repository';
import type { ArticlesRepository } from '../domain/articles.repository';
import { ArticleNotFoundError } from './article-not-found.error';

@Injectable()
export class UpdateArticleUseCase {
  constructor(
    @Inject(ARTICLES_REPOSITORY)
    private readonly repository: ArticlesRepository,
  ) {}

  async execute(slug: string, input: UpdateArticleInput): Promise<Article> {
    const normalizedSlug = slug.trim();
    if (!normalizedSlug) throw new ArticleNotFoundError(slug);

    const updated = await this.repository.updateArticle(normalizedSlug, normalizeInput(input));
    if (!updated) throw new ArticleNotFoundError(normalizedSlug);

    return updated;
  }
}

function normalizeInput(input: UpdateArticleInput): UpdateArticleInput {
  const next: UpdateArticleInput = {};
  if (typeof input.title === 'string') next.title = input.title.trim();
  if (typeof input.description === 'string') next.description = input.description.trim();
  if (typeof input.body === 'string') next.body = input.body.trim();
  if (input.bodyFormat === 'html' || input.bodyFormat === 'text') next.bodyFormat = input.bodyFormat;
  if (Array.isArray(input.tagList)) {
    next.tagList = input.tagList.map((tag) => tag.trim()).filter(Boolean);
  }
  return next;
}
