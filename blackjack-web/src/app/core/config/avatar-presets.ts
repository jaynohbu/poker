export const avatarPresets = [
  'preset:avatar-1',
  'preset:avatar-2',
  'preset:avatar-3',
  'preset:avatar-4',
  'preset:avatar-5'
] as const;

export const avatarPresetMap: Record<string, string> = {
  'preset:avatar-1': 'avatars/avatar-1.svg',
  'preset:avatar-2': 'avatars/avatar-2.svg',
  'preset:avatar-3': 'avatars/avatar-3.svg',
  'preset:avatar-4': 'avatars/avatar-4.svg',
  'preset:avatar-5': 'avatars/avatar-5.svg'
};
