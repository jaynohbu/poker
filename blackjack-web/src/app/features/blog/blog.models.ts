export type BlogAuthor = {
  username: string;
  image: string;
};

export type BlogBodyFormat = 'text' | 'html';

export type BlogArticle = {
  slug: string;
  title: string;
  description: string;
  body: string;
  bodyFormat: BlogBodyFormat;
  tagList: string[];
  createdAt: string;
  author: BlogAuthor;
};

export type BlogArticlesResponse = {
  articles: BlogArticle[];
  articlesCount: number;
};

export type BlogArticleResponse = {
  article: BlogArticle;
};

export type CreateBlogArticleInput = {
  title: string;
  description: string;
  body: string;
  bodyFormat: BlogBodyFormat;
  tagList: string[];
};
