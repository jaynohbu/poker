export type ArticleAuthor = {
  username: string;
  image: string;
};

export type ArticleBodyFormat = 'text' | 'html';

export type ArticleLanguage = 'en' | 'ko' | 'ja';

export const ARTICLE_LANGUAGES: ArticleLanguage[] = ['en', 'ko', 'ja'];

export type ArticleContent = {
  language: ArticleLanguage;
  title: string;
  description: string;
  body: string;
  bodyFormat: ArticleBodyFormat;
};

export type ArticleUpdateScope = 'current-language' | 'all-languages';

export type Article = {
  slug: string;
  language: ArticleLanguage;
  title: string;
  description: string;
  body: string;
  bodyFormat: ArticleBodyFormat;
  tagList: string[];
  createdAt: string;
  author: ArticleAuthor;
  content: Partial<Record<ArticleLanguage, ArticleContent>>;
};

export type CreateArticleInput = {
  language: ArticleLanguage;
  title: string;
  description: string;
  body: string;
  bodyFormat: ArticleBodyFormat;
  tagList: string[];
  author?: ArticleAuthor;
};

export type UpdateArticleInput = Partial<CreateArticleInput> & {
  updateScope?: ArticleUpdateScope;
};
