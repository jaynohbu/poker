import { ArticlesSeedInitializer } from './articles-seed.initializer';

describe('ArticlesSeedInitializer', () => {
  const tableInitializer = {
    onModuleInit: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    tableInitializer.onModuleInit.mockClear();
  });

  afterEach(() => {
    delete process.env.DYNAMODB_SEED;
  });

  it('skips when seeding is disabled', async () => {
    process.env.DYNAMODB_SEED = 'false';
    const client = { send: jest.fn() };
    const initializer = new ArticlesSeedInitializer(
      client as never,
      'tbl',
      tableInitializer as never,
    );

    await initializer.onModuleInit();

    expect(client.send).not.toHaveBeenCalled();
  });

  it('skips when table already has data', async () => {
    process.env.DYNAMODB_SEED = 'true';
    const client = { send: jest.fn().mockResolvedValueOnce({ Items: [{ slug: 'x' }] }) };
    const initializer = new ArticlesSeedInitializer(
      client as never,
      'tbl',
      tableInitializer as never,
    );

    await initializer.onModuleInit();

    expect(client.send).toHaveBeenCalledTimes(1);
  });

  it('seeds data when table is empty', async () => {
    process.env.DYNAMODB_SEED = 'true';
    const client = {
      send: jest.fn().mockResolvedValueOnce({ Items: [] }).mockResolvedValue({}),
    };
    const initializer = new ArticlesSeedInitializer(
      client as never,
      'tbl',
      tableInitializer as never,
    );

    await initializer.onModuleInit();

    expect(client.send).toHaveBeenCalledTimes(4);
  });
});
