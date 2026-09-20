import { Provider } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import {
  ARTICLES_TABLE_NAME,
  DYNAMODB_CLIENT,
  DYNAMODB_DOCUMENT_CLIENT,
} from './dynamodb.tokens';

export const dynamodbProviders: Provider[] = [
  {
    provide: DYNAMODB_CLIENT,
    useFactory: () => {
      const endpoint = process.env.DYNAMODB_ENDPOINT;
      const region = process.env.AWS_REGION ?? 'ap-northeast-2';
      const config = endpoint
        ? {
            endpoint,
            region,
            credentials: {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'local',
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'local',
            },
          }
        : { region };
      return new DynamoDBClient(config);
    },
  },
  {
    provide: DYNAMODB_DOCUMENT_CLIENT,
    inject: [DYNAMODB_CLIENT],
    useFactory: (client: DynamoDBClient) =>
      DynamoDBDocumentClient.from(client, {
        marshallOptions: { removeUndefinedValues: true },
      }),
  },
  {
    provide: ARTICLES_TABLE_NAME,
    useFactory: () => process.env.ARTICLES_TABLE_NAME ?? 'gh_articles',
  },
];
