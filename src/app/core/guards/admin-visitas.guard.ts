import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { UserRoleService } from '../services/user-role.service';

export const adminVisitasGuard: CanActivateFn = async (route, state) => {
  const userRoleService = inject(UserRoleService);
  const router = inject(Router);

  try {
    const role = userRoleService.getCurrentRoleName();

    if (role === 'AdminVisitas') {
      return true;
    } else {
      router.navigate(['/access-denied']);
      return false;
    }
  } catch (error) {
    console.error('Error al verificar el rol:', error);
    router.navigate(['/access-denied']);
    return false;
  }
};
