import { ListArticlesUseCase } from './list-articles.use-case';
import { ArticlesRepository } from '../domain/articles.repository';

describe('ListArticlesUseCase', () => {
  it('returns articles from repository', async () => {
    const repository: ArticlesRepository = {
      findArticles: jest.fn().mockResolvedValue({ articles: [], articlesCount: 0 }),
      findArticleBySlug: jest.fn(),
      saveArticle: jest.fn(),
    };
    const useCase = new ListArticlesUseCase(repository);

    const result = await useCase.execute(15, 3);

    expect(result).toEqual({ articles: [], articlesCount: 0 });
    expect(repository.findArticles).toHaveBeenCalledWith(15, 3);
  });
});
