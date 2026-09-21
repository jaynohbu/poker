import { TranslateClient } from '@aws-sdk/client-translate';
import { Provider } from '@nestjs/common';

export const ARTICLE_TRANSLATE_CLIENT = Symbol('ARTICLE_TRANSLATE_CLIENT');

export const articleTranslateProviders: Provider[] = [
  {
    provide: ARTICLE_TRANSLATE_CLIENT,
    useFactory: () =>
      new TranslateClient({
        region: process.env.BLOG_TRANSLATE_REGION ?? process.env.AWS_REGION ?? 'ap-northeast-2',
      }),
  },
];