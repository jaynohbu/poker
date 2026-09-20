import { waitUntilTableExists } from '@aws-sdk/client-dynamodb';
import { DynamoDbTableInitializer } from './dynamodb-table.initializer';

jest.mock('@aws-sdk/client-dynamodb', () => {
  const actual = jest.requireActual('@aws-sdk/client-dynamodb');
  return {
    ...actual,
    waitUntilTableExists: jest.fn().mockResolvedValue({ state: 'SUCCESS' }),
  };
});

describe('DynamoDbTableInitializer', () => {
  beforeEach(() => {
    process.env.DYNAMODB_INIT = 'true';
  });

  afterEach(() => {
    delete process.env.DYNAMODB_INIT;
  });

  it('does nothing when table already exists', async () => {
    const client = { send: jest.fn().mockResolvedValue({}) };
    const initializer = new DynamoDbTableInitializer(client as never, 'tbl');

    await initializer.onModuleInit();

    expect(client.send).toHaveBeenCalledTimes(1);
    expect(waitUntilTableExists).not.toHaveBeenCalled();
  });

  it('creates table when not found', async () => {
    const client = {
      send: jest
        .fn()
        .mockRejectedValueOnce({ name: 'ResourceNotFoundException' })
        .mockResolvedValueOnce({}),
    };
    const initializer = new DynamoDbTableInitializer(client as never, 'tbl');

    await initializer.onModuleInit();

    expect(client.send).toHaveBeenCalledTimes(2);
    expect(waitUntilTableExists).toHaveBeenCalledTimes(1);
  });

  it('skips initialization when disabled', async () => {
    process.env.DYNAMODB_INIT = 'false';
    const client = { send: jest.fn() };
    const initializer = new DynamoDbTableInitializer(client as never, 'tbl');

    await initializer.onModuleInit();

    expect(client.send).not.toHaveBeenCalled();
  });
});
