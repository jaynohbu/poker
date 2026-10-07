import { OpenAiArticleContentTranslator } from './aws-article-content-translator';

describe('OpenAiArticleContentTranslator', () => {
  it('does not translate text inside code tags', async () => {
    const client = {
      translateText: jest.fn().mockImplementation(async ({ text }: { text: string }) => {
        return `[${text}]`;
      }),
    };
    const translator = new OpenAiArticleContentTranslator(client as never);

    const result = await translator.translateContent(
      {
        language: 'ko',
        title: '제목',
        description: '설명',
        body: '<p>설명</p><pre><code>const value = 1;</code></pre><p>마무리</p>',
        bodyFormat: 'html',
      },
      'ko',
      'en',
    );

    expect(result.body).toContain('<code>const value = 1;</code>');
    expect(result.body).toContain('<p>[설명]</p>');
    expect(result.body).toContain('<p>[마무리]</p>');
    expect(client.translateText).toHaveBeenCalled();
    expect(client.translateText).not.toHaveBeenCalledWith(
      expect.objectContaining({ text: 'const value = 1;' }),
    );
  });

  it('translates long plain text in multiple chunks', async () => {
    const client = {
      translateText: jest.fn().mockImplementation(async ({ text }: { text: string }) => text),
    };
    const translator = new OpenAiArticleContentTranslator(client as never);
    const body = 'a'.repeat(9501);

    const result = await translator.translateContent(
      {
        language: 'ko',
        title: body,
        description: '설명',
        body,
        bodyFormat: 'text',
      },
      'ko',
      'en',
    );

    expect(result.title).toBe(body);
    expect(client.translateText).toHaveBeenCalledTimes(7);
  });
});