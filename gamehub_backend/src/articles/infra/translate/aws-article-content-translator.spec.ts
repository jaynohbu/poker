import { TranslateTextCommand } from '@aws-sdk/client-translate';
import { AwsArticleContentTranslator } from './aws-article-content-translator';

describe('AwsArticleContentTranslator', () => {
  it('does not translate text inside code tags', async () => {
    const client = {
      send: jest.fn().mockImplementation(async (command: TranslateTextCommand) => {
        const text = command.input.Text ?? '';
        return { TranslatedText: `[${text}]` };
      }),
    };
    const translator = new AwsArticleContentTranslator(client as never);

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
    expect(client.send).toHaveBeenCalled();
    expect(client.send).not.toHaveBeenCalledWith(
      expect.objectContaining({ input: expect.objectContaining({ Text: 'const value = 1;' }) }),
    );
  });
});