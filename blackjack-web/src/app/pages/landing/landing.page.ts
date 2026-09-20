import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Language } from '../../core/models/language.model';
import { translations } from '../../core/config/translations';
import { LanguageStore } from '../../core/i18n/language.store';
import { AuthUseCases } from '../../core/use-cases/auth.use-cases';
import { BlogApiService } from '../../features/blog/blog-api.service';
import { BlogArticle } from '../../features/blog/blog.models';
import { RoleAccessUseCase } from '../../core/use-cases/role-access.use-case';

@Component({
  selector: 'app-landing-page',
  imports: [RouterLink, DatePipe],
  templateUrl: './landing.page.html',
  styleUrl: './landing.page.scss'
})
export class LandingPage implements OnInit {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthUseCases);
  private readonly languages = inject(LanguageStore);
  private readonly blogApi = inject(BlogApiService);
  private readonly roleAccess = inject(RoleAccessUseCase);
  protected readonly language = this.languages.current;
  protected readonly canWrite = this.roleAccess.canWrite;
  protected readonly authenticated = signal(false);
  protected readonly blogLoading = signal(true);
  protected readonly blogError = signal(false);
  protected readonly latestPosts = signal<BlogArticle[]>([]);
  protected readonly options = [
    { code: 'en' as const, label: 'English' },
    { code: 'ko' as const, label: '한국어' }
  ];

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadLatestPosts(), this.roleAccess.refresh(), this.refreshAuth()]);
  }

  protected t(key: keyof (typeof translations)['en']): string {
    return translations[this.language()][key];
  }

  protected setLanguage(code: Language): void {
    this.languages.set(code);
  }

  protected isLanguage(code: Language): boolean {
    return this.language() === code;
  }

  protected start(): void {
    this.router.navigateByUrl('/auth/login');
  }

  protected async logout(): Promise<void> {
    try {
      await this.auth.logout();
    } finally {
      this.authenticated.set(false);
      await this.router.navigateByUrl('/auth/login');
    }
  }

  private async loadLatestPosts(): Promise<void> {
    try {
      const response = await firstValueFrom(this.blogApi.getLatestArticles(3, 0));
      this.latestPosts.set(response.articles);
    } catch {
      this.blogError.set(true);
    } finally {
      this.blogLoading.set(false);
    }
  }

  private async refreshAuth(): Promise<void> {
    try {
      this.authenticated.set(await this.auth.isAuthenticated());
    } catch {
      this.authenticated.set(false);
    }
  }
}
