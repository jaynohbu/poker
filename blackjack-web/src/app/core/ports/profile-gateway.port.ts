import { UserProfile } from '../models/user-profile.model';

export interface ProfileGateway {
  getProfile(): Promise<UserProfile>;
  updateNickname(nickname: string): Promise<void>;
  updateAvatar(avatarKey: string): Promise<void>;
  changePassword(oldPassword: string, newPassword: string): Promise<void>;
  uploadAvatar(file: File): Promise<string>;
}
