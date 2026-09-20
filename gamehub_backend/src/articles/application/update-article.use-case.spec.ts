import { UpdateArticleUseCase } from './update-article.use-case';
import { ArticleNotFoundError } from './article-not-found.error';
import { ArticlesRepository } from '../domain/articles.repository';

describe('UpdateArticleUseCase', () => {
  it('updates article with normalized input', async () => {
    const repository: ArticlesRepository = {
      findArticles: jest.fn(),
      findArticleBySlug: jest.fn(),
      saveArticle: jest.fn(),
      updateArticle: jest.fn().mockResolvedValue({
        slug: 'hello',
        title: 'Hello',
        description: 'desc',
        body: 'body',
        bodyFormat: 'html',
        tagList: ['a'],
        createdAt: '2026-09-19T00:00:00.000Z',
        author: { username: 'u', image: '' },
      }),
      deleteArticle: jest.fn(),
    };
    const useCase = new UpdateArticleUseCase(repository);

    const result = await useCase.execute('hello', {
      title: '  Hello  ',
      bodyFormat: 'html',
      tagList: [' a ', ''],
    });

    expect(result.slug).toBe('hello');
    expect(repository.updateArticle).toHaveBeenCalledWith('hello', {
      title: 'Hello',
      bodyFormat: 'html',
      tagList: ['a'],
    });
  });

  it('throws when slug is empty', async () => {
    const repository: ArticlesRepository = {
      findArticles: jest.fn(),
      findArticleBySlug: jest.fn(),
      saveArticle: jest.fn(),
      updateArticle: jest.fn(),
      deleteArticle: jest.fn(),
    };
    const useCase = new UpdateArticleUseCase(repository);

    await expect(useCase.execute('  ', { title: 'x' })).rejects.toBeInstanceOf(ArticleNotFoundError);
  });

  it('throws when article does not exist', async () => {
    const repository: ArticlesRepository = {
      findArticles: jest.fn(),
      findArticleBySlug: jest.fn(),
      saveArticle: jest.fn(),
      updateArticle: jest.fn().mockResolvedValue(null),
      deleteArticle: jest.fn(),
    };
    const useCase = new UpdateArticleUseCase(repository);

    await expect(useCase.execute('missing', { title: 'x' })).rejects.toBeInstanceOf(ArticleNotFoundError);
  });
});
