import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RoleAccessUseCase } from '../core/use-cases/role-access.use-case';

export const blogWriterGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const roles = inject(RoleAccessUseCase);
  await roles.refresh();
  return roles.canWrite() ? true : router.createUrlTree(['/blog']);
};
