import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Context,
} from 'aws-lambda';
import serverlessExpress from '@codegenie/serverless-express';
import { createNestApp } from './app.factory';

type ProxyHandler = (
  event: APIGatewayProxyEventV2,
  context: Context,
) => Promise<APIGatewayProxyResultV2>;

let cached: ProxyHandler | null = null;

export function normalizeHttpApiEventPath(
  event: APIGatewayProxyEventV2,
): APIGatewayProxyEventV2 {
  const stage = event.requestContext.stage;
  if (!stage || stage === '$default') return event;
  const prefix = `/${stage}`;
  const rawPath = event.rawPath.startsWith(prefix)
    ? event.rawPath.slice(prefix.length) || '/'
    : event.rawPath;
  const httpPath = event.requestContext.http.path.startsWith(prefix)
    ? event.requestContext.http.path.slice(prefix.length) || '/'
    : event.requestContext.http.path;
  return {
    ...event,
    rawPath,
    requestContext: {
      ...event.requestContext,
      http: {
        ...event.requestContext.http,
        path: httpPath,
      },
    },
  };
}

async function getHandler(): Promise<ProxyHandler> {
  if (cached) return cached;
  const app = await createNestApp();
  await app.init();
  const expressApp = app.getHttpAdapter().getInstance();
  cached = serverlessExpress({ app: expressApp }) as unknown as ProxyHandler;
  return cached;
}

export const handler = async (
  event: APIGatewayProxyEventV2,
  context: Context,
): Promise<APIGatewayProxyResultV2> => {
  const proxy = await getHandler();
  return proxy(normalizeHttpApiEventPath(event), context);
};
