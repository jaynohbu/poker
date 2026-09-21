import { ArticleContent, ArticleLanguage } from '../domain/article';

export interface ArticleContentTranslator {
  translateContent(content: ArticleContent, sourceLanguage: ArticleLanguage, targetLanguage: ArticleLanguage): Promise<ArticleContent>;
}

export const ARTICLE_CONTENT_TRANSLATOR = Symbol('ARTICLE_CONTENT_TRANSLATOR');