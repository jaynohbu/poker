import { ConfirmInput, RegisterInput, ResetInput } from '../models/auth-input.model';
import { SocialProvider } from '../models/social-provider.model';

export interface AuthGateway {
  login(email: string, password: string): Promise<void>;
  register(input: RegisterInput): Promise<void>;
  confirm(input: ConfirmInput): Promise<void>;
  resend(email: string): Promise<void>;
  forgot(email: string): Promise<void>;
  reset(input: ResetInput): Promise<void>;
  socialLogin(provider: SocialProvider): Promise<void>;
  logout(): Promise<void>;
  isAuthenticated(): Promise<boolean>;
}
