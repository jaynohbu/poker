import { NotFoundException } from '@nestjs/common';
import { ArticlesController } from './articles.controller';
import { ArticleNotFoundError } from './application/article-not-found.error';

describe('ArticlesController', () => {
  it('returns article list with normalized query', async () => {
    const listArticlesUseCase = {
      execute: jest.fn().mockResolvedValue({ articles: [], articlesCount: 0 }),
    };
    const getArticleUseCase = { execute: jest.fn() };
    const createArticleUseCase = { execute: jest.fn() };
    const controller = new ArticlesController(
      listArticlesUseCase as never,
      getArticleUseCase as never,
      createArticleUseCase as never,
    );

    const result = await controller.getArticles('-1', 'abc');

    expect(result).toEqual({ articles: [], articlesCount: 0 });
    expect(listArticlesUseCase.execute).toHaveBeenCalledWith(0, 0);
  });

  it('returns one article', async () => {
    const article = {
      slug: 'a',
      title: 't',
      description: 'd',
      body: 'b',
      bodyFormat: 'text',
      tagList: [],
      createdAt: '2026-01-01',
      author: { username: 'u', image: '' },
    };
    const listArticlesUseCase = { execute: jest.fn() };
    const getArticleUseCase = { execute: jest.fn().mockResolvedValue(article) };
    const createArticleUseCase = { execute: jest.fn() };
    const controller = new ArticlesController(
      listArticlesUseCase as never,
      getArticleUseCase as never,
      createArticleUseCase as never,
    );

    const result = await controller.getArticle('a');

    expect(result).toEqual({ article });
  });

  it('maps not found error to HTTP 404', async () => {
    const listArticlesUseCase = { execute: jest.fn() };
    const getArticleUseCase = {
      execute: jest.fn().mockRejectedValue(new ArticleNotFoundError('x')),
    };
    const createArticleUseCase = { execute: jest.fn() };
    const controller = new ArticlesController(
      listArticlesUseCase as never,
      getArticleUseCase as never,
      createArticleUseCase as never,
    );

    await expect(controller.getArticle('x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates article from payload', async () => {
    const article = {
      slug: 'new-one',
      title: 'New One',
      description: 'summary',
      body: 'content',
      bodyFormat: 'html',
      tagList: ['news'],
      createdAt: '2026-09-19T00:00:00.000Z',
      author: { username: 'blackjack-writer', image: '' },
    };
    const listArticlesUseCase = { execute: jest.fn() };
    const getArticleUseCase = { execute: jest.fn() };
    const createArticleUseCase = { execute: jest.fn().mockResolvedValue(article) };
    const controller = new ArticlesController(
      listArticlesUseCase as never,
      getArticleUseCase as never,
      createArticleUseCase as never,
    );

    const result = await controller.createArticle({
      article: {
        title: 'New One',
        description: 'summary',
        body: 'content',
        bodyFormat: 'html',
        tagList: ['news'],
      },
    });

    expect(result).toEqual({ article });
    expect(createArticleUseCase.execute).toHaveBeenCalledWith({
      title: 'New One',
      description: 'summary',
      body: 'content',
      bodyFormat: 'html',
      tagList: ['news'],
    });
  });

  it('defaults missing bodyFormat to text', async () => {
    const article = {
      slug: 'new-two',
      title: 'New Two',
      description: 'summary',
      body: 'content',
      bodyFormat: 'text',
      tagList: [],
      createdAt: '2026-09-19T00:00:00.000Z',
      author: { username: 'blackjack-writer', image: '' },
    };
    const listArticlesUseCase = { execute: jest.fn() };
    const getArticleUseCase = { execute: jest.fn() };
    const createArticleUseCase = { execute: jest.fn().mockResolvedValue(article) };
    const controller = new ArticlesController(
      listArticlesUseCase as never,
      getArticleUseCase as never,
      createArticleUseCase as never,
    );

    await controller.createArticle({
      article: {
        title: 'New Two',
        description: 'summary',
        body: 'content',
      },
    });

    expect(createArticleUseCase.execute).toHaveBeenCalledWith({
      title: 'New Two',
      description: 'summary',
      body: 'content',
      bodyFormat: 'text',
      tagList: [],
    });
  });
});
