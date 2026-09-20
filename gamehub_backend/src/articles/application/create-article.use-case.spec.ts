import { CreateArticleUseCase } from './create-article.use-case';
import { ArticlesRepository } from '../domain/articles.repository';

describe('CreateArticleUseCase', () => {
  it('creates and saves a normalized article', async () => {
    const repository: ArticlesRepository = {
      findArticles: jest.fn(),
      findArticleBySlug: jest.fn(),
      saveArticle: jest.fn().mockImplementation(async (article) => article),
    };
    const useCase = new CreateArticleUseCase(repository);

    const result = await useCase.execute({
      title: '  Test Post  ',
      description: '  summary  ',
      body: '  article body  ',
      bodyFormat: 'html',
      tagList: [' alpha ', '', 'beta'],
    });

    expect(result.title).toBe('Test Post');
    expect(result.description).toBe('summary');
    expect(result.body).toBe('article body');
    expect(result.bodyFormat).toBe('html');
    expect(result.tagList).toEqual(['alpha', 'beta']);
    expect(result.author.username).toBe('blackjack-writer');
    expect(result.slug).toMatch(/^test-post-[a-f0-9]{8}$/);
    expect(repository.saveArticle).toHaveBeenCalledTimes(1);
  });
});
