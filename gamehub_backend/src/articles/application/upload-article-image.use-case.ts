import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ARTICLE_IMAGE_STORAGE } from '../domain/article-image-upload';
import type {
  ArticleImageStorage,
  ArticleImageUploadFile,
  ArticleImageUploadInput,
  ArticleImageUploadResult,
} from '../domain/article-image-upload';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

@Injectable()
export class UploadArticleImageUseCase {
  constructor(
    @Inject(ARTICLE_IMAGE_STORAGE)
    private readonly storage: ArticleImageStorage,
  ) {}

  async execute(input: ArticleImageUploadInput): Promise<ArticleImageUploadResult> {
    assertEmail(input.email);
    assertFile(input.file);
    const key = buildKey(input.email, input.file);
    const url = await this.storage.upload(key, input.file.buffer, input.file.mimetype);
    return { key, url };
  }
}

function assertEmail(email: string): void {
  if (!email.trim() || !email.includes('@')) {
    throw new BadRequestException({ errors: { body: ['email is required'] } });
  }
}

function assertFile(file: ArticleImageUploadFile): void {
  if (!(file.size > 0)) throw new BadRequestException({ errors: { body: ['file is required'] } });
  if (file.size > MAX_IMAGE_BYTES) {
    throw new BadRequestException({ errors: { body: ['image must be 5MB or smaller'] } });
  }
  if (!(file.mimetype in EXTENSION_BY_MIME)) {
    throw new BadRequestException({ errors: { body: ['unsupported image type'] } });
  }
}

function buildKey(email: string, file: ArticleImageUploadFile): string {
  const extension = EXTENSION_BY_MIME[file.mimetype];
  const timestamp = Math.floor(Date.now() / 1000);
  return `blog_images/${email.trim()}-${timestamp}.${extension}`;
}