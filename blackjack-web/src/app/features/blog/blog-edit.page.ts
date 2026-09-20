import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { translations } from '../../core/config/translations';
import { LanguageStore } from '../../core/i18n/language.store';
import { ProfileUseCases } from '../../core/use-cases/profile.use-cases';
import { BlogApiService } from './blog-api.service';
import { BlogBodyFormat } from './blog.models';
import { BlogImagePosition, blogImagePositions, insertBlogImage } from './blog-image.utils';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

@Component({
  selector: 'app-blog-edit-page',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="shell">
      <a class="back" routerLink="/blog">{{ t('blogArticleBack') }}</a>
      <header class="header">
        <h1>{{ t('blogEditTitle') }}</h1>
        <p>{{ t('blogEditLead') }}</p>
      </header>

      @if (loadingInitial()) {
        <section class="panel"><p>{{ t('blogArticleLoading') }}</p></section>
      }

      @if (!loadingInitial()) {
        <form class="panel" [formGroup]="form" (ngSubmit)="submit()">
          <label>
            {{ t('blogWriteTitleField') }}
            <input type="text" formControlName="title" />
          </label>
          <label>
            {{ t('blogWriteDescField') }}
            <input type="text" formControlName="description" />
          </label>
          <label>
            {{ t('blogWriteBodyField') }}
            <textarea rows="8" formControlName="body"></textarea>
          </label>
          <div class="image-tools">
            <button type="button" class="secondary" [disabled]="loading() || uploadingImage()" (click)="fileInput.click()">
              {{ uploadingImage() ? '업로드 중...' : '이미지 업로드' }}
            </button>
            <input #fileInput hidden type="file" accept="image/png,image/jpeg,image/gif,image/webp" (change)="uploadImage($event, fileInput)" />
            @if (imageUploadError()) {
              <small class="field-error">{{ imageUploadError() }}</small>
            }
            <small class="field-hint">이미지는 5MB 이하, PNG/JPG/GIF/WebP만 가능합니다.</small>
          </div>
          <label>
            {{ t('blogWriteFormatField') }}
            <select formControlName="bodyFormat">
              <option value="text">{{ t('blogWriteFormatText') }}</option>
              <option value="html">{{ t('blogWriteFormatHtml') }}</option>
            </select>
          </label>
          <label>
            {{ t('blogWriteTagsField') }}
            <input type="text" formControlName="tags" />
          </label>

          <button class="primary" [disabled]="loading() || form.invalid">
            {{ loading() ? t('blogEditSubmitting') : t('blogEditSubmit') }}
          </button>
        </form>
      }

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      @if (showImagePositionDialog()) {
        <div class="modal-backdrop" (click)="closeImagePositionDialog()">
          <section class="modal" role="dialog" aria-modal="true" aria-labelledby="image-position-title" (click)="$event.stopPropagation()">
            <p class="modal-kicker">이미지 업로드 완료</p>
            <h2 id="image-position-title">어디에 넣을까요?</h2>
            <p class="modal-body">왼쪽/오른쪽, 위/아래 위치를 고르면 글 본문에 맞게 HTML로 저장합니다.</p>
            <div class="image-preview">
              <img [src]="pendingImageUrl()" alt="uploaded preview" />
            </div>
            <div class="position-grid">
              @for (position of blogImagePositions; track position) {
                <button type="button" class="position-btn" (click)="applyImagePosition(position)">{{ positionLabel(position) }}</button>
              }
            </div>
          </section>
        </div>
      }

      @if (showImageSizeWarningDialog()) {
        <div class="modal-backdrop" (click)="closeImageSizeWarningDialog()">
          <section class="modal" role="dialog" aria-modal="true" aria-labelledby="image-size-warning-title" (click)="$event.stopPropagation()">
            <p class="modal-kicker">업로드 실패</p>
            <h2 id="image-size-warning-title">이미지가 너무 큽니다</h2>
            <p class="modal-body">5MB 이하의 PNG, JPG, GIF, WebP 파일만 업로드할 수 있습니다.</p>
            <div class="dialog-actions">
              <button type="button" class="dialog-confirm" (click)="closeImageSizeWarningDialog()">확인</button>
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
    '.header h1 { margin: 0 0 0.35rem; }',
    '.header p { margin: 0 0 1rem; color: #fffbf1d9; }',
    '.panel { border: 1px solid #ffffff3a; border-radius: 18px; background: #0000001f; padding: 1rem; display: grid; gap: 0.8rem; }',
    'label { display: grid; gap: 0.35rem; font-size: 0.9rem; }',
    'input, textarea, select { border: 1px solid #ffffff3a; border-radius: 10px; background: #0e1d18; color: #fff8e7; padding: 0.6rem; }',
    '.primary { border: 1px solid #f8dca3; border-radius: 999px; background: #f8b84c; color: #15362d; padding: 0.6rem 1rem; font-weight: 700; width: fit-content; }',
    '.secondary { border: 1px solid #ffffff44; border-radius: 999px; background: #ffffff12; color: #fff8e7; padding: 0.55rem 0.9rem; font-weight: 700; width: fit-content; }',
    '.secondary[disabled] { opacity: 0.7; cursor: not-allowed; }',
    '.image-tools { display: grid; gap: 0.45rem; }',
    '.field-hint { color: #f8dca3; font-size: 0.78rem; }',
    '.error { color: #ffb6b6; }',
    '.modal-backdrop { position: fixed; inset: 0; background: rgba(6, 11, 9, 0.62); display: grid; place-items: center; padding: 1rem; z-index: 60; }',
    '.modal { width: min(560px, 94vw); border: 1px solid #ffffff3a; border-radius: 22px; background: linear-gradient(180deg, #132822, #0d1915); color: #fff8e7; padding: 1rem; box-shadow: 0 28px 80px rgba(0,0,0,0.42); }',
    '.modal-kicker { margin: 0 0 0.35rem; color: #f8dca3; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.08em; }',
    '.modal h2 { margin: 0 0 0.4rem; font-size: 1.35rem; }',
    '.modal-body { margin: 0 0 0.8rem; line-height: 1.5; color: #fffbf1d9; }',
    '.image-preview { border: 1px solid #ffffff2f; border-radius: 16px; background: #00000020; padding: 0.6rem; margin-bottom: 0.8rem; }',
    '.image-preview img { display: block; width: 100%; max-height: 220px; object-fit: contain; border-radius: 12px; }',
    '.position-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6rem; }',
    '.position-btn { border: 1px solid #ffffff44; border-radius: 14px; padding: 0.8rem 0.9rem; background: #ffffff10; color: #fff8e7; font-weight: 700; }'
    ,'.dialog-actions { display: flex; justify-content: flex-end; gap: 0.6rem; margin-top: 1rem; }',
    '.dialog-confirm { border: 1px solid #ffffff44; border-radius: 999px; padding: 0.55rem 0.9rem; font-weight: 700; background: #f8b84c; color: #15362d; }'
  ]
})
export class BlogEditPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly blogApi = inject(BlogApiService);
  private readonly languages = inject(LanguageStore);
  private readonly profile = inject(ProfileUseCases);

  protected readonly language = this.languages.current;
  protected readonly loading = signal(false);
  protected readonly loadingInitial = signal(true);
  protected readonly uploadingImage = signal(false);
  protected readonly error = signal('');
  protected readonly imageUploadError = signal('');
  protected readonly showImagePositionDialog = signal(false);
  protected readonly showImageSizeWarningDialog = signal(false);
  protected readonly pendingImageUrl = signal('');
  protected readonly blogImagePositions = blogImagePositions;

  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    body: ['', [Validators.required, Validators.minLength(20)]],
    bodyFormat: ['text' as BlogBodyFormat],
    tags: ['']
  });

  protected t(key: keyof (typeof translations)['en']): string {
    return translations[this.language()][key];
  }

  async ngOnInit(): Promise<void> {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      this.error.set(this.t('blogArticleMissingSlug'));
      this.loadingInitial.set(false);
      return;
    }

    try {
      const response = await firstValueFrom(this.blogApi.getArticleBySlug(slug));
      const article = response.article;
      this.form.setValue({
        title: article.title,
        description: article.description,
        body: article.body,
        bodyFormat: article.bodyFormat,
        tags: article.tagList.join(', '),
      });
    } catch {
      this.error.set(this.t('blogArticleLoadError'));
    } finally {
      this.loadingInitial.set(false);
    }
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) return;
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) return;

    this.loading.set(true);
    this.error.set('');
    const value = this.form.getRawValue();
    const tagList = value.tags.split(',').map((tag) => tag.trim()).filter(Boolean);

    try {
      const response = await firstValueFrom(this.blogApi.updateArticle(slug, {
        title: value.title,
        description: value.description,
        body: value.body,
        bodyFormat: value.bodyFormat,
        tagList,
      }));
      await this.router.navigate(['/blog/article', response.article.slug]);
    } catch {
      this.error.set(this.t('blogEditError'));
    } finally {
      this.loading.set(false);
    }
  }

  protected positionLabel(position: BlogImagePosition): string {
    return {
      'top-left': '맨위 왼쪽',
      'top-right': '맨위 오른쪽',
      'bottom-left': '맨아래 왼쪽',
      'bottom-right': '맨아래 오른쪽',
    }[position];
  }

  protected async uploadImage(event: Event, input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0];
    input.value = '';
    if (!file || this.uploadingImage()) return;
    this.showImageSizeWarningDialog.set(false);
    this.imageUploadError.set('');
    if (!this.isValidImage(file)) {
      this.imageUploadError.set('PNG/JPG/GIF/WebP 파일만 5MB 이하로 업로드할 수 있습니다.');
      return;
    }

    this.uploadingImage.set(true);
    try {
      const profile = await this.profile.getProfile();
      const response = await firstValueFrom(this.blogApi.uploadArticleImage(profile.email, file));
      this.pendingImageUrl.set(response.url);
      this.showImagePositionDialog.set(true);
    } catch {
      this.imageUploadError.set('이미지 업로드에 실패했습니다.');
    } finally {
      this.uploadingImage.set(false);
    }
  }

  protected applyImagePosition(position: BlogImagePosition): void {
    const value = this.form.getRawValue();
    const updated = insertBlogImage(value.body, value.bodyFormat, this.pendingImageUrl(), position);
    this.form.patchValue({ body: updated.body, bodyFormat: updated.bodyFormat });
    this.showImagePositionDialog.set(false);
    this.pendingImageUrl.set('');
  }

  protected closeImagePositionDialog(): void {
    this.showImagePositionDialog.set(false);
    this.pendingImageUrl.set('');
  }

  protected closeImageSizeWarningDialog(): void {
    this.showImageSizeWarningDialog.set(false);
  }

  private isValidImage(file: File): boolean {
    if (file.size > MAX_IMAGE_BYTES) {
      this.showImageSizeWarningDialog.set(true);
      return false;
    }
    return ALLOWED_IMAGE_TYPES.includes(file.type);
  }
}
