import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LanguageStore } from '../../core/i18n/language.store';
import { Language } from '../../core/models/language.model';
import { AuthUseCases } from '../../core/use-cases/auth.use-cases';
import { PendingCredentialsStore } from '../../core/config/pending-credentials.store';
import { nicknamePattern, passwordValidators } from '../../core/validation/auth-rules';
import { authCopy, AuthCopyKey } from './auth-copy';
import { authApiError, fieldError } from './auth-errors';

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.page.html',
  styleUrl: './auth.page.scss'
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
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
    email: ['', [Validators.required, Validators.email]],
    nickname: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(20), Validators.pattern(nicknamePattern)]],
    password: ['', [Validators.required, Validators.minLength(passwordValidators.minLength), Validators.pattern(passwordValidators.pattern)]],
    confirmPassword: ['', [Validators.required]]
  });

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.form.value.password !== this.form.value.confirmPassword) {
      this.form.controls.confirmPassword.setErrors({ mismatch: true });
      return;
    }
    this.loading.set(true);
    this.error.set('');
    const { email, nickname, password } = this.form.getRawValue();
    try {
      await this.auth.register({ email, nickname, password, avatarKey: 'preset:avatar-1' });
      this.pending.set(email, password);
      await this.router.navigate(['/auth/confirm'], { queryParams: { email } });
    } catch (e) {
      this.error.set(authApiError(this.language(), e));
    }
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

  protected errorFor(field: 'email' | 'password' | 'nickname' | 'confirmPassword'): string {
    return fieldError(this.language(), field, this.form.controls[field]);
  }
}
