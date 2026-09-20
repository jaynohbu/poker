import { Inject, Injectable } from '@nestjs/common';
import { GetCommand, PutCommand, ScanCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { Article } from '../../domain/article';
import { ArticlesFeed, ArticlesRepository } from '../../domain/articles.repository';
import { ARTICLES_TABLE_NAME, DYNAMODB_DOCUMENT_CLIENT } from './dynamodb.tokens';
import { mapItemToArticle, mapItemsToArticles, sortByCreatedAtDesc } from './article.mapper';

@Injectable()
export class ArticlesDynamoDbRepository implements ArticlesRepository {
  constructor(
    @Inject(DYNAMODB_DOCUMENT_CLIENT)
    private readonly client: DynamoDBDocumentClient,
    @Inject(ARTICLES_TABLE_NAME)
    private readonly tableName: string,
  ) {}

  async findArticles(limit: number, offset: number): Promise<ArticlesFeed> {
    const command = new ScanCommand({ TableName: this.tableName });
    const response = await this.client.send(command);
    const all = sortByCreatedAtDesc(mapItemsToArticles(response.Items));
    const articles = all.slice(offset, offset + limit);
    return { articles, articlesCount: all.length };
  }

  async findArticleBySlug(slug: string): Promise<Article | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { slug },
    });
    const response = await this.client.send(command);
    return mapItemToArticle(response.Item);
  }

  async saveArticle(article: Article): Promise<Article> {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        slug: article.slug,
        title: article.title,
        description: article.description,
        body: article.body,
        bodyFormat: article.bodyFormat,
        tagList: article.tagList,
        createdAt: article.createdAt,
        authorUsername: article.author.username,
        authorImage: article.author.image,
      },
    });
    await this.client.send(command);
    return article;
  }
}
