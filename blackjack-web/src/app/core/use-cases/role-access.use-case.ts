import { Injectable, computed, signal } from '@angular/core';
import { fetchAuthSession } from 'aws-amplify/auth';
import { ensureAmplifyConfigured } from '../../infra/cognito/amplify.init';
import { UserRole } from '../models/user-role.model';

@Injectable({ providedIn: 'root' })
export class RoleAccessUseCase {
  readonly role = signal<UserRole>('viewer');
  readonly canWrite = computed(() => {
    const current = this.role();
    return current === 'admin' || current === 'writer';
  });

  constructor() {
    ensureAmplifyConfigured();
  }

  async refresh(): Promise<void> {
    try {
      const session = await fetchAuthSession();
      const idGroups = session.tokens?.idToken?.payload['cognito:groups'];
      const accessGroups = session.tokens?.accessToken?.payload['cognito:groups'];
      const role = this.parseRoleFromGroups(idGroups, accessGroups);
      this.role.set(role);
    } catch {
      this.role.set('viewer');
    }
  }

  private parseRoleFromGroups(...groupSources: unknown[]): UserRole {
    for (const source of groupSources) {
      const resolved = this.firstGroupRole(source);
      if (resolved) return resolved;
    }
    return 'viewer';
  }

  private firstGroupRole(groups: unknown): UserRole | null {
    const list = this.toGroupList(groups);
    for (const item of list) {
      const role = this.groupToRole(item);
      if (role) return role;
    }
    return null;
  }

  private toGroupList(groups: unknown): string[] {
    if (Array.isArray(groups)) return groups.filter((x): x is string => typeof x === 'string');
    if (typeof groups !== 'string') return [];
    return groups.split(',').map((x) => x.trim()).filter(Boolean);
  }

  private groupToRole(value: string): UserRole | null {
    const lower = value.trim().toLowerCase();
    if (/(^|[-_:])admin(s)?($|[-_:])/.test(lower) || lower === 'admin') return 'admin';
    if (/(^|[-_:])writer(s)?($|[-_:])/.test(lower) || lower === 'writer') return 'writer';
    if (/(^|[-_:])viewer(s)?($|[-_:])/.test(lower) || lower === 'viewer') return 'viewer';
    return null;
  }
}
