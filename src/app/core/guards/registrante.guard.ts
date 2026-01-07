import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { UsersService } from '../services/users.service';
import { RolesService } from '../services/roles.service';
import { AuthService } from '../services/auth.service';

const SUPER_ADMIN_EMAIL = 'luisrosasbocanegra@gmail.com';

/**
 * Guard para rutas exclusivas de registrantes
 */
export const registranteGuard: CanActivateFn = async (route, state) => {
  const auth = inject(Auth);
  const authService = inject(AuthService);
  const router = inject(Router);
  const usersService = inject(UsersService);
  const rolesService = inject(RolesService);

  // Esperar a que Firebase verifique la sesión
  console.log('⏳ Registrante Guard - Esperando Firebase...');
  await authService.waitForAuthReady();
  console.log('✅ Registrante Guard - Firebase listo');

  const user = auth.currentUser;

  if (!user || !user.email) {
    console.log('🚫 Registrante Guard - No hay usuario');
    router.navigate(['/login']);
    return false;
  }

  console.log('👤 Registrante Guard - Usuario:', user.email);

  // Super admin no accede a rutas de usuario
  if (user.email === SUPER_ADMIN_EMAIL) {
    router.navigate(['/super-admin/users']);
    return false;
  }

  try {
    const userData = await usersService.getUserByEmail(user.email);

    if (!userData || !userData.role) {
      router.navigate(['/login']);
      return false;
    }

    const roles = await rolesService.getRoles();
    const userRole = roles.find((r) => r.id === userData.role);

    if (
      userRole?.name === 'Registrante' ||
      userRole?.name === 'AdminArea' ||
      userRole?.name === 'AdminEspecial'
    ) {
      return true;
    }

    // Redirigir según rol
    if (userRole?.name === 'AdminArea') {
      router.navigate(['/admin-area']);
    } else {
      router.navigate(['/login']);
    }

    return false;
  } catch (error) {
    console.error('Error en registranteGuard:', error);
    router.navigate(['/login']);
    return false;
  }
};
