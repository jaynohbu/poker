import { APIGatewayProxyEventV2, Context } from 'aws-lambda';

const init = jest.fn();
const getInstance = jest.fn(() => ({ app: 'express-app' }));
const createNestApp = jest.fn(async () => ({
  init,
  getHttpAdapter: () => ({ getInstance }),
}));
const proxy = jest.fn();
const serverlessExpress = jest.fn(() => proxy);

jest.mock('./app.factory', () => ({
  createNestApp: () => createNestApp(),
}));

jest.mock('@codegenie/serverless-express', () => ({
  __esModule: true,
  default: () => serverlessExpress(),
}));

describe('lambda handler', () => {
  beforeEach(() => {
    jest.resetModules();
    init.mockClear();
    getInstance.mockClear();
    createNestApp.mockClear();
    proxy.mockClear();
    serverlessExpress.mockClear();
  });

  it('delegates requests to the cached serverless express proxy', async () => {
    const expected = { statusCode: 200, body: '{}' };
    proxy.mockResolvedValue(expected);

    const { handler } = require('./lambda');
    const event = {
      rawPath: '/api/articles',
      requestContext: {
        stage: '$default',
        http: { path: '/api/articles' },
      },
    } as APIGatewayProxyEventV2;
    const context = {} as Context;

    await expect(handler(event, context)).resolves.toEqual(expected);
    expect(createNestApp).toHaveBeenCalledTimes(1);
    expect(init).toHaveBeenCalledTimes(1);
    expect(serverlessExpress).toHaveBeenCalledTimes(1);
    expect(proxy).toHaveBeenCalledWith(event, context);
  });

  it('removes the stage prefix from http api event paths', () => {
    const { normalizeHttpApiEventPath } = require('./lambda');
    const event = {
      rawPath: '/prod/api/articles',
      requestContext: {
        stage: 'prod',
        http: { path: '/prod/api/articles' },
      },
    } as APIGatewayProxyEventV2;

    expect(normalizeHttpApiEventPath(event)).toMatchObject({
      rawPath: '/api/articles',
      requestContext: {
        stage: 'prod',
        http: { path: '/api/articles' },
      },
    });
  });
});