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
    await this.syncAuthorAvatar();
  }

  async uploadAvatar(file: File): Promise<void> {
    const avatarKey = await this.gateway.uploadAvatar(file);
    await this.gateway.updateAvatar(avatarKey);
    await this.syncAuthorAvatar();
  }

  changePassword(oldPassword: string, newPassword: string): Promise<void> {
    return this.gateway.changePassword(oldPassword, newPassword);
  }

  private async syncAuthorAvatar(): Promise<void> {
    const profile = await this.gateway.getProfile();
    const usernames = resolveAuthorUsernames(profile);
    if (usernames.length === 0 || !profile.avatarUrl.trim()) return;
    await this.gateway.syncArticleAuthorAvatar(usernames, profile.avatarUrl);
  }
}

function resolveAuthorUsernames(profile: UserProfile): string[] {
  const nickname = profile.nickname.trim();
  const emailLocal = profile.email.split('@')[0]?.trim() ?? '';
  return [...new Set([nickname, emailLocal].filter(Boolean))];
}
