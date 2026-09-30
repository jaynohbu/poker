export type ArticleImageUploadFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

export type ArticleImageUploadInput = {
  email: string;
  file: ArticleImageUploadFile;
};

export type ArticleImageUploadResult = {
  key: string;
  url: string;
};

export type ArticleImageDeleteInput = {
  key: string;
};

export interface ArticleImageStorage {
  upload(key: string, body: Buffer, contentType: string): Promise<string>;
  delete(key: string): Promise<void>;
}

export const ARTICLE_IMAGE_STORAGE = Symbol('ARTICLE_IMAGE_STORAGE');