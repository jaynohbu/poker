import { ARTICLE_LANGUAGES, Article, ArticleContent, ArticleLanguage } from '../domain/article';
import { ArticleContentTranslator } from './article-content-translator';

export function localizeArticle(article: Article, language: ArticleLanguage): Article {
  const localized = article.content[language] ?? firstContent(article.content) ?? fallbackContent(article, language);
  return {
    ...article,
    language: localized.language,
    title: localized.title,
    description: localized.description,
    body: localized.body,
    bodyFormat: localized.bodyFormat,
  };
}

export function mergeArticleContent(article: Article, content: ArticleContent): Article {
  return {
    ...article,
    language: content.language,
    title: content.title,
    description: content.description,
    body: content.body,
    bodyFormat: content.bodyFormat,
    content: { ...article.content, [content.language]: content },
  };
}

export function withContent(article: Article, contentMap: Partial<Record<ArticleLanguage, ArticleContent>>): Article {
  return { ...article, content: contentMap };
}

export function getBaseContent(article: Article): ArticleContent {
  return article.content[article.language] ?? firstContent(article.content) ?? fallbackContent(article, article.language);
}

export async function buildTranslatedContentMap(
  source: ArticleContent,
  sourceLanguage: ArticleLanguage,
  translator: ArticleContentTranslator,
  targetLanguages: ArticleLanguage[] = ARTICLE_LANGUAGES,
  onError: 'throw' | 'skip' = 'throw',
): Promise<Partial<Record<ArticleLanguage, ArticleContent>>> {
  const content: Partial<Record<ArticleLanguage, ArticleContent>> = { [sourceLanguage]: source };
  const translations = await Promise.all(
    targetLanguages
      .filter((language) => language !== sourceLanguage)
      .map(async (language) => {
        try {
          const translated = await translator.translateContent(source, sourceLanguage, language);
          return { language, translated };
        } catch (error) {
          if (onError === 'skip') {
            return null;
          }
          const message = error instanceof Error ? error.message : 'unknown translation error';
          throw new Error(`Failed to translate article content ${sourceLanguage}->${language}: ${message}`);
        }
      }),
  );

  for (const translation of translations) {
    if (!translation) continue;
    content[translation.language] = translation.translated;
  }
  return content;
}

export function applyContentMap(article: Article, content: Partial<Record<ArticleLanguage, ArticleContent>>): Article {
  return { ...article, content };
}

function firstContent(content: Partial<Record<ArticleLanguage, ArticleContent>>): ArticleContent | null {
  for (const language of ARTICLE_LANGUAGES) {
    const entry = content[language];
    if (entry) return entry;
  }
  return null;
}

function fallbackContent(article: Article, language: ArticleLanguage): ArticleContent {
  return {
    language,
    title: article.title,
    description: article.description,
    body: article.body,
    bodyFormat: article.bodyFormat,
  };
}