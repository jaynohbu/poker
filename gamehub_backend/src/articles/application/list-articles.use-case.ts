import { Inject, Injectable } from '@nestjs/common';
import {
  ARTICLES_REPOSITORY,
  ArticlesFeed,
} from '../domain/articles.repository';
import type { ArticlesRepository } from '../domain/articles.repository';

@Injectable()
export class ListArticlesUseCase {
  constructor(
    @Inject(ARTICLES_REPOSITORY)
    private readonly repository: ArticlesRepository,
  ) {}

  execute(limit: number, offset: number): Promise<ArticlesFeed> {
    return this.repository.findArticles(limit, offset);
  }
}
