import { Inject, Injectable } from '@nestjs/common';
import { Article } from '../domain/article';
import { ARTICLES_REPOSITORY } from '../domain/articles.repository';
import type { ArticlesRepository } from '../domain/articles.repository';
import { ArticleNotFoundError } from './article-not-found.error';

@Injectable()
export class GetArticleUseCase {
  constructor(
    @Inject(ARTICLES_REPOSITORY)
    private readonly repository: ArticlesRepository,
  ) {}

  async execute(slug: string): Promise<Article> {
    const normalizedSlug = slug.trim();
    if (!normalizedSlug) throw new ArticleNotFoundError(slug);

    const article = await this.repository.findArticleBySlug(normalizedSlug);
    if (!article) throw new ArticleNotFoundError(normalizedSlug);

    return article;
  }
}
