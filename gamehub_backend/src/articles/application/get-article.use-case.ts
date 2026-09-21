import { Inject, Injectable } from '@nestjs/common';
import { Article, ArticleLanguage } from '../domain/article';
import { ARTICLES_REPOSITORY } from '../domain/articles.repository';
import type { ArticlesRepository } from '../domain/articles.repository';
import { ARTICLE_CONTENT_TRANSLATOR, type ArticleContentTranslator } from './article-content-translator';
import { applyContentMap, buildTranslatedContentMap, localizeArticle } from './article-localization';
import { ArticleNotFoundError } from './article-not-found.error';

@Injectable()
export class GetArticleUseCase {
  constructor(
    @Inject(ARTICLES_REPOSITORY)
    private readonly repository: ArticlesRepository,
    @Inject(ARTICLE_CONTENT_TRANSLATOR)
    private readonly translator: ArticleContentTranslator,
  ) {}

  async execute(slug: string, language: ArticleLanguage): Promise<Article> {
    const normalizedSlug = slug.trim();
    if (!normalizedSlug) throw new ArticleNotFoundError(slug);

    const article = await this.repository.findArticleBySlug(normalizedSlug);
    if (!article) throw new ArticleNotFoundError(normalizedSlug);

    if (article.content[language]) {
      return localizeArticle(article, language);
    }

    const source = localizeArticle(article, article.language);
    const translated = await buildTranslatedContentMap(source, source.language, this.translator, [language]);
    if (!translated[language]) {
      return source;
    }
    const updated = applyContentMap({ ...article, content: { ...article.content, ...translated } }, {
      ...article.content,
      ...translated,
    });
    await this.repository.saveArticle(updated);
    return localizeArticle(updated, language);
  }
}
