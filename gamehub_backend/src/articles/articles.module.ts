import { Module } from '@nestjs/common';
import { ArticlesController } from './articles.controller';
import { GetArticleUseCase } from './application/get-article.use-case';
import { ListArticlesUseCase } from './application/list-articles.use-case';
import { CreateArticleUseCase } from './application/create-article.use-case';
import { ARTICLES_REPOSITORY } from './domain/articles.repository';
import { ArticlesDynamoDbRepository } from './infra/dynamodb/articles-dynamodb.repository';
import { ArticlesSeedInitializer } from './infra/dynamodb/articles-seed.initializer';
import { DynamoDbTableInitializer } from './infra/dynamodb/dynamodb-table.initializer';
import { dynamodbProviders } from './infra/dynamodb/dynamodb.providers';

@Module({
  controllers: [ArticlesController],
  providers: [
    ...dynamodbProviders,
    DynamoDbTableInitializer,
    ArticlesSeedInitializer,
    ListArticlesUseCase,
    GetArticleUseCase,
    CreateArticleUseCase,
    {
      provide: ARTICLES_REPOSITORY,
      useClass: ArticlesDynamoDbRepository,
    },
  ],
})
export class ArticlesModule {}
