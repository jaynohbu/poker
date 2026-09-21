import { UpdateArticleUseCase } from './update-article.use-case';
import { ArticleNotFoundError } from './article-not-found.error';
import { ArticlesRepository } from '../domain/articles.repository';

describe('UpdateArticleUseCase', () => {
  it('updates article with normalized input', async () => {
    const repository: ArticlesRepository = {
      findArticles: jest.fn(),
      findArticleBySlug: jest.fn().mockResolvedValue(buildArticle()),
      saveArticle: jest.fn().mockImplementation(async (article) => article),
      updateArticle: jest.fn(),
      deleteArticle: jest.fn(),
    };
    const translator = { translateContent: jest.fn().mockImplementation(async (content) => content) };
    const useCase = new UpdateArticleUseCase(repository, translator as never);

    const result = await useCase.execute('hello', {
      language: 'ko',
      title: '  Hello  ',
      bodyFormat: 'html',
      tagList: [' a ', ''],
    });

    expect(result.slug).toBe('hello');
    expect(result.language).toBe('ko');
    expect(repository.saveArticle).toHaveBeenCalledTimes(1);
    expect(translator.translateContent).toHaveBeenCalled();
  });

  it('re-translates all languages from the selected source', async () => {
    const repository: ArticlesRepository = {
      findArticles: jest.fn(),
      findArticleBySlug: jest.fn().mockResolvedValue(buildArticle()),
      saveArticle: jest.fn().mockImplementation(async (article) => article),
      updateArticle: jest.fn(),
      deleteArticle: jest.fn(),
    };
    const translator = {
      translateContent: jest.fn().mockImplementation(async (content, sourceLanguage, targetLanguage) => ({
        ...content,
        language: targetLanguage,
        title: `${content.title}-${targetLanguage}`,
      })),
    };
    const useCase = new UpdateArticleUseCase(repository, translator as never);

    const result = await useCase.execute('hello', {
      language: 'en',
      title: 'Hello EN',
    });

    expect(result.language).toBe('en');
    expect(result.title).toBe('Hello EN');
    expect(repository.saveArticle).toHaveBeenCalledTimes(1);
  });

  it('updates only the current language when requested', async () => {
    const repository: ArticlesRepository = {
      findArticles: jest.fn(),
      findArticleBySlug: jest.fn().mockResolvedValue({
        ...buildArticle(),
        content: {
          ko: {
            language: 'ko',
            title: 'Hello',
            description: 'desc',
            body: 'body',
            bodyFormat: 'html',
          },
          en: {
            language: 'en',
            title: 'Hello EN',
            description: 'desc en',
            body: 'body en',
            bodyFormat: 'html',
          },
        },
      }),
      saveArticle: jest.fn().mockImplementation(async (article) => article),
      updateArticle: jest.fn(),
      deleteArticle: jest.fn(),
    };
    const translator = { translateContent: jest.fn() };
    const useCase = new UpdateArticleUseCase(repository, translator as never);

    const result = await useCase.execute('hello', {
      language: 'ko',
      title: 'Hello KO Updated',
      updateScope: 'current-language',
    });

    expect(result.content.ko?.title).toBe('Hello KO Updated');
    expect(result.content.en?.title).toBe('Hello EN');
    expect(translator.translateContent).not.toHaveBeenCalled();
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
    const useCase = new UpdateArticleUseCase(repository, translator as never);

    await expect(useCase.execute('  ', { title: 'x' })).rejects.toBeInstanceOf(ArticleNotFoundError);
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
    const useCase = new UpdateArticleUseCase(repository, translator as never);

    await expect(useCase.execute('missing', { title: 'x' })).rejects.toBeInstanceOf(ArticleNotFoundError);
  });
});

function buildArticle() {
  return {
    slug: 'hello',
    language: 'ko' as const,
    title: 'Hello',
    description: 'desc',
    body: 'body',
    bodyFormat: 'html' as const,
    tagList: ['a'],
    createdAt: '2026-09-19T00:00:00.000Z',
    author: { username: 'u', image: '' },
    content: {
      ko: {
        language: 'ko' as const,
        title: 'Hello',
        description: 'desc',
        body: 'body',
        bodyFormat: 'html' as const,
      },
    },
  };
}
