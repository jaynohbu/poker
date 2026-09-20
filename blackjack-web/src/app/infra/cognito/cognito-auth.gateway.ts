import { Injectable } from '@angular/core';
import {
  confirmResetPassword,
  confirmSignUp,
  getCurrentUser,
  resendSignUpCode,
  resetPassword,
  signIn,
  signInWithRedirect,
  signOut,
  signUp
} from 'aws-amplify/auth';
import { ensureAmplifyConfigured } from './amplify.init';
import { ConfirmInput, RegisterInput, ResetInput } from '../../core/models/auth-input.model';
import { SocialProvider } from '../../core/models/social-provider.model';

@Injectable()
export class CognitoAuthGateway {
  constructor() {
    ensureAmplifyConfigured();
  }

  async login(email: string, password: string): Promise<void> {
    await signIn({ username: email, password });
  }

  async register(input: RegisterInput): Promise<void> {
    await signUp({
      username: input.email,
      password: input.password,
      options: {
        userAttributes: {
          email: input.email,
          nickname: input.nickname,
          'custom:avatar': input.avatarKey
        }
      }
    });
  }

  confirm(input: ConfirmInput): Promise<void> {
    return confirmSignUp({ username: input.email, confirmationCode: input.code }).then(() => undefined);
  }

  resend(email: string): Promise<void> {
    return resendSignUpCode({ username: email }).then(() => undefined);
  }

  forgot(email: string): Promise<void> {
    return resetPassword({ username: email }).then(() => undefined);
  }

  reset(input: ResetInput): Promise<void> {
    return confirmResetPassword({
      username: input.email,
      confirmationCode: input.code,
      newPassword: input.newPassword
    }).then(() => undefined);
  }

  socialLogin(provider: SocialProvider): Promise<void> {
    return signInWithRedirect({ provider });
  }

  logout(): Promise<void> {
    return signOut();
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      await getCurrentUser();
      return true;
    } catch {
      return false;
    }
  }
}
