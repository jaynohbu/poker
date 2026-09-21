export type BlogAuthor = {
  username: string;
  image: string;
};

export type BlogBodyFormat = 'text' | 'html';

export type BlogUpdateScope = 'current-language' | 'all-languages';

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
  author?: BlogAuthor;
};

export type UpdateBlogArticleInput = Partial<CreateBlogArticleInput>;

export type UpdateBlogArticlePayload = UpdateBlogArticleInput & {
  updateScope?: BlogUpdateScope;
};

export type BlogImageUploadResponse = {
  key: string;
  url: string;
};
