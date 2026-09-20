import { DeleteArticleUseCase } from './delete-article.use-case';
import { ArticleNotFoundError } from './article-not-found.error';
import { ArticlesRepository } from '../domain/articles.repository';

describe('DeleteArticleUseCase', () => {
  it('deletes existing article', async () => {
    const repository: ArticlesRepository = {
      findArticles: jest.fn(),
      findArticleBySlug: jest.fn(),
      saveArticle: jest.fn(),
      updateArticle: jest.fn(),
      deleteArticle: jest.fn().mockResolvedValue(true),
    };
    const useCase = new DeleteArticleUseCase(repository);

    await useCase.execute('hello');

    expect(repository.deleteArticle).toHaveBeenCalledWith('hello');
  });

  it('throws when slug is empty', async () => {
    const repository: ArticlesRepository = {
      findArticles: jest.fn(),
      findArticleBySlug: jest.fn(),
      saveArticle: jest.fn(),
      updateArticle: jest.fn(),
      deleteArticle: jest.fn(),
    };
    const useCase = new DeleteArticleUseCase(repository);

    await expect(useCase.execute(' ')).rejects.toBeInstanceOf(ArticleNotFoundError);
  });

  it('throws when article does not exist', async () => {
    const repository: ArticlesRepository = {
      findArticles: jest.fn(),
      findArticleBySlug: jest.fn(),
      saveArticle: jest.fn(),
      updateArticle: jest.fn(),
      deleteArticle: jest.fn().mockResolvedValue(false),
    };
    const useCase = new DeleteArticleUseCase(repository);

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(ArticleNotFoundError);
  });
});
