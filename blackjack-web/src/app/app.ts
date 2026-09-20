import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Hub } from 'aws-amplify/utils';
import { translations } from './core/config/translations';
import { LanguageStore } from './core/i18n/language.store';
import { AuthUseCases } from './core/use-cases/auth.use-cases';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly auth = inject(AuthUseCases);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly languages = inject(LanguageStore);
  protected readonly authenticated = signal(false);
  protected readonly language = this.languages.current;
  protected readonly showNavigation = signal(this.router.url !== '/');

  constructor() {
    void this.refreshAuth();
    Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signedIn' || payload.event === 'signedOut' || payload.event === 'tokenRefresh') {
        void this.refreshAuth();
      }
    });
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.showNavigation.set(event.urlAfterRedirects !== '/');
        void this.refreshAuth();
      });
  }

  protected t(key: keyof (typeof translations)['en']): string {
    return translations[this.language()][key];
  }

  protected async logout(): Promise<void> {
    try {
      await this.auth.logout();
    } catch {
      // Ignore logout failures and still return to the login screen.
    }
    this.authenticated.set(false);
    await this.router.navigateByUrl('/auth/login');
  }

  private async refreshAuth(): Promise<void> {
    try {
      this.authenticated.set(await this.auth.isAuthenticated());
    } catch {
      this.authenticated.set(false);
    }
  }
}
