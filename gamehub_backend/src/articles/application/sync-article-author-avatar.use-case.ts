import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ARTICLES_REPOSITORY } from '../domain/articles.repository';
import type { ArticlesRepository } from '../domain/articles.repository';

type SyncArticleAuthorAvatarInput = {
  usernames: string[];
  image: string;
};

@Injectable()
export class SyncArticleAuthorAvatarUseCase {
  constructor(
    @Inject(ARTICLES_REPOSITORY)
    private readonly repository: ArticlesRepository,
  ) {}

  async execute(input: SyncArticleAuthorAvatarInput): Promise<{ updated: number }> {
    const usernames = normalizeUsernames(input.usernames);
    const image = input.image.trim();
    if (usernames.length === 0 || !image) {
      throw new BadRequestException({ errors: { body: ['usernames and image are required'] } });
    }

    const updated = await this.repository.syncAuthorImage(usernames, image);
    return { updated };
  }
}

function normalizeUsernames(usernames: string[]): string[] {
  return [...new Set(usernames.map((username) => username.trim()).filter(Boolean))];
}