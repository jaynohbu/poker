import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Article, ArticleContent, CreateArticleInput } from '../domain/article';
import { ARTICLES_REPOSITORY } from '../domain/articles.repository';
import type { ArticlesRepository } from '../domain/articles.repository';
import { ARTICLE_CONTENT_TRANSLATOR, type ArticleContentTranslator } from './article-content-translator';
import { applyContentMap, buildTranslatedContentMap } from './article-localization';

@Injectable()
export class CreateArticleUseCase {
  constructor(
    @Inject(ARTICLES_REPOSITORY)
    private readonly repository: ArticlesRepository,
    @Inject(ARTICLE_CONTENT_TRANSLATOR)
    private readonly translator: ArticleContentTranslator,
  ) {}

  async execute(input: CreateArticleInput): Promise<Article> {
    const now = new Date().toISOString();
    const content = normalizeSourceContent(input);
    const contentMap = await buildTranslatedContentMap(content, input.language, this.translator);
    const author = normalizeAuthor(input.author);
    const article: Article = applyContentMap({
      slug: buildSlug(content.title),
      language: input.language,
      title: content.title,
      description: content.description,
      body: content.body,
      bodyFormat: content.bodyFormat,
      tagList: sanitizeTags(input.tagList),
      createdAt: now,
      author,
      content: contentMap,
    }, contentMap);
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

function normalizeSourceContent(input: CreateArticleInput): ArticleContent {
  return {
    language: input.language,
    title: input.title.trim(),
    description: input.description.trim(),
    body: input.body.trim(),
    bodyFormat: input.bodyFormat,
  };
}

function normalizeAuthor(author?: { username: string; image: string }): { username: string; image: string } {
  const username = author?.username?.trim();
  const image = author?.image?.trim() ?? '';
  if (!username) {
    return { username: 'anonymous-writer', image: '' };
  }
  return { username, image };
}
