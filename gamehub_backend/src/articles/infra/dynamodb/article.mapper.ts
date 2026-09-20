import { Article, ArticleBodyFormat } from '../../domain/article';

type DynamoItem = Record<string, unknown>;

export function mapItemToArticle(item?: DynamoItem): Article | null {
  if (!item) return null;
  return {
    slug: asString(item.slug),
    title: asString(item.title),
    description: asString(item.description),
    body: asString(item.body),
    bodyFormat: asBodyFormat(item.bodyFormat),
    tagList: asStringList(item.tagList),
    createdAt: asString(item.createdAt),
    author: {
      username: asString(item.authorUsername),
      image: asString(item.authorImage),
    },
  };
}

export function mapItemsToArticles(items?: DynamoItem[]): Article[] {
  if (!items) return [];
  return items.map((item) => mapItemToArticle(item)).filter(isArticle);
}

export function sortByCreatedAtDesc(articles: Article[]): Article[] {
  return [...articles].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter(isString) : [];
}

function asBodyFormat(value: unknown): ArticleBodyFormat {
  return value === 'html' ? 'html' : 'text';
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isArticle(value: Article | null): value is Article {
  return value !== null;
}
