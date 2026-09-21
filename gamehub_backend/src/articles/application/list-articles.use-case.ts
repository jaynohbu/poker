import { Inject, Injectable } from '@nestjs/common';
import {
  ARTICLES_REPOSITORY,
  ArticlesFeed,
} from '../domain/articles.repository';
import type { ArticlesRepository } from '../domain/articles.repository';
import { ArticleLanguage, Article } from '../domain/article';
import { ARTICLE_CONTENT_TRANSLATOR, type ArticleContentTranslator } from './article-content-translator';
import { localizeArticle, buildTranslatedContentMap, applyContentMap } from './article-localization';

@Injectable()
export class ListArticlesUseCase {
  constructor(
    @Inject(ARTICLES_REPOSITORY)
    private readonly repository: ArticlesRepository,
    @Inject(ARTICLE_CONTENT_TRANSLATOR)
    private readonly translator: ArticleContentTranslator,
  ) {}

  async execute(limit: number, offset: number, language: ArticleLanguage): Promise<ArticlesFeed> {
    const feed = await this.repository.findArticles(limit, offset);
    const articles = await Promise.all(feed.articles.map((article) => this.localize(article, language)));
    return { articles, articlesCount: feed.articlesCount };
  }

  private async localize(article: Article, language: ArticleLanguage): Promise<Article> {
    if (article.content[language]) return localizeArticle(article, language);

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
