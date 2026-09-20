import { Injectable, computed, signal } from '@angular/core';
import { fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';
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
      const [attrs, session] = await Promise.all([fetchUserAttributes(), fetchAuthSession()]);
      const role = this.parseRole(attrs['custom:role'], session.tokens?.idToken?.payload['cognito:groups']);
      this.role.set(role);
    } catch {
      this.role.set('viewer');
    }
  }

  private parseRole(customRole: unknown, groups: unknown): UserRole {
    const normalizedRole = this.normalizeRole(customRole);
    if (normalizedRole) return normalizedRole;
    const firstGroupRole = this.firstGroupRole(groups);
    return firstGroupRole ?? 'viewer';
  }

  private firstGroupRole(groups: unknown): UserRole | null {
    if (!Array.isArray(groups)) return null;
    for (const item of groups) {
      const role = this.normalizeRole(item);
      if (role) return role;
    }
    return null;
  }

  private normalizeRole(value: unknown): UserRole | null {
    if (typeof value !== 'string') return null;
    const lower = value.trim().toLowerCase();
    if (lower === 'admin' || lower === 'writer' || lower === 'viewer') return lower;
    return null;
  }
}
