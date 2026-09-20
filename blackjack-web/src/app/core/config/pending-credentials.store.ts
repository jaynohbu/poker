import { Injectable } from '@angular/core';

const KEY = 'pending-register-creds';

@Injectable({ providedIn: 'root' })
export class PendingCredentialsStore {
  set(email: string, password: string): void {
    sessionStorage.setItem(KEY, JSON.stringify({ email, password }));
  }

  get(): { email: string; password: string } | null {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as { email: string; password: string };
    } catch {
      return null;
    }
  }

  clear(): void {
    sessionStorage.removeItem(KEY);
  }
}
