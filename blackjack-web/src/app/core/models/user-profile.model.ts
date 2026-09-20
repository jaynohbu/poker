export type UserProfile = {
  email: string;
  nickname: string;
  avatarKey: string;
  avatarUrl: string;
};

export type AvatarPreset =
  | 'preset:avatar-1'
  | 'preset:avatar-2'
  | 'preset:avatar-3'
  | 'preset:avatar-4'
  | 'preset:avatar-5';
