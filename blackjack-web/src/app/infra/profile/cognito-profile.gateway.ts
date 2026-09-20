import { Injectable } from '@angular/core';
import { updatePassword, updateUserAttributes, fetchUserAttributes } from 'aws-amplify/auth';
import { getUrl, uploadData } from 'aws-amplify/storage';
import { ensureAmplifyConfigured } from '../cognito/amplify.init';
import { avatarPresetMap } from '../../core/config/avatar-presets';
import { UserProfile } from '../../core/models/user-profile.model';

@Injectable()
export class CognitoProfileGateway {
  constructor() {
    ensureAmplifyConfigured();
  }

  async getProfile(): Promise<UserProfile> {
    const attrs = await fetchUserAttributes();
    const avatarKey = attrs['custom:avatar'] ?? 'preset:avatar-1';
    const avatarUrl = await this.resolveAvatarUrl(avatarKey);
    return {
      email: attrs.email ?? '',
      nickname: attrs.nickname ?? '',
      avatarKey,
      avatarUrl
    };
  }

  updateNickname(nickname: string): Promise<void> {
    return updateUserAttributes({ userAttributes: { nickname } }).then(() => undefined);
  }

  updateAvatar(avatarKey: string): Promise<void> {
    return updateUserAttributes({ userAttributes: { 'custom:avatar': avatarKey } }).then(() => undefined);
  }

  changePassword(oldPassword: string, newPassword: string): Promise<void> {
    return updatePassword({ oldPassword, newPassword });
  }

  async uploadAvatar(file: File): Promise<string> {
    const key = `avatars/${Date.now()}-${file.name}`;
    await uploadData({ path: key, data: file, options: { contentType: file.type } }).result;
    return key;
  }

  private async resolveAvatarUrl(avatarKey: string): Promise<string> {
    if (avatarPresetMap[avatarKey]) return avatarPresetMap[avatarKey];
    const signed = await getUrl({ path: avatarKey });
    return signed.url.toString();
  }
}
