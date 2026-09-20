import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Article, CreateArticleInput } from '../domain/article';
import { ARTICLES_REPOSITORY } from '../domain/articles.repository';
import type { ArticlesRepository } from '../domain/articles.repository';

@Injectable()
export class CreateArticleUseCase {
  constructor(
    @Inject(ARTICLES_REPOSITORY)
    private readonly repository: ArticlesRepository,
  ) {}

  execute(input: CreateArticleInput): Promise<Article> {
    const now = new Date().toISOString();
    const title = input.title.trim();
    const article: Article = {
      slug: buildSlug(title),
      title,
      description: input.description.trim(),
      body: input.body.trim(),
      bodyFormat: input.bodyFormat,
      tagList: sanitizeTags(input.tagList),
      createdAt: now,
      author: {
        username: 'blackjack-writer',
        image: '',
      },
    };
    return this.repository.saveArticle(article);
  }
}

function buildSlug(title: string): string {
  const normalized = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  return `${normalized || 'post'}-${randomUUID().slice(0, 8)}`;
}

function sanitizeTags(tags: string[]): string[] {
  return tags.map((tag) => tag.trim()).filter(Boolean);
}
