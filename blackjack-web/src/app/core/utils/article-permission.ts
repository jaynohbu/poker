import { UserRole } from '../models/user-role.model';

type CommunityIdentity = {
  email: string;
  nickname: string;
};

export function canManageArticle(role: UserRole, identity: CommunityIdentity | null, authorUsername: string): boolean {
  if (role === 'admin') return true;
  if (!identity) return false;

  const owner = normalize(authorUsername);
  if (!owner) return false;
  return resolveIdentityCandidates(identity).includes(owner);
}

function resolveIdentityCandidates(identity: CommunityIdentity): string[] {
  const emailLocal = identity.email.split('@')[0] ?? '';
  return unique([identity.nickname, identity.email, emailLocal]);
}

function unique(values: string[]): string[] {
  const set = new Set(values.map(normalize).filter(Boolean));
  return [...set];
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}
