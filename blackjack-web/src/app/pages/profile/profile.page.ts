import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { avatarPresetMap, avatarPresets } from '../../core/config/avatar-presets';
import { AuthUseCases } from '../../core/use-cases/auth.use-cases';
import { ProfileUseCases } from '../../core/use-cases/profile.use-cases';

@Component({
  selector: 'app-profile-page',
  imports: [ReactiveFormsModule],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss'
})
export class ProfilePage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly profile = inject(ProfileUseCases);
  private readonly auth = inject(AuthUseCases);
  private readonly router = inject(Router);
  protected readonly avatarPresets = avatarPresets;
  protected readonly avatarPresetMap = avatarPresetMap;
  protected readonly message = signal('');
  protected readonly currentAvatarUrl = signal('');
  protected readonly pendingAvatarPreviewUrl = signal('');
  protected readonly pendingAvatarName = signal('');
  protected readonly uploadingAvatar = signal(false);
  private pendingAvatarFile: File | null = null;
  protected readonly form = this.fb.nonNullable.group({
    email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
    nickname: ['', [Validators.required, Validators.minLength(2)]],
    oldPassword: [''],
    newPassword: ['']
  });

  async ngOnInit(): Promise<void> {
    await this.refreshProfile();
  }

  protected async saveNickname(): Promise<void> {
    await this.profile.updateNickname(this.form.value.nickname ?? '');
    this.message.set('Nickname updated.');
  }

  protected async setPreset(avatarKey: string): Promise<void> {
    await this.profile.setPresetAvatar(avatarKey);
    await this.refreshProfile();
    this.message.set('Avatar updated.');
  }

  protected selectAvatar(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.pendingAvatarFile = file;
    this.pendingAvatarName.set(file.name);
    this.pendingAvatarPreviewUrl.set(URL.createObjectURL(file));
    this.message.set('');
  }

  protected async uploadAvatar(): Promise<void> {
    if (!this.pendingAvatarFile || this.uploadingAvatar()) return;
    this.uploadingAvatar.set(true);
    try {
      await this.profile.uploadAvatar(this.pendingAvatarFile);
      await this.refreshProfile();
      this.clearPendingAvatar();
      this.message.set('Custom avatar uploaded.');
    } finally {
      this.uploadingAvatar.set(false);
    }
  }

  protected clearAvatarSelection(): void {
    this.clearPendingAvatar();
  }

  protected async changePassword(): Promise<void> {
    await this.profile.changePassword(this.form.value.oldPassword ?? '', this.form.value.newPassword ?? '');
    this.message.set('Password changed.');
  }

  protected async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/auth/login');
  }

  private async refreshProfile(): Promise<void> {
    const p = await this.profile.getProfile();
    this.form.patchValue({ email: p.email, nickname: p.nickname });
    this.currentAvatarUrl.set(p.avatarUrl);
  }

  private clearPendingAvatar(): void {
    const previewUrl = this.pendingAvatarPreviewUrl();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    this.pendingAvatarFile = null;
    this.pendingAvatarPreviewUrl.set('');
    this.pendingAvatarName.set('');
  }
}
