import {
  mapItemToArticle,
  mapItemsToArticles,
  sortByCreatedAtDesc,
} from './article.mapper';

describe('article.mapper', () => {
  it('maps one item to article', () => {
    const result = mapItemToArticle({
      slug: 'a',
      language: 'ko',
      title: 't',
      description: 'd',
      body: 'b',
      bodyFormat: 'html',
      tagList: ['x'],
      createdAt: '2026-09-19T00:00:00.000Z',
      authorUsername: 'u',
      authorImage: 'img',
      content: {
        ko: { language: 'ko', title: 't', description: 'd', body: 'b', bodyFormat: 'html' },
      },
    });

    expect(result?.slug).toBe('a');
    expect(result?.author.username).toBe('u');
    expect(result?.bodyFormat).toBe('html');
    expect(result?.language).toBe('ko');
  });

  it('defaults body format to text', () => {
    const result = mapItemToArticle({ slug: 'a', content: {} });
    expect(result?.bodyFormat).toBe('text');
  });

  it('maps item list', () => {
    const result = mapItemsToArticles([{ slug: 'a', content: {} }, { slug: 'b', content: {} }]);
    expect(result).toHaveLength(2);
  });

  it('sorts by created date descending', () => {
    const result = sortByCreatedAtDesc([
      {
        slug: '1',
        language: 'ko',
        title: '',
        description: '',
        body: '',
        bodyFormat: 'text',
        tagList: [],
        createdAt: '2026-01-01',
        author: { username: '', image: '' },
        content: {},
      },
      {
        slug: '2',
        language: 'ko',
        title: '',
        description: '',
        body: '',
        bodyFormat: 'text',
        tagList: [],
        createdAt: '2026-01-02',
        author: { username: '', image: '' },
        content: {},
      },
    ]);

    expect(result[0]?.slug).toBe('2');
  });
});
