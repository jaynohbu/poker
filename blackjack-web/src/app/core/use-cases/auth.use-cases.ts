import { inject, Injectable } from '@angular/core';
import { ConfirmInput, RegisterInput, ResetInput } from '../models/auth-input.model';
import { SocialProvider } from '../models/social-provider.model';
import { AUTH_GATEWAY } from '../config/tokens';
import { AuthGateway } from '../ports/auth-gateway.port';

@Injectable({ providedIn: 'root' })
export class AuthUseCases {
  private readonly gateway = inject(AUTH_GATEWAY) as AuthGateway;

  login(email: string, password: string): Promise<void> {
    return this.gateway.login(email, password);
  }

  register(input: RegisterInput): Promise<void> {
    return this.gateway.register(input);
  }

  confirm(input: ConfirmInput): Promise<void> {
    return this.gateway.confirm(input);
  }

  resend(email: string): Promise<void> {
    return this.gateway.resend(email);
  }

  forgot(email: string): Promise<void> {
    return this.gateway.forgot(email);
  }

  reset(input: ResetInput): Promise<void> {
    return this.gateway.reset(input);
  }

  socialLogin(provider: SocialProvider): Promise<void> {
    return this.gateway.socialLogin(provider);
  }

  logout(): Promise<void> {
    return this.gateway.logout();
  }

  isAuthenticated(): Promise<boolean> {
    return this.gateway.isAuthenticated();
  }
}
