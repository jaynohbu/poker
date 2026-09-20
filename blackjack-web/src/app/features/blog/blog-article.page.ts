import { DatePipe } from '@angular/common';
import { Component, OnInit, SecurityContext, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { translations } from '../../core/config/translations';
import { LanguageStore } from '../../core/i18n/language.store';
import { BlogApiService } from './blog-api.service';
import { BlogArticle } from './blog.models';

@Component({
  selector: 'app-blog-article-page',
  imports: [RouterLink, DatePipe],
  template: `
    <main class="shell">
      <a class="back" routerLink="/blog">{{ t('blogArticleBack') }}</a>

      @if (loading()) {
        <section class="panel"><p>{{ t('blogArticleLoading') }}</p></section>
      }

      @if (error()) {
        <section class="panel error"><p>{{ error() }}</p></section>
      }

      @if (!loading() && article()) {
        <article class="panel">
          <p class="meta">
            <strong>{{ article()!.author.username }}</strong>
            <span>{{ article()!.createdAt | date:'mediumDate' }}</span>
          </p>
          <h1>{{ article()!.title }}</h1>
          <p class="desc">{{ article()!.description }}</p>
          @if (article()!.bodyFormat === 'html') {
            <div class="body html-body" [innerHTML]="sanitizeHtml(article()!.body)"></div>
          } @else {
            <div class="body text-body">{{ article()!.body }}</div>
          }
        </article>
      }
    </main>
  `,
  styles: [
    ':host { display: block; min-height: 100vh; color: #fff8e7; }',
    '.shell { width: min(900px, 94vw); margin: 0 auto; padding: 1.4rem 0 2rem; }',
    '.back { color: #fff8e7; text-decoration: none; display: inline-block; margin-bottom: 0.9rem; }',
    '.panel { border: 1px solid #ffffff3a; border-radius: 18px; background: #0000001f; padding: 1.1rem; }',
    '.error { border-color: #ffb6b6aa; }',
    '.meta { margin: 0 0 0.4rem; display: flex; justify-content: space-between; gap: 0.8rem; font-size: 0.86rem; color: #f8dca3; }',
    'h1 { margin: 0 0 0.55rem; font-size: clamp(1.6rem, 3.2vw, 2.4rem); line-height: 1.14; }',
    '.desc { margin: 0 0 1rem; color: #fffbf1d9; line-height: 1.5; }',
    '.body { line-height: 1.7; }',
    '.text-body { white-space: pre-wrap; }',
    '.html-body :where(p, ul, ol, pre, blockquote, h2, h3, h4) { margin: 0 0 0.85rem; }',
    '.html-body :where(ul, ol) { padding-left: 1.2rem; }',
    '.html-body a { color: #f8dca3; }',
  ],
})
export class BlogArticlePage implements OnInit {
  private readonly api = inject(BlogApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly languages = inject(LanguageStore);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly language = this.languages.current;
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly article = signal<BlogArticle | null>(null);

  protected t(key: keyof (typeof translations)['en']): string {
    return translations[this.language()][key];
  }

  protected sanitizeHtml(raw: string): string {
    return this.sanitizer.sanitize(SecurityContext.HTML, raw) ?? '';
  }

  async ngOnInit(): Promise<void> {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      this.error.set(this.t('blogArticleMissingSlug'));
      this.loading.set(false);
      return;
    }

    try {
      const response = await firstValueFrom(this.api.getArticleBySlug(slug));
      this.article.set(response.article);
    } catch {
      this.error.set(this.t('blogArticleLoadError'));
    } finally {
      this.loading.set(false);
    }
  }
}
