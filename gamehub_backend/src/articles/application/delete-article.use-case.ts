import { Inject, Injectable } from '@nestjs/common';
import { ARTICLES_REPOSITORY } from '../domain/articles.repository';
import type { ArticlesRepository } from '../domain/articles.repository';
import { ArticleNotFoundError } from './article-not-found.error';

@Injectable()
export class DeleteArticleUseCase {
  constructor(
    @Inject(ARTICLES_REPOSITORY)
    private readonly repository: ArticlesRepository,
  ) {}

  async execute(slug: string): Promise<void> {
    const normalizedSlug = slug.trim();
    if (!normalizedSlug) throw new ArticleNotFoundError(slug);

    const deleted = await this.repository.deleteArticle(normalizedSlug);
    if (!deleted) throw new ArticleNotFoundError(normalizedSlug);
  }
}
