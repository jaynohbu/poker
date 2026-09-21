import { GetArticleUseCase } from './get-article.use-case';
import { ArticleNotFoundError } from './article-not-found.error';
import { ArticlesRepository } from '../domain/articles.repository';

describe('GetArticleUseCase', () => {
  it('returns article from repository', async () => {
    const repository: ArticlesRepository = {
      findArticles: jest.fn(),
      findArticleBySlug: jest.fn().mockResolvedValue({
        slug: 'hello',
        language: 'ko',
        title: 'Hello',
        description: 'desc',
        body: 'body',
        bodyFormat: 'text',
        tagList: ['a'],
        createdAt: '2026-09-19T00:00:00.000Z',
        author: { username: 'u', image: '' },
        content: {
          ko: {
            language: 'ko',
            title: 'Hello',
            description: 'desc',
            body: 'body',
            bodyFormat: 'text',
          },
        },
      }),
      saveArticle: jest.fn(),
      updateArticle: jest.fn(),
      deleteArticle: jest.fn(),
    };
    const translator = { translateContent: jest.fn() };
    const useCase = new GetArticleUseCase(repository, translator as never);

    const result = await useCase.execute('hello', 'ko');

    expect(result.slug).toBe('hello');
    expect(repository.findArticleBySlug).toHaveBeenCalledWith('hello');
  });

  it('throws when slug is empty', async () => {
    const repository: ArticlesRepository = {
      findArticles: jest.fn(),
      findArticleBySlug: jest.fn(),
      saveArticle: jest.fn(),
      updateArticle: jest.fn(),
      deleteArticle: jest.fn(),
    };
    const translator = { translateContent: jest.fn() };
    const useCase = new GetArticleUseCase(repository, translator as never);

    await expect(useCase.execute('  ', 'ko')).rejects.toBeInstanceOf(ArticleNotFoundError);
  });

  it('throws when article does not exist', async () => {
    const repository: ArticlesRepository = {
      findArticles: jest.fn(),
      findArticleBySlug: jest.fn().mockResolvedValue(null),
      saveArticle: jest.fn(),
      updateArticle: jest.fn(),
      deleteArticle: jest.fn(),
    };
    const translator = { translateContent: jest.fn() };
    const useCase = new GetArticleUseCase(repository, translator as never);

    await expect(useCase.execute('missing', 'ko')).rejects.toBeInstanceOf(ArticleNotFoundError);
  });
});
