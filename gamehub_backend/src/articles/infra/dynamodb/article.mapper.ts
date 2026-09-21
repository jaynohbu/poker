import { ARTICLE_LANGUAGES, Article, ArticleBodyFormat, ArticleContent, ArticleLanguage } from '../../domain/article';

type DynamoItem = Record<string, unknown>;

export function mapItemToArticle(item?: DynamoItem): Article | null {
  if (!item) return null;
  const content = asContentMap(item.content);
  const language = resolveLanguage(item.language, content);
  const localized = content[language] ?? firstContent(content) ?? legacyContent(item, language);
  return {
    slug: asString(item.slug),
    language: localized.language,
    title: localized.title,
    description: localized.description,
    body: localized.body,
    bodyFormat: localized.bodyFormat,
    tagList: asStringList(item.tagList),
    createdAt: asString(item.createdAt),
    author: {
      username: asString(item.authorUsername),
      image: asString(item.authorImage),
    },
    content: ensureContentMap(content, localized),
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

function asLanguage(value: unknown): ArticleLanguage | null {
  return isArticleLanguage(value) ? value : null;
}

function asContentMap(value: unknown): Partial<Record<ArticleLanguage, ArticleContent>> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const entries = Object.entries(value as Record<string, unknown>);
  return entries.reduce<Partial<Record<ArticleLanguage, ArticleContent>>>((accumulator, [key, entry]) => {
    if (!isArticleLanguage(key) || !isContent(entry)) return accumulator;
    accumulator[key] = normalizeContent(entry, key as ArticleLanguage);
    return accumulator;
  }, {});
}

function legacyContent(item: DynamoItem, language: ArticleLanguage): ArticleContent {
  return normalizeContent(
    {
      language,
      title: asString(item.title),
      description: asString(item.description),
      body: asString(item.body),
      bodyFormat: asBodyFormat(item.bodyFormat),
    },
    language,
  );
}

function ensureContentMap(
  content: Partial<Record<ArticleLanguage, ArticleContent>>,
  localized: ArticleContent,
): Partial<Record<ArticleLanguage, ArticleContent>> {
  const next = { ...content };
  next[localized.language] = localized;
  return next;
}

function firstContent(content: Partial<Record<ArticleLanguage, ArticleContent>>): ArticleContent | null {
  for (const language of ARTICLE_LANGUAGES) {
    const entry = content[language];
    if (entry) return entry;
  }
  return null;
}

function normalizeContent(content: ArticleContent, language: ArticleLanguage): ArticleContent {
  return {
    language,
    title: content.title.trim(),
    description: content.description.trim(),
    body: content.body.trim(),
    bodyFormat: asBodyFormat(content.bodyFormat),
  };
}

function resolveLanguage(
  language: unknown,
  content: Partial<Record<ArticleLanguage, ArticleContent>>,
): ArticleLanguage {
  if (isArticleLanguage(language) && content[language]) return language;
  return content.ko ? 'ko' : firstAvailableLanguage(content) ?? 'ko';
}

function firstAvailableLanguage(content: Partial<Record<ArticleLanguage, ArticleContent>>): ArticleLanguage | null {
  for (const language of ARTICLE_LANGUAGES) {
    if (content[language]) return language;
  }
  return null;
}

function isArticleLanguage(value: unknown): value is ArticleLanguage {
  return value === 'en' || value === 'ko' || value === 'ja';
}

function isContent(value: unknown): value is ArticleContent {
  return !!value && typeof value === 'object' && 'title' in value && 'description' in value && 'body' in value;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isArticle(value: Article | null): value is Article {
  return value !== null;
}
