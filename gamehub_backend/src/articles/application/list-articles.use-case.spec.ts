import { ListArticlesUseCase } from './list-articles.use-case';
import { ArticlesRepository } from '../domain/articles.repository';

describe('ListArticlesUseCase', () => {
  it('returns articles from repository', async () => {
    const repository: ArticlesRepository = {
      findArticles: jest.fn().mockResolvedValue({ articles: [], articlesCount: 0 }),
      findArticleBySlug: jest.fn(),
      saveArticle: jest.fn(),
      updateArticle: jest.fn(),
      deleteArticle: jest.fn(),
    };
    const translator = { translateContent: jest.fn() };
    const useCase = new ListArticlesUseCase(repository, translator as never);

    const result = await useCase.execute(15, 3, 'ko');

    expect(result).toEqual({ articles: [], articlesCount: 0 });
    expect(repository.findArticles).toHaveBeenCalledWith(15, 3);
  });
});
