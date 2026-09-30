import { Provider } from '@nestjs/common';

export type TranslateTextInput = {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
};

export interface ArticleTranslateClient {
  translateText(input: TranslateTextInput): Promise<string>;
}

export const ARTICLE_TRANSLATE_CLIENT = Symbol('ARTICLE_TRANSLATE_CLIENT');

const OPENAI_TRANSLATION_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

function createOpenAiTranslateClient(apiKey: string, model: string): ArticleTranslateClient {
  return {
    async translateText(input: TranslateTextInput): Promise<string> {
      const response = await fetch(OPENAI_TRANSLATION_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          temperature: 0,
          messages: [
            {
              role: 'system',
              content: 'You are a professional translator. Return only the translated text with no extra commentary.',
            },
            {
              role: 'user',
              content: [
                `Translate the following text from ${input.sourceLanguage} to ${input.targetLanguage}.`,
                'Preserve meaning and natural tone.',
                'Do not add explanations.',
                '',
                input.text,
              ].join('\n'),
            },
          ],
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(`OpenAI translation request failed (${response.status}): ${message}`);
      }

      const payload = (await response.json()) as OpenAiChatCompletionsResponse;
      const translated = payload.choices?.[0]?.message?.content?.trim();
      if (!translated) {
        throw new Error('OpenAI translation response was empty');
      }
      return translated;
    },
  };
}

type OpenAiChatCompletionsResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export const articleTranslateProviders: Provider[] = [
  {
    provide: ARTICLE_TRANSLATE_CLIENT,
    useFactory: (): ArticleTranslateClient => {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY is required for article translation');
      }

      const model = process.env.OPENAI_TRANSLATION_MODEL ?? 'gpt-4o-mini';
      return createOpenAiTranslateClient(apiKey, model);
    },
  },
];