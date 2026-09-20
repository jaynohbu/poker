import { Provider } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';

export const ARTICLE_IMAGE_S3_CLIENT = Symbol('ARTICLE_IMAGE_S3_CLIENT');
export const ARTICLE_IMAGE_BUCKET_NAME = Symbol('ARTICLE_IMAGE_BUCKET_NAME');
export const ARTICLE_IMAGE_BUCKET_REGION = Symbol('ARTICLE_IMAGE_BUCKET_REGION');

export const articleImageProviders: Provider[] = [
  {
    provide: ARTICLE_IMAGE_S3_CLIENT,
    useFactory: () =>
      new S3Client({
        region: process.env.BLOG_IMAGES_REGION ?? process.env.AWS_REGION ?? 'ap-northeast-2',
      }),
  },
  {
    provide: ARTICLE_IMAGE_BUCKET_NAME,
    useFactory: () => process.env.BLOG_IMAGES_BUCKET ?? 'gh_blog_images',
  },
  {
    provide: ARTICLE_IMAGE_BUCKET_REGION,
    useFactory: () => process.env.BLOG_IMAGES_REGION ?? process.env.AWS_REGION ?? 'ap-northeast-2',
  },
];