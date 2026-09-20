import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { translations } from '../../core/config/translations';
import { LanguageStore } from '../../core/i18n/language.store';
import { BlogApiService } from './blog-api.service';
import { BlogBodyFormat } from './blog.models';

@Component({
  selector: 'app-blog-write-page',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="shell">
      <a class="back" routerLink="/blog">{{ t('blogArticleBack') }}</a>
      <header class="header">
        <h1>{{ t('blogWriteTitle') }}</h1>
        <p>{{ t('blogWriteLead') }}</p>
      </header>

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
          {{ loading() ? t('blogWriteSubmitting') : t('blogWriteSubmit') }}
        </button>
      </form>

      @if (success()) {
        <p class="ok">{{ t('blogWriteSuccess') }}</p>
      }
      @if (error()) {
        <p class="error">{{ error() }}</p>
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
    '.ok { color: #b5ffcb; }',
    '.error { color: #ffb6b6; }'
  ]
})
export class BlogWritePage {
  private readonly fb = inject(FormBuilder);
  private readonly blogApi = inject(BlogApiService);
  private readonly languages = inject(LanguageStore);

  protected readonly language = this.languages.current;
  protected readonly loading = signal(false);
  protected readonly success = signal(false);
  protected readonly error = signal('');

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

  protected async submit(): Promise<void> {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.success.set(false);
    this.error.set('');
    const value = this.form.getRawValue();
    const tagList = value.tags.split(',').map((tag) => tag.trim()).filter(Boolean);

    try {
      await firstValueFrom(this.blogApi.createArticle({
        title: value.title,
        description: value.description,
        body: value.body,
        bodyFormat: value.bodyFormat,
        tagList
      }));
      this.success.set(true);
      this.form.reset({ title: '', description: '', body: '', bodyFormat: 'text', tags: '' });
    } catch {
      this.error.set(this.t('blogWriteError'));
    } finally {
      this.loading.set(false);
    }
  }
}
