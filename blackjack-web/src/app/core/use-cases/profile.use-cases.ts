import { inject, Injectable } from '@angular/core';
import { PROFILE_GATEWAY } from '../config/tokens';
import { ProfileGateway } from '../ports/profile-gateway.port';
import { UserProfile } from '../models/user-profile.model';

@Injectable({ providedIn: 'root' })
export class ProfileUseCases {
  private readonly gateway = inject(PROFILE_GATEWAY) as ProfileGateway;

  getProfile(): Promise<UserProfile> {
    return this.gateway.getProfile();
  }

  updateNickname(nickname: string): Promise<void> {
    return this.gateway.updateNickname(nickname.trim());
  }

  async setPresetAvatar(avatarKey: string): Promise<void> {
    await this.gateway.updateAvatar(avatarKey);
  }

  async uploadAvatar(file: File): Promise<void> {
    const avatarKey = await this.gateway.uploadAvatar(file);
    await this.gateway.updateAvatar(avatarKey);
  }

  changePassword(oldPassword: string, newPassword: string): Promise<void> {
    return this.gateway.changePassword(oldPassword, newPassword);
  }
}
