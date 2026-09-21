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
import { UpdateArticleUseCase } from './application/update-article.use-case';
import { DeleteArticleUseCase } from './application/delete-article.use-case';
import { UploadArticleImageUseCase } from './application/upload-article-image.use-case';
import { ArticleImageS3Storage } from './infra/s3/article-image-s3.storage';
import { ARTICLE_IMAGE_STORAGE } from './domain/article-image-upload';
import { articleImageProviders } from './infra/s3/article-image.tokens';
import { articleTranslateProviders } from './infra/translate/article-translate.tokens';
import { AwsArticleContentTranslator } from './infra/translate/aws-article-content-translator';
import { ARTICLE_CONTENT_TRANSLATOR } from './application/article-content-translator';
import { ArticlesLocalizationMigratorInitializer } from './infra/dynamodb/articles-localization-migrator.initializer';

@Module({
  controllers: [ArticlesController],
  providers: [
    ...dynamodbProviders,
    ...articleImageProviders,
    ...articleTranslateProviders,
    DynamoDbTableInitializer,
    ArticlesSeedInitializer,
    ArticlesLocalizationMigratorInitializer,
    ListArticlesUseCase,
    GetArticleUseCase,
    CreateArticleUseCase,
    UpdateArticleUseCase,
    DeleteArticleUseCase,
    UploadArticleImageUseCase,
    {
      provide: ARTICLES_REPOSITORY,
      useClass: ArticlesDynamoDbRepository,
    },
    {
      provide: ARTICLE_IMAGE_STORAGE,
      useClass: ArticleImageS3Storage,
    },
    {
      provide: ARTICLE_CONTENT_TRANSLATOR,
      useClass: AwsArticleContentTranslator,
    },
  ],
})
export class ArticlesModule {}
