import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LanguageStore } from '../../core/i18n/language.store';
import { Language } from '../../core/models/language.model';
import { AuthUseCases } from '../../core/use-cases/auth.use-cases';
import { codePattern, passwordValidators } from '../../core/validation/auth-rules';
import { authCopy, AuthCopyKey } from './auth-copy';
import { authApiError, fieldError } from './auth-errors';

@Component({
  selector: 'app-forgot-password-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.page.html',
  styleUrl: './auth.page.scss'
})
export class ForgotPasswordPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthUseCases);
  private readonly router = inject(Router);
  private readonly languages = inject(LanguageStore);
  protected readonly loading = signal(false);
  protected readonly codeSent = signal(false);
  protected readonly error = signal('');
  protected readonly options = [
    { code: 'en' as const, label: 'English' },
    { code: 'ko' as const, label: '한국어' }
  ];
  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    code: ['', [Validators.required, Validators.pattern(codePattern)]],
    newPassword: ['', [Validators.required, Validators.minLength(passwordValidators.minLength), Validators.pattern(passwordValidators.pattern)]]
  });

  protected async requestCode(): Promise<void> {
    if (this.form.controls.email.invalid) {
      this.form.controls.email.markAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    try { await this.auth.forgot(this.form.value.email!); this.codeSent.set(true); } catch (e) { this.error.set(authApiError(this.language(), e)); }
    this.loading.set(false);
  }

  protected async resetPassword(): Promise<void> {
    const { email, code, newPassword } = this.form.getRawValue();
    if (this.form.controls.code.invalid || this.form.controls.newPassword.invalid) {
      this.form.controls.code.markAsTouched();
      this.form.controls.newPassword.markAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    try { await this.auth.reset({ email, code, newPassword }); await this.router.navigateByUrl('/auth/login'); } catch (e) { this.error.set(authApiError(this.language(), e)); }
    this.loading.set(false);
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

  protected errorFor(field: 'email' | 'code' | 'newPassword'): string {
    return fieldError(this.language(), field, this.form.controls[field]);
  }
}
