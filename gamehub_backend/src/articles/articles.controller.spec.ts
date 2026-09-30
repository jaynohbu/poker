import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ArticlesController } from './articles.controller';
import { ArticleNotFoundError } from './application/article-not-found.error';

function buildController(overrides: Partial<Record<string, { execute: jest.Mock }>> = {}): ArticlesController {
  const listArticlesUseCase = overrides.listArticlesUseCase ?? { execute: jest.fn() };
  const getArticleUseCase = overrides.getArticleUseCase ?? { execute: jest.fn() };
  const createArticleUseCase = overrides.createArticleUseCase ?? { execute: jest.fn() };
  const syncArticleAuthorAvatarUseCase = overrides.syncArticleAuthorAvatarUseCase ?? { execute: jest.fn() };
  const updateArticleUseCase = overrides.updateArticleUseCase ?? { execute: jest.fn() };
  const deleteArticleUseCase = overrides.deleteArticleUseCase ?? { execute: jest.fn() };
  const uploadArticleImageUseCase = overrides.uploadArticleImageUseCase ?? { execute: jest.fn() };
  const uploadProfileImageUseCase = overrides.uploadProfileImageUseCase ?? { execute: jest.fn() };
  const deleteArticleImageUseCase = overrides.deleteArticleImageUseCase ?? { execute: jest.fn() };

  return new ArticlesController(
    listArticlesUseCase as never,
    getArticleUseCase as never,
    createArticleUseCase as never,
    syncArticleAuthorAvatarUseCase as never,
    updateArticleUseCase as never,
    deleteArticleUseCase as never,
    uploadArticleImageUseCase as never,
    uploadProfileImageUseCase as never,
    deleteArticleImageUseCase as never,
  );
}

describe('ArticlesController', () => {
  const ownerArticle = {
    slug: 'hello-world',
    language: 'ko',
    title: 'Hello World',
    description: 'updated',
    body: 'updated body',
    bodyFormat: 'html',
    tagList: ['updated'],
    createdAt: '2026-09-19T00:00:00.000Z',
    author: { username: 'jane', image: 'https://img/jane.png' },
    content: {
      ko: { language: 'ko', title: 'Hello World', description: 'updated', body: 'updated body', bodyFormat: 'html' },
    },
  };

  it('returns article list with normalized query', async () => {
    const listArticlesUseCase = { execute: jest.fn().mockResolvedValue({ articles: [], articlesCount: 0 }) };
    const controller = buildController({ listArticlesUseCase });

    const result = await controller.getArticles('-1', 'abc', 'ko');

    expect(result).toEqual({ articles: [], articlesCount: 0 });
    expect(listArticlesUseCase.execute).toHaveBeenCalledWith(0, 0, 'ko');
  });

  it('returns one article', async () => {
    const article = {
      slug: 'a',
      language: 'ko',
      title: 't',
      description: 'd',
      body: 'b',
      bodyFormat: 'text',
      tagList: [],
      createdAt: '2026-01-01',
      author: { username: 'u', image: '' },
      content: {
        ko: { language: 'ko', title: 't', description: 'd', body: 'b', bodyFormat: 'text' },
      },
    };
    const controller = buildController({ getArticleUseCase: { execute: jest.fn().mockResolvedValue(article) } });

    const result = await controller.getArticle('a', 'ko');

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
      language: 'ko',
      title: 'New One',
      description: 'summary',
      body: 'content',
      bodyFormat: 'html',
      tagList: ['news'],
      createdAt: '2026-09-19T00:00:00.000Z',
      author: { username: 'jane', image: 'https://img/jane.png' },
      content: {
        ko: { language: 'ko', title: 'New One', description: 'summary', body: 'content', bodyFormat: 'html' },
      },
    };
    const createArticleUseCase = { execute: jest.fn().mockResolvedValue(article) };
    const controller = buildController({ createArticleUseCase });

    const result = await controller.createArticle({
      article: {
        language: 'ko',
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
      language: 'ko',
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
      language: 'ko',
      title: 'New Two',
      description: 'summary',
      body: 'content',
      bodyFormat: 'text',
      tagList: [],
      createdAt: '2026-09-19T00:00:00.000Z',
      author: { username: 'blackjack-writer', image: '' },
      content: {
        ko: { language: 'ko', title: 'New Two', description: 'summary', body: 'content', bodyFormat: 'text' },
      },
    };
    const createArticleUseCase = { execute: jest.fn().mockResolvedValue(article) };
    const controller = buildController({ createArticleUseCase });

    await controller.createArticle({
      article: {
        language: 'ko',
        title: 'New Two',
        description: 'summary',
        body: 'content',
      },
    });

    expect(createArticleUseCase.execute).toHaveBeenCalledWith({
      language: 'ko',
      title: 'New Two',
      description: 'summary',
      body: 'content',
      bodyFormat: 'text',
      tagList: [],
      author: undefined,
    });
  });

  it('syncs author avatar image', async () => {
    const syncArticleAuthorAvatarUseCase = { execute: jest.fn().mockResolvedValue({ updated: 2 }) };
    const controller = buildController({ syncArticleAuthorAvatarUseCase });

    const result = await controller.syncAuthorAvatar({ usernames: ['hero'], image: 'https://cdn/avatar.png' });

    expect(result).toEqual({ updated: 2 });
    expect(syncArticleAuthorAvatarUseCase.execute).toHaveBeenCalledWith({ usernames: ['hero'], image: 'https://cdn/avatar.png' });
  });

  it('updates article from payload', async () => {
    const updateArticleUseCase = { execute: jest.fn().mockResolvedValue(ownerArticle) };
    const getArticleUseCase = { execute: jest.fn().mockResolvedValue(ownerArticle) };
    const controller = buildController({ updateArticleUseCase, getArticleUseCase });
    const token = buildToken({
      nickname: 'jane',
      'cognito:groups': ['writer'],
    });

    const result = await controller.updateArticle('hello-world', {
      article: {
        language: 'ko',
        description: 'updated',
        body: 'updated body',
        bodyFormat: 'html',
        tagList: ['updated'],
        author: { username: 'jane', image: 'https://img/jane-2.png' },
      },
    }, `Bearer ${token}`);

    expect(result).toEqual({ article: ownerArticle });
    expect(updateArticleUseCase.execute).toHaveBeenCalledWith('hello-world', {
      language: 'ko',
      description: 'updated',
      body: 'updated body',
      bodyFormat: 'html',
      tagList: ['updated'],
      author: { username: 'jane', image: 'https://img/jane-2.png' },
    });
  });

  it('allows admin to update other author article', async () => {
    const existing = {
      ...ownerArticle,
      author: { username: 'someone-else', image: '' },
    };
    const updateArticleUseCase = { execute: jest.fn().mockResolvedValue(existing) };
    const getArticleUseCase = { execute: jest.fn().mockResolvedValue(existing) };
    const controller = buildController({ updateArticleUseCase, getArticleUseCase });
    const token = buildToken({
      nickname: 'admin-user',
      'cognito:groups': ['admins'],
    });

    await controller.updateArticle('hello-world', {
      article: { title: 'updated by admin' },
    }, `Bearer ${token}`);

    expect(updateArticleUseCase.execute).toHaveBeenCalledWith('hello-world', { title: 'updated by admin' });
  });

  it('forbids writer from updating other author article', async () => {
    const existing = {
      ...ownerArticle,
      author: { username: 'owner-user', image: '' },
    };
    const updateArticleUseCase = { execute: jest.fn().mockResolvedValue(existing) };
    const getArticleUseCase = { execute: jest.fn().mockResolvedValue(existing) };
    const controller = buildController({ updateArticleUseCase, getArticleUseCase });
    const token = buildToken({
      nickname: 'different-user',
      'cognito:groups': ['writer'],
    });

    await expect(controller.updateArticle('hello-world', {
      article: { title: 'blocked update' },
    }, `Bearer ${token}`)).rejects.toBeInstanceOf(ForbiddenException);
    expect(updateArticleUseCase.execute).not.toHaveBeenCalled();
  });

  it('maps update not found error to HTTP 404', async () => {
    const getArticleUseCase = { execute: jest.fn().mockRejectedValue(new ArticleNotFoundError('x')) };
    const controller = buildController({
      getArticleUseCase,
      updateArticleUseCase: { execute: jest.fn().mockRejectedValue(new ArticleNotFoundError('x')) },
    });
    const token = buildToken({ nickname: 'jane', 'cognito:groups': ['writer'] });

    await expect(controller.updateArticle('x', { article: { language: 'ko', title: 'ok' } }, `Bearer ${token}`)).rejects.toBeInstanceOf(NotFoundException);
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

  it('deletes article image by key', async () => {
    const deleteArticleImageUseCase = {
      execute: jest.fn().mockResolvedValue({ deleted: true }),
    };
    const controller = buildController({ deleteArticleImageUseCase });

    const result = await controller.deleteImage('blog_images/a@test.com-1.jpg');

    expect(result).toEqual({ deleted: true });
    expect(deleteArticleImageUseCase.execute).toHaveBeenCalledWith({ key: 'blog_images/a@test.com-1.jpg' });
  });

  it('uploads profile image', async () => {
    const uploadProfileImageUseCase = {
      execute: jest.fn().mockResolvedValue({ key: 'profile_images/a@test.com-1.jpg', url: 'https://cdn/a.jpg' }),
    };
    const controller = buildController({ uploadProfileImageUseCase });

    const result = await controller.uploadProfileImage('a@test.com', {
      originalname: 'x.jpg',
      mimetype: 'image/jpeg',
      size: 100,
      buffer: Buffer.from('abc'),
    });

    expect(result).toEqual({ key: 'profile_images/a@test.com-1.jpg', url: 'https://cdn/a.jpg' });
    expect(uploadProfileImageUseCase.execute).toHaveBeenCalledWith({
      email: 'a@test.com',
      file: expect.any(Object),
    });
  });
});

function buildToken(payload: Record<string, unknown>): string {
  const header = toBase64Url({ alg: 'none', typ: 'JWT' });
  const body = toBase64Url(payload);
  return `${header}.${body}.signature`;
}

function toBase64Url(value: unknown): string {
  return Buffer.from(JSON.stringify(value), 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}
