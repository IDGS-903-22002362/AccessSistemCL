import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { map } from 'rxjs/operators';

const SUPER_ADMIN_EMAIL = 'luisrosasbocanegra@gmail.com';

export const superAdminGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  return authState(auth).pipe(
    map((user) => {
      if (!user) {
        router.navigate(['/login']);
        return false;
      }

      if (user.email !== SUPER_ADMIN_EMAIL) {
        router.navigate(['/']);
        return false;
      }

      return true;
    })
  );
};
