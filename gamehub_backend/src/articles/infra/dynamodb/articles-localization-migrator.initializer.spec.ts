import { ArticlesLocalizationMigratorInitializer } from './articles-localization-migrator.initializer';

describe('ArticlesLocalizationMigratorInitializer', () => {
  afterEach(() => {
    delete process.env.DYNAMODB_MIGRATE_ARTICLE_CONTENT;
  });

  it('skips when migration is disabled', async () => {
    process.env.DYNAMODB_MIGRATE_ARTICLE_CONTENT = 'false';
    const client = { send: jest.fn() };
    const initializer = new ArticlesLocalizationMigratorInitializer(client as never, 'tbl');

    await initializer.onModuleInit();

    expect(client.send).not.toHaveBeenCalled();
  });

  it('backfills legacy articles only', async () => {
    process.env.DYNAMODB_MIGRATE_ARTICLE_CONTENT = 'true';
    const client = {
      send: jest
        .fn()
        .mockResolvedValueOnce({
          Items: [
            {
              slug: 'legacy',
              title: '제목',
              description: '설명',
              body: '본문',
              bodyFormat: 'text',
              authorUsername: 'u',
              authorImage: '',
            },
            {
              slug: 'ready',
              content: { ko: { language: 'ko', title: 't', description: 'd', body: 'b', bodyFormat: 'text' } },
            },
          ],
        })
        .mockResolvedValue({}),
    };
    const initializer = new ArticlesLocalizationMigratorInitializer(client as never, 'tbl');

    await initializer.onModuleInit();

    expect(client.send).toHaveBeenCalledTimes(2);
  });
});