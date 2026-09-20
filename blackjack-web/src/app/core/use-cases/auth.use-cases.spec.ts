import { TestBed } from '@angular/core/testing';
import { AUTH_GATEWAY } from '../config/tokens';
import { AuthUseCases } from './auth.use-cases';

describe('AuthUseCases', () => {
  const gateway = {
    login: vi.fn(),
    register: vi.fn(),
    confirm: vi.fn(),
    resend: vi.fn(),
    forgot: vi.fn(),
    reset: vi.fn(),
    socialLogin: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: vi.fn().mockResolvedValue(true)
  };

  let useCases: AuthUseCases;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthUseCases, { provide: AUTH_GATEWAY, useValue: gateway }]
    });
    useCases = TestBed.inject(AuthUseCases);
  });

  it('calls login gateway', async () => {
    await useCases.login('a@a.com', '12345678');
    expect(gateway.login).toHaveBeenCalledWith('a@a.com', '12345678');
  });

  it('calls register gateway', async () => {
    await useCases.register({ email: 'a@a.com', password: 'p', nickname: 'n', avatarKey: 'preset:avatar-1' });
    expect(gateway.register).toHaveBeenCalled();
  });

  it('calls social login gateway', async () => {
    await useCases.socialLogin('Google');
    expect(gateway.socialLogin).toHaveBeenCalledWith('Google');
  });
});
