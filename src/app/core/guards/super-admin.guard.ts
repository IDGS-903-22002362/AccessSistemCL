import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { AuthService } from '../services/auth.service';

const SUPER_ADMIN_EMAIL = 'luisrosasbocanegra@gmail.com';

export const superAdminGuard: CanActivateFn = async (route, state) => {
  const auth = inject(Auth);
  const authService = inject(AuthService);
  const router = inject(Router);

  // Esperar a que Firebase verifique la sesión
  await authService.waitForAuthReady();

  const user = auth.currentUser;

  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  if (user.email !== SUPER_ADMIN_EMAIL) {
    router.navigate(['/']);
    return false;
  }

  return true;
};
