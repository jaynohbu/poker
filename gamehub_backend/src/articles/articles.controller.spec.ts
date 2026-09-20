import { NotFoundException } from '@nestjs/common';
import { ArticlesController } from './articles.controller';
import { ArticleNotFoundError } from './application/article-not-found.error';

function buildController(overrides: Partial<Record<string, { execute: jest.Mock }>> = {}): ArticlesController {
  const listArticlesUseCase = overrides.listArticlesUseCase ?? { execute: jest.fn() };
  const getArticleUseCase = overrides.getArticleUseCase ?? { execute: jest.fn() };
  const createArticleUseCase = overrides.createArticleUseCase ?? { execute: jest.fn() };
  const updateArticleUseCase = overrides.updateArticleUseCase ?? { execute: jest.fn() };
  const deleteArticleUseCase = overrides.deleteArticleUseCase ?? { execute: jest.fn() };
  const uploadArticleImageUseCase = overrides.uploadArticleImageUseCase ?? { execute: jest.fn() };

  return new ArticlesController(
    listArticlesUseCase as never,
    getArticleUseCase as never,
    createArticleUseCase as never,
    updateArticleUseCase as never,
    deleteArticleUseCase as never,
    uploadArticleImageUseCase as never,
  );
}

describe('ArticlesController', () => {
  it('returns article list with normalized query', async () => {
    const listArticlesUseCase = { execute: jest.fn().mockResolvedValue({ articles: [], articlesCount: 0 }) };
    const controller = buildController({ listArticlesUseCase });

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
    const controller = buildController({ getArticleUseCase: { execute: jest.fn().mockResolvedValue(article) } });

    const result = await controller.getArticle('a');

    expect(result).toEqual({ article });
  });

  it('maps not found error to HTTP 404', async () => {
    const controller = buildController({
      getArticleUseCase: { execute: jest.fn().mockRejectedValue(new ArticleNotFoundError('x')) },
    });

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
      author: { username: 'jane', image: 'https://img/jane.png' },
    };
    const createArticleUseCase = { execute: jest.fn().mockResolvedValue(article) };
    const controller = buildController({ createArticleUseCase });

    const result = await controller.createArticle({
      article: {
        title: 'New One',
        description: 'summary',
        body: 'content',
        bodyFormat: 'html',
        tagList: ['news'],
        author: { username: 'jane', image: 'https://img/jane.png' },
      },
    });

    expect(result).toEqual({ article });
    expect(createArticleUseCase.execute).toHaveBeenCalledWith({
      title: 'New One',
      description: 'summary',
      body: 'content',
      bodyFormat: 'html',
      tagList: ['news'],
      author: { username: 'jane', image: 'https://img/jane.png' },
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
    const createArticleUseCase = { execute: jest.fn().mockResolvedValue(article) };
    const controller = buildController({ createArticleUseCase });

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
      author: undefined,
    });
  });

  it('updates article from payload', async () => {
    const article = {
      slug: 'hello-world',
      title: 'Hello World',
      description: 'updated',
      body: 'updated body',
      bodyFormat: 'html',
      tagList: ['updated'],
      createdAt: '2026-09-19T00:00:00.000Z',
      author: { username: 'blackjack-writer', image: '' },
    };
    const updateArticleUseCase = { execute: jest.fn().mockResolvedValue(article) };
    const controller = buildController({ updateArticleUseCase });

    const result = await controller.updateArticle('hello-world', {
      article: {
        description: 'updated',
        body: 'updated body',
        bodyFormat: 'html',
        tagList: ['updated'],
      },
    });

    expect(result).toEqual({ article });
    expect(updateArticleUseCase.execute).toHaveBeenCalledWith('hello-world', {
      description: 'updated',
      body: 'updated body',
      bodyFormat: 'html',
      tagList: ['updated'],
    });
  });

  it('maps update not found error to HTTP 404', async () => {
    const controller = buildController({
      updateArticleUseCase: { execute: jest.fn().mockRejectedValue(new ArticleNotFoundError('x')) },
    });

    await expect(controller.updateArticle('x', { article: { title: 'ok' } })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deletes article', async () => {
    const deleteArticleUseCase = { execute: jest.fn().mockResolvedValue(undefined) };
    const controller = buildController({ deleteArticleUseCase });

    const result = await controller.deleteArticle('hello-world');

    expect(result).toEqual({ deleted: true });
    expect(deleteArticleUseCase.execute).toHaveBeenCalledWith('hello-world');
  });

  it('maps delete not found error to HTTP 404', async () => {
    const controller = buildController({
      deleteArticleUseCase: { execute: jest.fn().mockRejectedValue(new ArticleNotFoundError('x')) },
    });

    await expect(controller.deleteArticle('x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('uploads article image', async () => {
    const uploadArticleImageUseCase = {
      execute: jest.fn().mockResolvedValue({ key: 'blog_images/a@test.com-1.jpg', url: 'https://cdn/a.jpg' }),
    };
    const controller = buildController({ uploadArticleImageUseCase });

    const result = await controller.uploadImage('a@test.com', {
      originalname: 'x.jpg',
      mimetype: 'image/jpeg',
      size: 100,
      buffer: Buffer.from('abc'),
    });

    expect(result).toEqual({ key: 'blog_images/a@test.com-1.jpg', url: 'https://cdn/a.jpg' });
    expect(uploadArticleImageUseCase.execute).toHaveBeenCalledWith({
      email: 'a@test.com',
      file: expect.any(Object),
    });
  });
});
