import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';

/**
 * Guard para proteger rutas que requieren autenticación
 * Redirige a /login si el usuario no está autenticado
 */
export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  try {
    // PRIMERO esperar a que Firebase verifique completamente el estado de autenticación
    // Esto incluye verificar el localStorage para sesiones persistidas
    console.log('⏳ Auth Guard - Esperando verificación de Firebase...');
    await authService.waitForAuthReady();
    console.log('✅ Auth Guard - Firebase listo');

    // LUEGO obtener el estado del usuario
    const user = await firstValueFrom(authService.authState$.pipe(take(1)));

    console.log(
      '🔒 Auth Guard - Usuario:',
      user ? user.email : 'No autenticado'
    );

    if (user) {
      return true;
    } else {
      // Guardar la URL intentada para redirigir después del login
      console.log('🚫 Redirigiendo a login desde:', state.url);
      router.navigate(['/login'], {
        queryParams: { returnUrl: state.url },
      });
      return false;
    }
  } catch (error) {
    console.error('❌ Error en Auth Guard:', error);
    router.navigate(['/login']);
    return false;
  }
};
