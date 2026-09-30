import { SyncArticleAuthorAvatarUseCase } from './sync-article-author-avatar.use-case';
import { ArticlesRepository } from '../domain/articles.repository';

describe('SyncArticleAuthorAvatarUseCase', () => {
  it('updates author avatar for matching usernames', async () => {
    const repository: ArticlesRepository = {
      findArticles: jest.fn(),
      findArticleBySlug: jest.fn(),
      saveArticle: jest.fn(),
      updateArticle: jest.fn(),
      syncAuthorImage: jest.fn().mockResolvedValue(3),
      deleteArticle: jest.fn(),
    };
    const useCase = new SyncArticleAuthorAvatarUseCase(repository);

    const result = await useCase.execute({ usernames: ['hero', 'hero'], image: 'https://cdn/avatar.png' });

    expect(result).toEqual({ updated: 3 });
    expect(repository.syncAuthorImage).toHaveBeenCalledWith(['hero'], 'https://cdn/avatar.png');
  });

  it('rejects missing usernames', async () => {
    const repository: ArticlesRepository = {
      findArticles: jest.fn(),
      findArticleBySlug: jest.fn(),
      saveArticle: jest.fn(),
      updateArticle: jest.fn(),
      syncAuthorImage: jest.fn(),
      deleteArticle: jest.fn(),
    };
    const useCase = new SyncArticleAuthorAvatarUseCase(repository);

    await expect(useCase.execute({ usernames: [], image: 'https://cdn/avatar.png' })).rejects.toThrow();
  });
});