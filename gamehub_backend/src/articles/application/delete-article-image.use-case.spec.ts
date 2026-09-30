import { DeleteArticleImageUseCase } from './delete-article-image.use-case';
import { ArticleImageStorage } from '../domain/article-image-upload';

describe('DeleteArticleImageUseCase', () => {
  it('deletes uploaded blog image by key', async () => {
    const storage: ArticleImageStorage = {
      upload: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    const useCase = new DeleteArticleImageUseCase(storage);

    const result = await useCase.execute({ key: 'blog_images/a@test.com-1.jpg' });

    expect(result).toEqual({ deleted: true });
    expect(storage.delete).toHaveBeenCalledWith('blog_images/a@test.com-1.jpg');
  });

  it('rejects keys outside blog_images prefix', async () => {
    const storage: ArticleImageStorage = {
      upload: jest.fn(),
      delete: jest.fn(),
    };
    const useCase = new DeleteArticleImageUseCase(storage);

    await expect(useCase.execute({ key: 'profile_images/a.png' })).rejects.toThrow();
  });
});
