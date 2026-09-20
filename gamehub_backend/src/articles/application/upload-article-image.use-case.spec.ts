import { UploadArticleImageUseCase } from './upload-article-image.use-case';
import { ArticleImageStorage } from '../domain/article-image-upload';

describe('UploadArticleImageUseCase', () => {
  it('uploads file with email-based key', async () => {
    const storage: ArticleImageStorage = { upload: jest.fn().mockResolvedValue('https://cdn/blog.jpg') };
    const useCase = new UploadArticleImageUseCase(storage);
    const file = { originalname: 'photo.jpg', mimetype: 'image/jpeg', size: 100, buffer: Buffer.from('abc') };
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1000);

    const result = await useCase.execute({ email: 'jnoh@email.com', file });

    expect(result).toEqual({ key: 'blog_images/jnoh@email.com-1.jpg', url: 'https://cdn/blog.jpg' });
    expect(storage.upload).toHaveBeenCalledWith('blog_images/jnoh@email.com-1.jpg', file.buffer, 'image/jpeg');
    nowSpy.mockRestore();
  });

  it('rejects oversized images', async () => {
    const storage: ArticleImageStorage = { upload: jest.fn() };
    const useCase = new UploadArticleImageUseCase(storage);

    await expect(
      useCase.execute({
        email: 'jnoh@email.com',
        file: { originalname: 'photo.jpg', mimetype: 'image/jpeg', size: 6 * 1024 * 1024, buffer: Buffer.from('abc') },
      }),
    ).rejects.toThrow();
  });
});