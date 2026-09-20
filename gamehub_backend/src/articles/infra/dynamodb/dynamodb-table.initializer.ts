import {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
  ResourceNotFoundException,
  ResourceInUseException,
  waitUntilTableExists,
} from '@aws-sdk/client-dynamodb';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ARTICLES_TABLE_NAME, DYNAMODB_CLIENT } from './dynamodb.tokens';

@Injectable()
export class DynamoDbTableInitializer implements OnModuleInit {
  constructor(
    @Inject(DYNAMODB_CLIENT)
    private readonly client: DynamoDBClient,
    @Inject(ARTICLES_TABLE_NAME)
    private readonly tableName: string,
  ) {}

  async onModuleInit(): Promise<void> {
    if (process.env.DYNAMODB_INIT !== 'true') return;
    await this.ensureTable();
  }

  private async ensureTable(): Promise<void> {
    try {
      await this.client.send(new DescribeTableCommand({ TableName: this.tableName }));
    } catch (error) {
      if (!this.isMissingTable(error)) throw error;
      await this.createTable();
    }
  }

  private isMissingTable(error: unknown): boolean {
    return (
      error instanceof ResourceNotFoundException ||
      (error as { name?: string }).name === 'ResourceNotFoundException'
    );
  }

  private async createTable(): Promise<void> {
    try {
      await this.client.send(
        new CreateTableCommand({
          TableName: this.tableName,
          AttributeDefinitions: [{ AttributeName: 'slug', AttributeType: 'S' }],
          KeySchema: [{ AttributeName: 'slug', KeyType: 'HASH' }],
          BillingMode: 'PAY_PER_REQUEST',
        }),
      );
    } catch (error) {
      if (!this.isTableAlreadyCreated(error)) throw error;
    }

    await waitUntilTableExists(
      { client: this.client, maxWaitTime: 30 },
      { TableName: this.tableName },
    );
  }

  private isTableAlreadyCreated(error: unknown): boolean {
    return (
      error instanceof ResourceInUseException ||
      (error as { name?: string }).name === 'ResourceInUseException'
    );
  }
}
