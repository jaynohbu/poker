import { DatePipe } from '@angular/common';
import { Component, OnInit, SecurityContext, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { translations } from '../../core/config/translations';
import { LanguageStore } from '../../core/i18n/language.store';
import { RoleAccessUseCase } from '../../core/use-cases/role-access.use-case';
import { BlogApiService } from './blog-api.service';
import { BlogArticle } from './blog.models';

const INLINE_IMAGE_STYLE = 'width:100%;max-width:180px;height:auto;display:block;object-fit:contain;border-radius:14px;cursor:zoom-in;';
const INLINE_BLOG_FIGURE_STYLE = 'box-sizing:border-box;width:22%;max-width:180px;min-width:120px;margin:0 0 1rem 0;overflow:hidden;';

@Component({
  selector: 'app-blog-article-page',
  imports: [RouterLink, DatePipe],
  template: `
    <main class="shell">
      <div class="top-actions">
        <a class="back" routerLink="/blog">{{ t('blogArticleBack') }}</a>
        @if (canWrite()) {
          <a class="write-new" routerLink="/blog/write">{{ t('blogWriteNew') }}</a>
        }
      </div>

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
          @if (canWrite()) {
            <div class="actions">
              <a class="edit" [routerLink]="['/blog/edit', article()!.slug]">{{ t('blogEditLink') }}</a>
              <button class="delete" type="button" [disabled]="deleting()" (click)="openDeleteDialog()">
                {{ deleting() ? t('blogDeleteDeleting') : t('blogDeleteLink') }}
              </button>
            </div>
          }
          @if (article()!.bodyFormat === 'html') {
            <div class="body html-body" [innerHTML]="sanitizeHtml(article()!.body)" (click)="onHtmlBodyClick($event)"></div>
          } @else {
            <div class="body text-body">{{ article()!.body }}</div>
          }
        </article>
      }

      @if (showImagePreviewDialog()) {
        <div class="image-preview-backdrop" (click)="closeImagePreviewDialog()">
          <section class="image-preview-dialog" role="dialog" aria-modal="true" aria-label="full image preview" (click)="$event.stopPropagation()">
            <button type="button" class="image-preview-close" (click)="closeImagePreviewDialog()" aria-label="close full image">×</button>
            <img [src]="previewImageUrl()" [alt]="previewImageAlt()" />
          </section>
        </div>
      }

      @if (showDeleteDialog()) {
        <div class="dialog-backdrop" (click)="closeDeleteDialog()">
          <section class="dialog" role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title" (click)="$event.stopPropagation()">
            <p class="dialog-kicker">{{ t('blogDeleteDialogKicker') }}</p>
            <h2 id="delete-dialog-title">{{ t('blogDeleteDialogTitle') }}</h2>
            <p class="dialog-body">{{ t('blogDeleteDialogBody') }}</p>
            <div class="dialog-actions">
              <button type="button" class="dialog-cancel" (click)="closeDeleteDialog()">{{ t('blogDeleteDialogCancel') }}</button>
              <button type="button" class="dialog-confirm" [disabled]="deleting()" (click)="confirmDeleteArticle()">
                {{ deleting() ? t('blogDeleteDeleting') : t('blogDeleteDialogConfirm') }}
              </button>
            </div>
          </section>
        </div>
      }
    </main>
  `,
  styles: [
    ':host { display: block; min-height: 100vh; color: #fff8e7; }',
    '.shell { width: min(900px, 94vw); margin: 0 auto; padding: 1.4rem 0 2rem; }',
    '.back { color: #fff8e7; text-decoration: none; display: inline-block; margin-bottom: 0.9rem; }',
    '.top-actions { display: flex; align-items: center; justify-content: space-between; gap: 0.8rem; margin-bottom: 0.9rem; }',
    '.write-new { color: #f8dca3; text-decoration: none; border: 1px solid #ffffff55; border-radius: 999px; padding: 0.25rem 0.75rem; font-size: 0.85rem; }',
    '.panel { border: 1px solid #ffffff3a; border-radius: 18px; background: #0000001f; padding: 1.1rem; }',
    '.error { border-color: #ffb6b6aa; }',
    '.meta { margin: 0 0 0.4rem; display: flex; justify-content: space-between; gap: 0.8rem; font-size: 0.86rem; color: #f8dca3; }',
    'h1 { margin: 0 0 0.55rem; font-size: clamp(1.6rem, 3.2vw, 2.4rem); line-height: 1.14; }',
    '.desc { margin: 0 0 1rem; color: #fffbf1d9; line-height: 1.5; }',
    '.actions { display: flex; gap: 0.5rem; margin: 0 0 0.9rem; }',
    '.edit, .delete { border: 1px solid #ffffff55; border-radius: 999px; padding: 0.38rem 0.8rem; text-decoration: none; font-weight: 700; font-size: 0.85rem; }',
    '.edit { background: #f8b84c; color: #15362d; }',
    '.delete { background: #4e2121; color: #ffd7d7; cursor: pointer; }',
    '.delete[disabled], .dialog-confirm[disabled] { opacity: 0.65; cursor: not-allowed; }',
    '.body { line-height: 1.7; }',
    '.text-body { white-space: pre-wrap; }',
    '.html-body { max-width: 100%; overflow-x: hidden; }',
    '.html-body img { max-width: 100%; height: auto; }',
    '.html-body .blog-layout { display: flow-root; max-width: 100%; }',
    '.html-body .blog-content { min-width: 0; overflow-wrap: anywhere; }',
    '.html-body .blog-image { box-sizing: border-box; width: 22%; max-width: 180px; min-width: 120px; margin: 0 0 1rem 0; }',
    '.html-body .blog-layout--top-left .blog-image, .html-body .blog-layout--bottom-left .blog-image { float: left; margin-right: 1rem; }',
    '.html-body .blog-layout--top-right .blog-image, .html-body .blog-layout--bottom-right .blog-image { float: right; margin-left: 1rem; }',
    '.html-body .blog-image img { display: block; width: 100%; max-width: 180px; height: auto; object-fit: contain; border-radius: 14px; cursor: zoom-in; }',
    '.html-body .blog-content p:last-child { margin-bottom: 0; }',
    '.html-body :where(p, ul, ol, pre, blockquote, h2, h3, h4) { margin: 0 0 0.85rem; }',
    '.html-body :where(ul, ol) { padding-left: 1.2rem; }',
    '.html-body a { color: #f8dca3; }',
    '.image-preview-backdrop { position: fixed; inset: 0; background: rgba(3, 8, 7, 0.82); display: grid; place-items: center; padding: 1rem; z-index: 80; }',
    '.image-preview-dialog { position: relative; width: min(1000px, 96vw); max-height: 94vh; }',
    '.image-preview-dialog img { display: block; width: 100%; max-height: 94vh; object-fit: contain; border-radius: 16px; border: 1px solid #ffffff3a; background: #050908; }',
    '.image-preview-close { position: absolute; top: 0.45rem; right: 0.45rem; width: 2rem; height: 2rem; border-radius: 999px; border: 1px solid #ffffff66; background: #0f1f1aee; color: #fff8e7; font-size: 1.2rem; line-height: 1; cursor: pointer; }',
    '.dialog-backdrop { position: fixed; inset: 0; background: rgba(6, 11, 9, 0.62); display: grid; place-items: center; padding: 1rem; z-index: 60; }',
    '.dialog { width: min(440px, 92vw); border: 1px solid #ffffff3a; border-radius: 22px; background: linear-gradient(180deg, #132822, #0d1915); color: #fff8e7; padding: 1.1rem 1.1rem 1rem; box-shadow: 0 28px 80px rgba(0,0,0,0.42); }',
    '.dialog-kicker { margin: 0 0 0.35rem; color: #f8dca3; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.08em; }',
    '.dialog h2 { margin: 0 0 0.4rem; font-size: 1.25rem; }',
    '.dialog-body { margin: 0; line-height: 1.5; color: #fffbf1d9; }',
    '.dialog-actions { display: flex; justify-content: flex-end; gap: 0.6rem; margin-top: 1rem; }',
    '.dialog-cancel, .dialog-confirm { border: 1px solid #ffffff44; border-radius: 999px; padding: 0.55rem 0.9rem; font-weight: 700; }',
    '.dialog-cancel { background: transparent; color: #fff8e7; }',
    '.dialog-confirm { background: #f8b84c; color: #15362d; }',
    '@media (max-width: 768px) { .html-body .blog-image { width: 36%; max-width: 140px; min-width: 96px; } .html-body .blog-image img { max-width: 140px; } }',
  ],
})
export class BlogArticlePage implements OnInit {
  private readonly api = inject(BlogApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly languages = inject(LanguageStore);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly roleAccess = inject(RoleAccessUseCase);

  protected readonly language = this.languages.current;
  protected readonly canWrite = this.roleAccess.canWrite;
  protected readonly loading = signal(true);
  protected readonly deleting = signal(false);
  protected readonly showDeleteDialog = signal(false);
  protected readonly showImagePreviewDialog = signal(false);
  protected readonly previewImageUrl = signal('');
  protected readonly previewImageAlt = signal('blog image');
  protected readonly error = signal('');
  protected readonly article = signal<BlogArticle | null>(null);
  private readonly slug = signal('');
  private readonly reloadOnLanguage = effect(() => {
    const slug = this.slug();
    if (!slug) return;
    void this.loadArticle(slug, this.language());
  });

  protected t(key: keyof (typeof translations)['en']): string {
    return translations[this.language()][key];
  }

  protected sanitizeHtml(raw: string): string {
    const withInlineImageConstraints = applyInlineImageConstraints(raw);
    return this.sanitizer.sanitize(SecurityContext.HTML, withInlineImageConstraints) ?? '';
  }

  async ngOnInit(): Promise<void> {
    await this.roleAccess.refresh();
    const slug = this.route.snapshot.paramMap.get('slug')?.trim() ?? '';
    this.slug.set(slug);
    if (!slug) {
      this.error.set(this.t('blogArticleMissingSlug'));
      this.loading.set(false);
      return;
    }
  }

  private async loadArticle(slug: string, language: 'en' | 'ko' | 'ja'): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      const response = await firstValueFrom(this.api.getArticleBySlug(slug, language));
      this.article.set(response.article);
    } catch {
      this.error.set(this.t('blogArticleLoadError'));
    } finally {
      this.loading.set(false);
    }
  }

  protected openDeleteDialog(): void {
    this.showDeleteDialog.set(true);
  }

  protected closeDeleteDialog(): void {
    if (this.deleting()) return;
    this.showDeleteDialog.set(false);
  }

  protected onHtmlBodyClick(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const image = target.closest('img');
    if (!(image instanceof HTMLImageElement) || !image.src) return;

    this.previewImageUrl.set(image.src);
    this.previewImageAlt.set(image.alt || 'blog image');
    this.showImagePreviewDialog.set(true);
  }

  protected closeImagePreviewDialog(): void {
    this.showImagePreviewDialog.set(false);
    this.previewImageUrl.set('');
    this.previewImageAlt.set('blog image');
  }

  protected async confirmDeleteArticle(): Promise<void> {
    const target = this.article();
    if (!target || this.deleting()) return;

    this.deleting.set(true);
    this.error.set('');

    try {
      await firstValueFrom(this.api.deleteArticle(target.slug));
      await this.router.navigate(['/blog']);
    } catch {
      this.error.set(this.t('blogDeleteError'));
    } finally {
      this.deleting.set(false);
      this.showDeleteDialog.set(false);
    }
  }
}

function applyInlineImageConstraints(raw: string): string {
  const withFigureStyle = raw.replace(/<figure\b([^>]*\bclass=(['"])[^'"]*\bblog-image\b[^'"]*\2[^>]*)>/gi, (_match, attrs: string) => {
    return `<figure${mergeInlineStyle(attrs, INLINE_BLOG_FIGURE_STYLE)}>`;
  });

  return withFigureStyle.replace(/<img\b([^>]*)>/gi, (_match, attrs: string) => {
    return `<img${mergeInlineStyle(attrs, INLINE_IMAGE_STYLE)}>`;
  });
}

function mergeInlineStyle(attrs: string, requiredStyle: string): string {
  const styleRegex = /\sstyle\s*=\s*(["'])([\s\S]*?)\1/i;
  const styleMatch = attrs.match(styleRegex);
  if (!styleMatch) {
    return `${attrs} style="${requiredStyle}"`;
  }

  const quote = styleMatch[1];
  const existingStyle = styleMatch[2].trim();
  const needsSemicolon = existingStyle.length > 0 && !existingStyle.endsWith(';');
  const merged = `${existingStyle}${needsSemicolon ? ';' : ''}${requiredStyle}`;
  return attrs.replace(styleRegex, ` style=${quote}${merged}${quote}`);
}
