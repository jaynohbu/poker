import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LanguageStore } from '../../core/i18n/language.store';
import { Language } from '../../core/models/language.model';
import { AuthUseCases } from '../../core/use-cases/auth.use-cases';
import { passwordValidators } from '../../core/validation/auth-rules';
import { authCopy, AuthCopyKey } from './auth-copy';
import { authApiError, fieldError } from './auth-errors';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.page.html',
  styleUrl: './auth.page.scss'
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthUseCases);
  private readonly router = inject(Router);
  private readonly languages = inject(LanguageStore);
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly options = [
    { code: 'en' as const, label: 'English' },
    { code: 'ko' as const, label: '한국어' }
  ];
  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(passwordValidators.minLength), Validators.pattern(passwordValidators.pattern)]]
  });

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    try {
      await this.auth.login(this.form.value.email!, this.form.value.password!);
      await this.router.navigateByUrl('/blog');
    } catch (e) {
      this.error.set(authApiError(this.language(), e));
    }
    this.loading.set(false);
  }

  protected social(provider: 'Google' | 'Facebook' | 'Apple' | 'Amazon'): void {
    this.auth.socialLogin(provider).catch((e) => this.error.set(authApiError(this.language(), e)));
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

  protected errorFor(field: 'email' | 'password'): string {
    return fieldError(this.language(), field, this.form.controls[field]);
  }
}
