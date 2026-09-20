import { GetArticleUseCase } from './get-article.use-case';
import { ArticleNotFoundError } from './article-not-found.error';
import { ArticlesRepository } from '../domain/articles.repository';

describe('GetArticleUseCase', () => {
  it('returns article from repository', async () => {
    const repository: ArticlesRepository = {
      findArticles: jest.fn(),
      findArticleBySlug: jest.fn().mockResolvedValue({
        slug: 'hello',
        title: 'Hello',
        description: 'desc',
        body: 'body',
        bodyFormat: 'text',
        tagList: ['a'],
        createdAt: '2026-09-19T00:00:00.000Z',
        author: { username: 'u', image: '' },
      }),
      saveArticle: jest.fn(),
      updateArticle: jest.fn(),
      deleteArticle: jest.fn(),
    };
    const useCase = new GetArticleUseCase(repository);

    const result = await useCase.execute('hello');

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
    const useCase = new GetArticleUseCase(repository);

    await expect(useCase.execute('  ')).rejects.toBeInstanceOf(ArticleNotFoundError);
  });

  it('throws when article does not exist', async () => {
    const repository: ArticlesRepository = {
      findArticles: jest.fn(),
      findArticleBySlug: jest.fn().mockResolvedValue(null),
      saveArticle: jest.fn(),
      updateArticle: jest.fn(),
      deleteArticle: jest.fn(),
    };
    const useCase = new GetArticleUseCase(repository);

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(ArticleNotFoundError);
  });
});
