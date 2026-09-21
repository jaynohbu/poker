import { ArticlesDynamoDbRepository } from './articles-dynamodb.repository';

describe('ArticlesDynamoDbRepository', () => {
  it('returns paged articles and total count', async () => {
    const client = {
      send: jest.fn().mockResolvedValue({
        Items: [
          { slug: 'a', language: 'ko', createdAt: '2026-01-01', authorUsername: 'u', authorImage: '', content: {} },
          { slug: 'b', language: 'ko', createdAt: '2026-01-02', authorUsername: 'u', authorImage: '', content: {} },
        ],
      }),
    };
    const repository = new ArticlesDynamoDbRepository(client as never, 'tbl');

    const result = await repository.findArticles(1, 0);

    expect(result.articlesCount).toBe(2);
    expect(result.articles).toHaveLength(1);
    expect(client.send).toHaveBeenCalledTimes(1);
  });

  it('returns one article by slug', async () => {
    const client = {
      send: jest.fn().mockResolvedValue({
        Item: {
          slug: 'a',
          language: 'ko',
          title: 't',
          description: 'd',
          body: 'b',
          bodyFormat: 'text',
          tagList: [],
          createdAt: '2026-01-01',
          authorUsername: 'u',
          authorImage: '',
          content: {
            ko: { language: 'ko', title: 't', description: 'd', body: 'b', bodyFormat: 'text' },
          },
        },
      }),
    };
    const repository = new ArticlesDynamoDbRepository(client as never, 'tbl');

    const result = await repository.findArticleBySlug('a');

    expect(result?.slug).toBe('a');
    expect(client.send).toHaveBeenCalledTimes(1);
  });

  it('saves article and returns it', async () => {
    const client = {
      send: jest.fn().mockResolvedValue({}),
    };
    const repository = new ArticlesDynamoDbRepository(client as never, 'tbl');
    const article = {
      slug: 'new-post',
      language: 'ko',
      title: 'New Post',
      description: 'summary',
      body: 'content',
      bodyFormat: 'text',
      tagList: ['react'],
      createdAt: '2026-09-19T00:00:00.000Z',
      author: { username: 'u', image: '' },
      content: {
        ko: { language: 'ko', title: 'New Post', description: 'summary', body: 'content', bodyFormat: 'text' },
      },
    };

    const result = await repository.saveArticle(article);

    expect(result).toEqual(article);
    expect(client.send).toHaveBeenCalledTimes(1);
  });

  it('updates existing article', async () => {
    const existing = {
      slug: 'post-1',
      language: 'ko',
      title: 'Old',
      description: 'Old desc',
      body: 'Old body',
      bodyFormat: 'text',
      tagList: ['old'],
      createdAt: '2026-01-01T00:00:00.000Z',
      author: { username: 'u', image: '' },
      content: {
        ko: { language: 'ko', title: 'Old', description: 'Old desc', body: 'Old body', bodyFormat: 'text' },
      },
    };
    const client = {
      send: jest
        .fn()
        .mockResolvedValueOnce({ Item: { ...existing, authorUsername: 'u', authorImage: '' } })
        .mockResolvedValueOnce({}),
    };
    const repository = new ArticlesDynamoDbRepository(client as never, 'tbl');

    const result = await repository.updateArticle('post-1', {
      title: 'New',
      bodyFormat: 'html',
      tagList: ['next'],
    });

    expect(result).toEqual({
      ...existing,
      title: 'New',
      bodyFormat: 'html',
      tagList: ['next'],
    });
    expect(client.send).toHaveBeenCalledTimes(2);
  });

  it('returns null when updating missing article', async () => {
    const client = {
      send: jest.fn().mockResolvedValueOnce({ Item: undefined }),
    };
    const repository = new ArticlesDynamoDbRepository(client as never, 'tbl');

    const result = await repository.updateArticle('missing', { title: 'New' });

    expect(result).toBeNull();
    expect(client.send).toHaveBeenCalledTimes(1);
  });

  it('deletes existing article', async () => {
    const existing = {
      slug: 'post-1',
      language: 'ko',
      title: 'Old',
      description: 'Old desc',
      body: 'Old body',
      bodyFormat: 'text',
      tagList: ['old'],
      createdAt: '2026-01-01T00:00:00.000Z',
      authorUsername: 'u',
      authorImage: '',
      content: {
        ko: { language: 'ko', title: 'Old', description: 'Old desc', body: 'Old body', bodyFormat: 'text' },
      },
    };
    const client = {
      send: jest
        .fn()
        .mockResolvedValueOnce({ Item: existing })
        .mockResolvedValueOnce({}),
    };
    const repository = new ArticlesDynamoDbRepository(client as never, 'tbl');

    const result = await repository.deleteArticle('post-1');

    expect(result).toBe(true);
    expect(client.send).toHaveBeenCalledTimes(2);
  });

  it('returns false when deleting missing article', async () => {
    const client = {
      send: jest.fn().mockResolvedValueOnce({ Item: undefined }),
    };
    const repository = new ArticlesDynamoDbRepository(client as never, 'tbl');

    const result = await repository.deleteArticle('missing');

    expect(result).toBe(false);
    expect(client.send).toHaveBeenCalledTimes(1);
  });
});
