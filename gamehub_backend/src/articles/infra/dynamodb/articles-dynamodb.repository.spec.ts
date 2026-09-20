import { ArticlesDynamoDbRepository } from './articles-dynamodb.repository';

describe('ArticlesDynamoDbRepository', () => {
  it('returns paged articles and total count', async () => {
    const client = {
      send: jest.fn().mockResolvedValue({
        Items: [
          { slug: 'a', createdAt: '2026-01-01', authorUsername: 'u', authorImage: '' },
          { slug: 'b', createdAt: '2026-01-02', authorUsername: 'u', authorImage: '' },
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
          title: 't',
          description: 'd',
          body: 'b',
          bodyFormat: 'text',
          tagList: [],
          createdAt: '2026-01-01',
          authorUsername: 'u',
          authorImage: '',
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
      title: 'New Post',
      description: 'summary',
      body: 'content',
      bodyFormat: 'text',
      tagList: ['react'],
      createdAt: '2026-09-19T00:00:00.000Z',
      author: { username: 'u', image: '' },
    };

    const result = await repository.saveArticle(article);

    expect(result).toEqual(article);
    expect(client.send).toHaveBeenCalledTimes(1);
  });
});
