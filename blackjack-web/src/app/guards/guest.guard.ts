import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthUseCases } from '../core/use-cases/auth.use-cases';

export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthUseCases);
  const router = inject(Router);
  const ok = await auth.isAuthenticated();
  return ok ? router.createUrlTree(['/blog']) : true;
};
