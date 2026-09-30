import { UploadProfileImageUseCase } from './upload-profile-image.use-case';
import { ArticleImageStorage } from '../domain/article-image-upload';

describe('UploadProfileImageUseCase', () => {
  it('uploads file with profile image key', async () => {
    const storage: ArticleImageStorage = {
      upload: jest.fn().mockResolvedValue('https://cdn.example.com/profile_images/jnoh@email.com-1.jpg'),
      delete: jest.fn(),
    };
    const useCase = new UploadProfileImageUseCase(storage);
    const file = { originalname: 'photo.jpg', mimetype: 'image/jpeg', size: 100, buffer: Buffer.from('abc') };
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1000);

    const result = await useCase.execute({ email: 'jnoh@email.com', file });

    expect(result).toEqual({
      key: 'profile_images/jnoh@email.com-1.jpg',
      url: 'https://cdn.example.com/profile_images/jnoh@email.com-1.jpg',
    });
    expect(storage.upload).toHaveBeenCalledWith('profile_images/jnoh@email.com-1.jpg', file.buffer, 'image/jpeg');
    nowSpy.mockRestore();
  });

  it('rejects unsupported images', async () => {
    const storage: ArticleImageStorage = {
      upload: jest.fn(),
      delete: jest.fn(),
    };
    const useCase = new UploadProfileImageUseCase(storage);

    await expect(
      useCase.execute({
        email: 'jnoh@email.com',
        file: { originalname: 'photo.svg', mimetype: 'image/svg+xml', size: 100, buffer: Buffer.from('abc') },
      }),
    ).rejects.toThrow();
  });
});
