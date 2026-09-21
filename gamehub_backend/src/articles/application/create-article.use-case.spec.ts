import { CreateArticleUseCase } from './create-article.use-case';
import { ArticlesRepository } from '../domain/articles.repository';

describe('CreateArticleUseCase', () => {
  it('creates and saves a normalized article', async () => {
    const repository: ArticlesRepository = {
      findArticles: jest.fn(),
      findArticleBySlug: jest.fn(),
      saveArticle: jest.fn().mockImplementation(async (article) => article),
      updateArticle: jest.fn(),
      deleteArticle: jest.fn(),
    };
    const translator = { translateContent: jest.fn().mockImplementation(async (content) => content) };
    const useCase = new CreateArticleUseCase(repository, translator as never);

    const result = await useCase.execute({
      language: 'ko',
      title: '  Test Post  ',
      description: '  summary  ',
      body: '  article body  ',
      bodyFormat: 'html',
      tagList: [' alpha ', '', 'beta'],
      author: { username: '  jane ', image: ' https://img/jane.png ' },
    });

    expect(result.title).toBe('Test Post');
    expect(result.description).toBe('summary');
    expect(result.body).toBe('article body');
    expect(result.bodyFormat).toBe('html');
    expect(result.tagList).toEqual(['alpha', 'beta']);
    expect(result.language).toBe('ko');
    expect(result.content.ko?.title).toBe('Test Post');
    expect(result.author).toEqual({ username: 'jane', image: 'https://img/jane.png' });
    expect(result.slug).toMatch(/^test-post-[a-f0-9]{8}$/);
    expect(repository.saveArticle).toHaveBeenCalledTimes(1);
  });

  it('falls back to anonymous author when none is provided', async () => {
    const repository: ArticlesRepository = {
      findArticles: jest.fn(),
      findArticleBySlug: jest.fn(),
      saveArticle: jest.fn().mockImplementation(async (article) => article),
      updateArticle: jest.fn(),
      deleteArticle: jest.fn(),
    };
    const translator = { translateContent: jest.fn().mockImplementation(async (content) => content) };
    const useCase = new CreateArticleUseCase(repository, translator as never);

    const result = await useCase.execute({
      language: 'ko',
      title: 'Fallback Post',
      description: 'A valid description',
      body: 'A valid body that is long enough',
      bodyFormat: 'text',
      tagList: [],
    });

    expect(result.author).toEqual({ username: 'anonymous-writer', image: '' });
  });
});
