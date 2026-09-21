import { DatePipe } from '@angular/common';
import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { translations } from '../../core/config/translations';
import { LanguageStore } from '../../core/i18n/language.store';
import { RoleAccessUseCase } from '../../core/use-cases/role-access.use-case';
import { BlogApiService } from './blog-api.service';
import { BlogArticle } from './blog.models';

@Component({
  selector: 'app-blog-home-page',
  imports: [RouterLink, DatePipe],
  template: `
    <main class="shell">
      <header class="header">
        <div class="header-links">
          <a class="back" routerLink="/">{{ t('blogBackToHome') }}</a>
          @if (canWrite()) {
            <a class="write-link" routerLink="/blog/write">{{ t('blogWriteLink') }}</a>
          }
        </div>
        @if (canWrite()) {
          <a class="write-button" routerLink="/blog/write">{{ t('blogWriteEntryCta') }}</a>
        }
        @if (selectedTag()) {
          <p class="filter-chip">
            {{ t('blogFilteringBy') }} #{{ selectedTag() }}
            <a routerLink="/blog">{{ t('blogFilterClear') }}</a>
          </p>
        }
      </header>

      @if (loading()) {
        <section class="panel"><p>{{ t('blogLoading') }}</p></section>
      }

      @if (error()) {
        <section class="panel error"><p>{{ error() }}</p></section>
      }

      @if (!loading() && !error()) {
        <section class="list">
          @for (article of articles(); track article.slug) {
            <article class="item">
              <p class="meta">
                <span class="author-pill">
                  @if (article.author.image) {
                    <img class="author-avatar-img" [src]="article.author.image" [alt]="article.author.username" />
                  } @else {
                    <span class="author-avatar">{{ article.author.username.charAt(0).toUpperCase() }}</span>
                  }
                  <strong>{{ article.author.username }}</strong>
                </span>
                <span>{{ article.createdAt | date:'mediumDate' }}</span>
              </p>
              <a class="title" [routerLink]="['/blog/article', article.slug]">{{ article.title }}</a>
              <p class="desc">{{ article.description }}</p>
              <ul class="tags">
                @for (tag of article.tagList; track tag) {
                  <li>
                    <a [routerLink]="'/blog'" [queryParams]="{ tag: tag }">{{ tag }}</a>
                  </li>
                }
              </ul>
            </article>
          }
        </section>
      }
    </main>
  `,
  styles: [
    ':host { display: block; min-height: 100vh; color: #fff8e7; }',
    '.shell { width: min(980px, 94vw); margin: 0 auto; padding: 1.4rem 0 2rem; }',
    '.header h1 { margin: 0.4rem 0 0.5rem; font-size: clamp(1.8rem, 3.4vw, 2.8rem); }',
    '.header p { margin: 0 0 1rem; max-width: 70ch; line-height: 1.55; }',
    '.header-links { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }',
    '.back { color: #fff8e7; text-decoration: none; }',
    '.write-link { color: #f8dca3; text-decoration: none; border: 1px solid #ffffff44; border-radius: 999px; padding: 0.2rem 0.75rem; }',
    '.write-button { display: inline-block; margin: 0.1rem 0 1rem; padding: 0.5rem 0.95rem; border-radius: 10px; background: #f8b84c; color: #15362d; text-decoration: none; font-weight: 700; border: 1px solid #ffffff55; }',
    '.write-button:hover { filter: brightness(1.03); transform: translateY(-1px); }',
    '.filter-chip { display: inline-flex; align-items: center; gap: 0.6rem; margin: 0 0 1rem; border: 1px solid #ffffff3a; border-radius: 999px; padding: 0.25rem 0.65rem; font-size: 0.82rem; }',
    '.filter-chip a { color: #f8dca3; text-decoration: none; border-left: 1px solid #ffffff44; padding-left: 0.6rem; }',
    '.panel { border: 1px solid #ffffff3a; border-radius: 18px; background: #0000001f; padding: 1rem; }',
    '.error { border-color: #ffb6b6aa; }',
    '.list { display: grid; gap: 0.8rem; }',
    '.item { border: 1px solid #ffffff3a; border-radius: 18px; background: #0000001f; padding: 1rem; }',
    '.meta { margin: 0 0 0.4rem; display: flex; justify-content: space-between; gap: 0.8rem; font-size: 0.86rem; color: #f8dca3; }',
    '.author-pill { display: inline-flex; align-items: center; gap: 0.35rem; min-width: 0; }',
    '.author-avatar { width: 22px; height: 22px; display: inline-grid; place-content: center; border-radius: 999px; background: #f8b84c; color: #15362d; font-size: 0.72rem; font-weight: 700; }',
    '.author-avatar-img { width: 22px; height: 22px; border-radius: 999px; object-fit: cover; border: 1px solid #ffffff44; }',
    '.title { color: #fff; text-decoration: none; font-size: 1.18rem; font-weight: 700; }',
    '.desc { margin: 0.45rem 0 0; line-height: 1.45; color: #fffbf1d9; }',
    '.tags { margin: 0.65rem 0 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 0.4rem; }',
    '.tags li { border: 1px solid #ffffff36; border-radius: 999px; padding: 0.2rem 0.55rem; font-size: 0.76rem; color: #f8dca3; }',
    '.tags li a { color: inherit; text-decoration: none; }',
  ],
})
export class BlogHomePage implements OnInit {
  private readonly api = inject(BlogApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly languages = inject(LanguageStore);
  private readonly roleAccess = inject(RoleAccessUseCase);

  protected readonly language = this.languages.current;
  protected readonly canWrite = this.roleAccess.canWrite;
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly articles = signal<BlogArticle[]>([]);
  protected readonly selectedTag = signal('');
  private readonly reloadOnLanguage = effect(() => {
    void this.loadArticles(this.selectedTag(), this.language());
  });

  protected t(key: keyof (typeof translations)['en']): string {
    return translations[this.language()][key];
  }

  ngOnInit(): void {
    void this.roleAccess.refresh();
    this.route.queryParamMap.subscribe((params) => {
      this.selectedTag.set(params.get('tag')?.trim() ?? '');
    });
  }

  private async loadArticles(tag: string, language: 'en' | 'ko' | 'ja'): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      const response = await firstValueFrom(this.api.getLatestArticles(30, 0, tag || undefined, language));
      const filtered = tag
        ? response.articles.filter((article) => article.tagList.includes(tag))
        : response.articles;
      this.articles.set(filtered);
    } catch {
      this.error.set(this.t('blogLoadError'));
    } finally {
      this.loading.set(false);
    }
  }
}
