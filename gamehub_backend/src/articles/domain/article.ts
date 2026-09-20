export type ArticleAuthor = {
  username: string;
  image: string;
};

export type ArticleBodyFormat = 'text' | 'html';

export type Article = {
  slug: string;
  title: string;
  description: string;
  body: string;
  bodyFormat: ArticleBodyFormat;
  tagList: string[];
  createdAt: string;
  author: ArticleAuthor;
};

export type CreateArticleInput = {
  title: string;
  description: string;
  body: string;
  bodyFormat: ArticleBodyFormat;
  tagList: string[];
  author?: ArticleAuthor;
};

export type UpdateArticleInput = Partial<CreateArticleInput>;
