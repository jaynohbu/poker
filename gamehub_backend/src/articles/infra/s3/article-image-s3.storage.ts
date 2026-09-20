import { Inject, Injectable } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ARTICLE_IMAGE_BUCKET_NAME, ARTICLE_IMAGE_BUCKET_REGION, ARTICLE_IMAGE_S3_CLIENT } from './article-image.tokens';
import { ArticleImageStorage } from '../../domain/article-image-upload';

@Injectable()
export class ArticleImageS3Storage implements ArticleImageStorage {
  private readonly publicBaseUrl = process.env.BLOG_IMAGES_PUBLIC_BASE_URL?.replace(/\/$/, '');

  constructor(
    @Inject(ARTICLE_IMAGE_S3_CLIENT)
    private readonly client: S3Client,
    @Inject(ARTICLE_IMAGE_BUCKET_NAME)
    private readonly bucketName: string,
    @Inject(ARTICLE_IMAGE_BUCKET_REGION)
    private readonly region: string,
  ) {}

  async upload(key: string, body: Buffer, contentType: string): Promise<string> {
    await this.client.send(new PutObjectCommand({ Bucket: this.bucketName, Key: key, Body: body, ContentType: contentType }));
    if (this.publicBaseUrl) {
      return `${this.publicBaseUrl}/${encodeKey(key)}`;
    }
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${encodeKey(key)}`;
  }
}

function encodeKey(key: string): string {
  return key.split('/').map((segment) => encodeURIComponent(segment)).join('/');
}