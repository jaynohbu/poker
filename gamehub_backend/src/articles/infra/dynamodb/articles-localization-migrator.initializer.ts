import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { ARTICLES_TABLE_NAME, DYNAMODB_DOCUMENT_CLIENT } from './dynamodb.tokens';

@Injectable()
export class ArticlesLocalizationMigratorInitializer implements OnModuleInit {
  constructor(
    @Inject(DYNAMODB_DOCUMENT_CLIENT)
    private readonly client: DynamoDBDocumentClient,
    @Inject(ARTICLES_TABLE_NAME)
    private readonly tableName: string,
  ) {}

  async onModuleInit(): Promise<void> {
    if (process.env.DYNAMODB_MIGRATE_ARTICLE_CONTENT !== 'true') return;
    await this.migrateLegacyArticles();
  }

  private async migrateLegacyArticles(): Promise<void> {
    const command = new ScanCommand({ TableName: this.tableName });
    const response = await this.client.send(command);
    for (const item of response.Items ?? []) {
      if (hasLocalizedContent(item)) continue;
      await this.client.send(new PutCommand({ TableName: this.tableName, Item: toLocalizedItem(item) }));
    }
  }
}

function hasLocalizedContent(item: Record<string, unknown>): boolean {
  return !!item.content && typeof item.content === 'object';
}

function toLocalizedItem(item: Record<string, unknown>): Record<string, unknown> {
  const title = asString(item.title);
  const description = asString(item.description);
  const body = asString(item.body);
  const bodyFormat = item.bodyFormat === 'html' ? 'html' : 'text';
  return {
    ...item,
    language: 'ko',
    content: {
      ko: { language: 'ko', title, description, body, bodyFormat },
    },
  };
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}