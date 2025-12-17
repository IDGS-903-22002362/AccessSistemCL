import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

/**
 * Guard para proteger rutas que requieren autenticación
 * Redirige a /login si el usuario no está autenticado
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Usar observable para verificación más confiable
  return authService.authState$.pipe(
    take(1),
    map((user) => {
      if (user) {
        return true;
      } else {
        // Guardar la URL intentada para redirigir después del login
        router.navigate(['/login'], {
          queryParams: { returnUrl: state.url },
        });
        return false;
      }
    })
  );
};
