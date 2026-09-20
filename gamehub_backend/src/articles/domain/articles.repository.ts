import { Article, UpdateArticleInput } from './article';

export type ArticlesFeed = {
  articles: Article[];
  articlesCount: number;
};

export interface ArticlesRepository {
  findArticles(limit: number, offset: number): Promise<ArticlesFeed>;
  findArticleBySlug(slug: string): Promise<Article | null>;
  saveArticle(article: Article): Promise<Article>;
  updateArticle(slug: string, input: UpdateArticleInput): Promise<Article | null>;
  deleteArticle(slug: string): Promise<boolean>;
}

export const ARTICLES_REPOSITORY = Symbol('ARTICLES_REPOSITORY');
