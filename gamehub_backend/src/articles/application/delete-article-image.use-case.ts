import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ARTICLE_IMAGE_STORAGE } from '../domain/article-image-upload';
import type { ArticleImageDeleteInput, ArticleImageStorage } from '../domain/article-image-upload';

@Injectable()
export class DeleteArticleImageUseCase {
  constructor(
    @Inject(ARTICLE_IMAGE_STORAGE)
    private readonly storage: ArticleImageStorage,
  ) {}

  async execute(input: ArticleImageDeleteInput): Promise<{ deleted: true }> {
    const key = normalizeKey(input.key);
    await this.storage.delete(key);
    return { deleted: true };
  }
}

function normalizeKey(value: string): string {
  const key = value.trim();
  if (!key.startsWith('blog_images/')) {
    throw new BadRequestException({ errors: { body: ['invalid image key'] } });
  }
  return key;
}
