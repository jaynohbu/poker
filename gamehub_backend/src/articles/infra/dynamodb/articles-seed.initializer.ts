import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { ARTICLES_TABLE_NAME, DYNAMODB_DOCUMENT_CLIENT } from './dynamodb.tokens';
import { SAMPLE_ARTICLES } from './sample-articles';
import { DynamoDbTableInitializer } from './dynamodb-table.initializer';

@Injectable()
export class ArticlesSeedInitializer implements OnModuleInit {
  constructor(
    @Inject(DYNAMODB_DOCUMENT_CLIENT)
    private readonly client: DynamoDBDocumentClient,
    @Inject(ARTICLES_TABLE_NAME)
    private readonly tableName: string,
    private readonly tableInitializer: DynamoDbTableInitializer,
  ) {}

  async onModuleInit(): Promise<void> {
    if (process.env.DYNAMODB_SEED !== 'true') return;

    await this.tableInitializer.onModuleInit();
    if (await this.hasAnyArticle()) return;
    await this.seedArticles();
  }

  private async hasAnyArticle(): Promise<boolean> {
    const command = new ScanCommand({ TableName: this.tableName, Limit: 1 });
    const response = await this.client.send(command);
    return (response.Items?.length ?? 0) > 0;
  }

  private async seedArticles(): Promise<void> {
    for (const article of SAMPLE_ARTICLES) {
      const command = new PutCommand({
        TableName: this.tableName,
        Item: {
          slug: article.slug,
          language: article.language,
          title: article.title,
          description: article.description,
          body: article.body,
          bodyFormat: article.bodyFormat,
          tagList: article.tagList,
          createdAt: article.createdAt,
          authorUsername: article.author.username,
          authorImage: article.author.image,
          content: article.content,
        },
      });
      await this.client.send(command);
    }
  }
}
