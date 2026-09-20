import {
  mapItemToArticle,
  mapItemsToArticles,
  sortByCreatedAtDesc,
} from './article.mapper';

describe('article.mapper', () => {
  it('maps one item to article', () => {
    const result = mapItemToArticle({
      slug: 'a',
      title: 't',
      description: 'd',
      body: 'b',
      bodyFormat: 'html',
      tagList: ['x'],
      createdAt: '2026-09-19T00:00:00.000Z',
      authorUsername: 'u',
      authorImage: 'img',
    });

    expect(result?.slug).toBe('a');
    expect(result?.author.username).toBe('u');
    expect(result?.bodyFormat).toBe('html');
  });

  it('defaults body format to text', () => {
    const result = mapItemToArticle({ slug: 'a' });
    expect(result?.bodyFormat).toBe('text');
  });

  it('maps item list', () => {
    const result = mapItemsToArticles([{ slug: 'a' }, { slug: 'b' }]);
    expect(result).toHaveLength(2);
  });

  it('sorts by created date descending', () => {
    const result = sortByCreatedAtDesc([
      {
        slug: '1',
        title: '',
        description: '',
        body: '',
        bodyFormat: 'text',
        tagList: [],
        createdAt: '2026-01-01',
        author: { username: '', image: '' },
      },
      {
        slug: '2',
        title: '',
        description: '',
        body: '',
        bodyFormat: 'text',
        tagList: [],
        createdAt: '2026-01-02',
        author: { username: '', image: '' },
      },
    ]);

    expect(result[0]?.slug).toBe('2');
  });
});
