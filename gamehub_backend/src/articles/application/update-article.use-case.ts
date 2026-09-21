import { Inject, Injectable } from '@nestjs/common';
import { Article, ArticleContent, UpdateArticleInput } from '../domain/article';
import { ARTICLES_REPOSITORY } from '../domain/articles.repository';
import type { ArticlesRepository } from '../domain/articles.repository';
import { ARTICLE_CONTENT_TRANSLATOR, type ArticleContentTranslator } from './article-content-translator';
import { applyContentMap, buildTranslatedContentMap, getBaseContent } from './article-localization';
import { ArticleNotFoundError } from './article-not-found.error';

@Injectable()
export class UpdateArticleUseCase {
  constructor(
    @Inject(ARTICLES_REPOSITORY)
    private readonly repository: ArticlesRepository,
    @Inject(ARTICLE_CONTENT_TRANSLATOR)
    private readonly translator: ArticleContentTranslator,
  ) {}

  async execute(slug: string, input: UpdateArticleInput): Promise<Article> {
    const normalizedSlug = slug.trim();
    if (!normalizedSlug) throw new ArticleNotFoundError(slug);

    const existing = await this.repository.findArticleBySlug(normalizedSlug);
    if (!existing) throw new ArticleNotFoundError(normalizedSlug);

    const normalized = normalizeInput(input);
    const source = mergeSourceContent(existing, normalized);
    const contentMap = normalized.updateScope === 'current-language'
      ? buildCurrentLanguageContentMap(existing, source)
      : await buildTranslatedContentMap(source, source.language, this.translator);
    const updated = applyContentMap({ ...existing, ...source, content: contentMap }, contentMap);
    await this.repository.saveArticle(updated);
    return updated;
  }
}

function normalizeInput(input: UpdateArticleInput): UpdateArticleInput {
  const next: UpdateArticleInput = {};
  if (input.language === 'en' || input.language === 'ko' || input.language === 'ja') next.language = input.language;
  if (input.updateScope === 'current-language' || input.updateScope === 'all-languages') next.updateScope = input.updateScope;
  if (typeof input.title === 'string') next.title = input.title.trim();
  if (typeof input.description === 'string') next.description = input.description.trim();
  if (typeof input.body === 'string') next.body = input.body.trim();
  if (input.bodyFormat === 'html' || input.bodyFormat === 'text') next.bodyFormat = input.bodyFormat;
  if (Array.isArray(input.tagList)) {
    next.tagList = input.tagList.map((tag) => tag.trim()).filter(Boolean);
  }
  return next;
}

function mergeSourceContent(existing: Article, input: UpdateArticleInput): ArticleContent {
  const current = getBaseContent(existing);
  const language = input.language ?? existing.language;
  return {
    language,
    title: input.title ?? current.title,
    description: input.description ?? current.description,
    body: input.body ?? current.body,
    bodyFormat: input.bodyFormat ?? current.bodyFormat,
  };
}

function buildCurrentLanguageContentMap(
  existing: Article,
  source: ArticleContent,
): Partial<Record<ArticleContent['language'], ArticleContent>> {
  return {
    ...existing.content,
    [source.language]: source,
  };
}
