import { Inject, Injectable } from '@nestjs/common';
import { DeleteCommand, GetCommand, PutCommand, ScanCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { Article, UpdateArticleInput } from '../../domain/article';
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
    return article;
  }

  async updateArticle(slug: string, input: UpdateArticleInput): Promise<Article | null> {
    const existing = await this.findArticleBySlug(slug);
    if (!existing) return null;

    const updated: Article = {
      ...existing,
      ...input,
      language: input.language ?? existing.language,
      title: input.title ?? existing.title,
      description: input.description ?? existing.description,
      body: input.body ?? existing.body,
      bodyFormat: input.bodyFormat ?? existing.bodyFormat,
      tagList: input.tagList ?? existing.tagList,
      content: existing.content,
    };

    await this.saveArticle(updated);
    return updated;
  }

  async syncAuthorImage(usernames: string[], image: string): Promise<number> {
    const normalizedNames = normalizeUsernames(usernames);
    if (normalizedNames.length === 0) return 0;

    const command = new ScanCommand({ TableName: this.tableName });
    const response = await this.client.send(command);
    const matches = mapItemsToArticles(response.Items).filter((article) => shouldSyncAvatar(article, normalizedNames, image));

    for (const article of matches) {
      await this.saveArticle({ ...article, author: { ...article.author, image } });
    }

    return matches.length;
  }

  async deleteArticle(slug: string): Promise<boolean> {
    const existing = await this.findArticleBySlug(slug);
    if (!existing) return false;

    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: { slug },
    });
    await this.client.send(command);
    return true;
  }
}

function normalizeUsernames(usernames: string[]): string[] {
  return [...new Set(usernames.map((username) => username.trim().toLowerCase()).filter(Boolean))];
}

function shouldSyncAvatar(article: Article, usernames: string[], image: string): boolean {
  const author = article.author.username.trim().toLowerCase();
  return usernames.includes(author) && article.author.image !== image;
}
