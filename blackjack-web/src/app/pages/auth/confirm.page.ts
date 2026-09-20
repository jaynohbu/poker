import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LanguageStore } from '../../core/i18n/language.store';
import { Language } from '../../core/models/language.model';
import { AuthUseCases } from '../../core/use-cases/auth.use-cases';
import { PendingCredentialsStore } from '../../core/config/pending-credentials.store';
import { codePattern } from '../../core/validation/auth-rules';
import { authCopy, AuthCopyKey } from './auth-copy';
import { authApiError, fieldError } from './auth-errors';

@Component({
  selector: 'app-confirm-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './confirm.page.html',
  styleUrl: './auth.page.scss'
})
export class ConfirmPage {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthUseCases);
  private readonly pending = inject(PendingCredentialsStore);
  private readonly router = inject(Router);
  private readonly languages = inject(LanguageStore);
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly options = [
    { code: 'en' as const, label: 'English' },
    { code: 'ko' as const, label: '한국어' }
  ];
  protected readonly form = this.fb.nonNullable.group({
    email: [this.route.snapshot.queryParamMap.get('email') ?? '', [Validators.required, Validators.email]],
    code: ['', [Validators.required, Validators.pattern(codePattern)]]
  });

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    const { email, code } = this.form.getRawValue();
    try {
      await this.auth.confirm({ email, code, password: '' });
      const creds = this.pending.get();
      if (creds && creds.email === email) await this.auth.login(creds.email, creds.password);
      this.pending.clear();
      await this.router.navigateByUrl('/blog');
    } catch (e) {
      this.error.set(authApiError(this.language(), e));
    }
    this.loading.set(false);
  }

  protected resend(): void {
    this.auth.resend(this.form.value.email!).catch((e) => this.error.set(authApiError(this.language(), e)));
  }

  protected language(): Language {
    return this.languages.current();
  }

  protected setLanguage(language: Language): void {
    this.languages.set(language);
  }

  protected t(key: AuthCopyKey): string {
    return authCopy(this.language(), key);
  }

  protected errorFor(field: 'email' | 'code'): string {
    return fieldError(this.language(), field, this.form.controls[field]);
  }
}
