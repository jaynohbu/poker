import { TestBed } from '@angular/core/testing';
import { PROFILE_GATEWAY } from '../config/tokens';
import { ProfileUseCases } from './profile.use-cases';

describe('ProfileUseCases', () => {
  const gateway = {
    getProfile: vi.fn(),
    updateNickname: vi.fn(),
    updateAvatar: vi.fn(),
    syncArticleAuthorAvatar: vi.fn(),
    changePassword: vi.fn(),
    uploadAvatar: vi.fn().mockResolvedValue('profile_images/test.png')
  };

  let useCases: ProfileUseCases;

  beforeEach(() => {
    gateway.getProfile.mockResolvedValue({
      email: 'hero@example.com',
      nickname: 'hero',
      avatarKey: 'preset:avatar-1',
      avatarUrl: 'https://cdn/avatar.png'
    });
    TestBed.configureTestingModule({
      providers: [ProfileUseCases, { provide: PROFILE_GATEWAY, useValue: gateway }]
    });
    useCases = TestBed.inject(ProfileUseCases);
  });

  it('trims nickname before update', async () => {
    await useCases.updateNickname('  hero  ');
    expect(gateway.updateNickname).toHaveBeenCalledWith('hero');
  });

  it('sets preset avatar', async () => {
    await useCases.setPresetAvatar('preset:avatar-2');
    expect(gateway.updateAvatar).toHaveBeenCalledWith('preset:avatar-2');
    expect(gateway.syncArticleAuthorAvatar).toHaveBeenCalledWith(['hero'], 'https://cdn/avatar.png');
  });

  it('uploads avatar then updates profile', async () => {
    const file = new File(['x'], 'x.png', { type: 'image/png' });
    await useCases.uploadAvatar(file);
    expect(gateway.uploadAvatar).toHaveBeenCalled();
    expect(gateway.updateAvatar).toHaveBeenCalledWith('profile_images/test.png');
    expect(gateway.syncArticleAuthorAvatar).toHaveBeenCalledWith(['hero'], 'https://cdn/avatar.png');
  });
});
