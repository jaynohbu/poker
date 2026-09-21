import { Inject, Injectable } from '@nestjs/common';
import { TranslateClient, TranslateTextCommand } from '@aws-sdk/client-translate';
import { ArticleContent, ArticleLanguage } from '../../domain/article';
import { ARTICLE_TRANSLATE_CLIENT } from './article-translate.tokens';
import { ArticleContentTranslator } from '../../application/article-content-translator';

@Injectable()
export class AwsArticleContentTranslator implements ArticleContentTranslator {
  constructor(
    @Inject(ARTICLE_TRANSLATE_CLIENT)
    private readonly client: TranslateClient,
  ) {}

  async translateContent(content: ArticleContent, sourceLanguage: ArticleLanguage, targetLanguage: ArticleLanguage): Promise<ArticleContent> {
    if (sourceLanguage === targetLanguage) {
      return normalizeContent(content, targetLanguage);
    }

    return {
      language: targetLanguage,
      title: await translatePlainText(this.client, content.title, sourceLanguage, targetLanguage),
      description: await translatePlainText(this.client, content.description, sourceLanguage, targetLanguage),
      body: content.bodyFormat === 'html'
        ? await translateHtml(this.client, content.body, sourceLanguage, targetLanguage)
        : await translatePlainText(this.client, content.body, sourceLanguage, targetLanguage),
      bodyFormat: content.bodyFormat,
    };
  }
}

async function translatePlainText(
  client: TranslateClient,
  text: string,
  sourceLanguage: ArticleLanguage,
  targetLanguage: ArticleLanguage,
): Promise<string> {
  const chunks = splitText(text);
  const translated: string[] = [];
  for (const chunk of chunks) translated.push(await translateChunk(client, chunk, sourceLanguage, targetLanguage));
  return translated.join('');
}

async function translateHtml(
  client: TranslateClient,
  html: string,
  sourceLanguage: ArticleLanguage,
  targetLanguage: ArticleLanguage,
): Promise<string> {
  const parts = html.split(/(<[^>]+>)/g);
  const translated: string[] = [];
  let insideCode = false;
  for (const part of parts) {
    if (!part) {
      translated.push(part);
      continue;
    }

    if (part.startsWith('<')) {
      insideCode = updateCodeState(part, insideCode);
      translated.push(part);
      continue;
    }

    if (insideCode) {
      translated.push(part);
      continue;
    }

    translated.push(await translatePlainText(client, part, sourceLanguage, targetLanguage));
  }
  return translated.join('');
}

function updateCodeState(tag: string, current: boolean): boolean {
  if (/^<code\b/i.test(tag)) return true;
  if (/^<\/code>/i.test(tag)) return false;
  return current;
}

async function translateChunk(
  client: TranslateClient,
  text: string,
  sourceLanguage: ArticleLanguage,
  targetLanguage: ArticleLanguage,
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return text;

  const response = await client.send(
    new TranslateTextCommand({ SourceLanguageCode: sourceLanguage, TargetLanguageCode: targetLanguage, Text: trimmed }),
  );
  return restoreWhitespace(text, response.TranslatedText ?? '');
}

function splitText(text: string): string[] {
  if (Buffer.byteLength(text, 'utf8') <= 9000) return [text];
  return text.split(/(\n\s*\n)/g).flatMap((part) => splitByBytes(part, 9000));
}

function splitByBytes(text: string, limit: number): string[] {
  if (Buffer.byteLength(text, 'utf8') <= limit) return [text];
  const parts: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(text.length, start + Math.floor(limit / 2));
    while (end > start && Buffer.byteLength(text.slice(start, end), 'utf8') > limit) end -= 1;
    parts.push(text.slice(start, end));
    start = end;
  }
  return parts;
}

function normalizeContent(content: ArticleContent, language: ArticleLanguage): ArticleContent {
  return {
    language,
    title: content.title.trim(),
    description: content.description.trim(),
    body: content.body.trim(),
    bodyFormat: content.bodyFormat,
  };
}

function restoreWhitespace(original: string, translated: string): string {
  const leading = original.match(/^\s*/)?.[0] ?? '';
  const trailing = original.match(/\s*$/)?.[0] ?? '';
  return `${leading}${translated}${trailing}`;
}