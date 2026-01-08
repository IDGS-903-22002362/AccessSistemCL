import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { UsersService } from '../services/users.service';
import { RolesService } from '../services/roles.service';
import { AuthService } from '../services/auth.service';

/**
 * Guard para rutas exclusivas de analistas
 */
export const analistaGuard: CanActivateFn = async (route, state) => {
  const auth = inject(Auth);
  const authService = inject(AuthService);
  const router = inject(Router);
  const usersService = inject(UsersService);
  const rolesService = inject(RolesService);

  // Esperar a que Firebase verifique la sesión
  console.log('⏳ Analista Guard - Esperando Firebase...');
  await authService.waitForAuthReady();
  console.log('✅ Analista Guard - Firebase listo');

  const user = auth.currentUser;

  if (!user || !user.email) {
    console.log('🚫 Analista Guard - No hay usuario');
    router.navigate(['/login']);
    return false;
  }

  console.log('👤 Analista Guard - Usuario:', user.email);

  try {
    const userData = await usersService.getUserByEmail(user.email);

    if (!userData || !userData.role) {
      console.log('❌ Analista Guard - Usuario sin rol');
      router.navigate(['/login']);
      return false;
    }

    const roles = await rolesService.getRoles();
    const userRole = roles.find((r) => r.id === userData.role);

    console.log('🔍 Analista Guard - Rol del usuario:', userRole?.name);

    // Solo permitir acceso a usuarios con rol "Analista"
    if (userRole?.name === 'Analista') {
      console.log('✅ Analista Guard - Acceso permitido');
      return true;
    }

    // Redirigir según rol
    console.log('❌ Analista Guard - Acceso denegado, redirigiendo...');
    if (userRole?.name === 'SuperAdmin') {
      router.navigate(['/super-admin/users']);
    } else if (userRole?.name === 'AdminArea') {
      router.navigate(['/admin-area']);
    } else if (userRole?.name === 'Registrante') {
      router.navigate(['/user']);
    } else {
      router.navigate(['/login']);
    }

    return false;
  } catch (error) {
    console.error('Error en analistaGuard:', error);
    router.navigate(['/login']);
    return false;
  }
};
