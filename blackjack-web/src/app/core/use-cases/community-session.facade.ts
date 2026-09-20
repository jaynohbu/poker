import { Injectable, inject } from '@angular/core';
import { AuthUseCases } from './auth.use-cases';
import { ProfileUseCases } from './profile.use-cases';

@Injectable({ providedIn: 'root' })
export class CommunitySessionFacade {
  private readonly auth = inject(AuthUseCases);
  private readonly profile = inject(ProfileUseCases);

  isAuthenticated(): Promise<boolean> {
    return this.auth.isAuthenticated();
  }

  async getCurrentIdentity(): Promise<{ email: string; nickname: string } | null> {
    const signedIn = await this.auth.isAuthenticated();
    if (!signedIn) return null;

    try {
      const profile = await this.profile.getProfile();
      return { email: profile.email, nickname: profile.nickname };
    } catch {
      return null;
    }
  }
}
