import { UserRole } from './user-role.model';

export type RegisterInput = {
  email: string;
  password: string;
  nickname: string;
  avatarKey: string;
  role?: UserRole;
};

export type ConfirmInput = {
  email: string;
  code: string;
  password: string;
};

export type ResetInput = {
  email: string;
  code: string;
  newPassword: string;
};
