import { Article } from './article';

export type ArticlesFeed = {
  articles: Article[];
  articlesCount: number;
};

export interface ArticlesRepository {
  findArticles(limit: number, offset: number): Promise<ArticlesFeed>;
  findArticleBySlug(slug: string): Promise<Article | null>;
  saveArticle(article: Article): Promise<Article>;
}

export const ARTICLES_REPOSITORY = Symbol('ARTICLES_REPOSITORY');
