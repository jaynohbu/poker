import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { fetchAuthSession, updatePassword, updateUserAttributes, fetchUserAttributes } from 'aws-amplify/auth';
import { getUrl } from 'aws-amplify/storage';
import { ensureAmplifyConfigured } from '../cognito/amplify.init';
import { avatarPresetMap } from '../../core/config/avatar-presets';
import { UserProfile } from '../../core/models/user-profile.model';
import { normalizePublicUrl } from '../../core/utils/public-url';
import { environment } from '../../../environments/environment';

@Injectable()
export class CognitoProfileGateway {
  constructor(private readonly http: HttpClient) {
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

  async syncArticleAuthorAvatar(usernames: string[], image: string): Promise<void> {
    const headers = await this.createAuthHeaders();
    await firstValueFrom(this.http.patch(`${environment.apiBaseUrl}/articles/authors/avatar`, { usernames, image }, { headers }));
  }

  changePassword(oldPassword: string, newPassword: string): Promise<void> {
    return updatePassword({ oldPassword, newPassword });
  }

  async uploadAvatar(file: File): Promise<string> {
    const attrs = await fetchUserAttributes();
    const email = attrs.email?.trim() ?? '';
    const formData = new FormData();
    formData.append('email', email);
    formData.append('file', file);
    const headers = await this.createAuthHeaders();
    const response = await firstValueFrom(
      this.http.post<{ key: string; url: string }>(`${environment.apiBaseUrl}/articles/profile-images`, formData, { headers }),
    );
    return normalizePublicUrl(response.url);
  }

  private async resolveAvatarUrl(avatarKey: string): Promise<string> {
    if (avatarPresetMap[avatarKey]) return avatarPresetMap[avatarKey];
    if (/^https?:\/\//i.test(avatarKey)) return normalizePublicUrl(avatarKey);
    const signed = await getUrl({ path: avatarKey });
    return normalizePublicUrl(signed.url.toString());
  }

  private async createAuthHeaders(): Promise<HttpHeaders> {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString() ?? session.tokens?.accessToken?.toString() ?? '';
      return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
    } catch {
      return new HttpHeaders();
    }
  }
}
