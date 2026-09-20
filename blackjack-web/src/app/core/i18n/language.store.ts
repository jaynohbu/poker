import { Injectable, signal } from '@angular/core';
import { Language } from '../models/language.model';

const KEY = 'ui-language';

@Injectable({ providedIn: 'root' })
export class LanguageStore {
  readonly current = signal<Language>(this.load());

  set(language: Language): void {
    this.current.set(language);
    const storage = this.storage();
    if (storage) storage.setItem(KEY, language);
  }

  private load(): Language {
    const storage = this.storage();
    const value = storage ? storage.getItem(KEY) : null;
    return value === 'ko' || value === 'ja' ? value : 'en';
  }

  private storage(): Storage | null {
    const storage = (globalThis as { localStorage?: Storage }).localStorage;
    return storage && typeof storage.getItem === 'function' ? storage : null;
  }
}
