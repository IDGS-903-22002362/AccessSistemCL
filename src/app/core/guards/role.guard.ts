import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { UsersService } from '../services/users.service';
import { RolesService } from '../services/roles.service';

const SUPER_ADMIN_EMAIL = 'luisrosasbocanegra@gmail.com';

/**
 * Guard para proteger rutas según roles permitidos
 * Lee los roles permitidos desde route.data['allowedRoles']
 */
export const roleGuard: CanActivateFn = async (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);
  const usersService = inject(UsersService);
  const rolesService = inject(RolesService);

  const user = auth.currentUser;

  // Si no está autenticado, redirigir a login
  if (!user || !user.email) {
    router.navigate(['/login']);
    return false;
  }

  // Super admin tiene acceso a todo excepto rutas de usuarios normales
  if (user.email === SUPER_ADMIN_EMAIL) {
    // Super admin no debe acceder a /user o /admin-area
    if (state.url.includes('/user') || state.url.includes('/admin-area')) {
      router.navigate(['/super-admin/users']);
      return false;
    }
    return true;
  }

  try {
    // Obtener roles permitidos de la configuración de la ruta
    const allowedRoles: string[] = route.data?.['allowedRoles'] || [];

    if (allowedRoles.length === 0) {
      // Si no hay roles especificados, permitir acceso
      return true;
    }

    // Obtener datos del usuario desde Firestore
    const userData = await usersService.getUserByEmail(user.email);

    if (!userData || !userData.role) {
      // Usuario sin rol asignado
      router.navigate(['/login']);
      return false;
    }

    // Obtener información del rol
    const roles = await rolesService.getRoles();
    const userRole = roles.find((r) => r.id === userData.role);

    if (!userRole) {
      router.navigate(['/login']);
      return false;
    }

    // Verificar si el rol del usuario está en los roles permitidos
    if (allowedRoles.includes(userRole.name)) {
      return true;
    }

    // Rol no permitido - redirigir según su rol
    switch (userRole.name) {
      case 'Registrante':
        router.navigate(['/user']);
        break;
      case 'AdminArea':
        router.navigate(['/admin-area']);
        break;
      case 'AdminEspecial':
        router.navigate(['/admin-area']);
        break;
      default:
        router.navigate(['/login']);
    }

    return false;
  } catch (error) {
    console.error('Error en roleGuard:', error);
    router.navigate(['/login']);
    return false;
  }
};

/**
 * Guard específico para administradores de área
 */
export const adminGuard: CanActivateFn = async (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);
  const usersService = inject(UsersService);
  const rolesService = inject(RolesService);

  const user = auth.currentUser;

  if (!user || !user.email) {
    router.navigate(['/login']);
    return false;
  }

  // Super admin tiene acceso
  if (user.email === SUPER_ADMIN_EMAIL) {
    return true;
  }

  try {
    const userData = await usersService.getUserByEmail(user.email);

    if (!userData || !userData.role) {
      router.navigate(['/login']);
      return false;
    }

    const roles = await rolesService.getRoles();
    const userRole = roles.find((r) => r.id === userData.role);

    if (userRole?.name === 'AdminArea' || userRole?.name === 'AdminEspecial') {
      return true;
    }

    // Redirigir según rol
    if (userRole?.name === 'Registrante') {
      router.navigate(['/user']);
    } else {
      router.navigate(['/login']);
    }

    return false;
  } catch (error) {
    console.error('Error en adminGuard:', error);
    router.navigate(['/login']);
    return false;
  }
};
