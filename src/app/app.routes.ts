import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard, roleGuard } from './core/guards/role.guard';
import { superAdminGuard } from './core/guards/super-admin.guard';
import { registranteGuard } from './core/guards/registrante.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'user',
    canActivate: [authGuard, registranteGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/user/user-dashboard.component').then(
            (m) => m.UserDashboardComponent
          ),
      },
      {
        path: 'registro',
        loadComponent: () =>
          import('./features/user/user-form.component').then(
            (m) => m.UserFormComponent
          ),
      },
    ],
  },
  {
    path: 'admin-area',
    loadComponent: () =>
      import('./features/admin-area/admin-area-dashboard.component').then(
        (m) => m.AdminAreaDashboardComponent
      ),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./features/admin/admin-dashboard.component').then(
        (m) => m.AdminDashboardComponent
      ),
    canActivate: [authGuard, adminGuard],
    children: [
      {
        path: 'solicitudes',
        loadComponent: () =>
          import('./features/admin/solicitudes.component').then(
            (m) => m.SolicitudesComponent
          ),
      },
    ],
  },
  {
    path: 'super-admin',
    canActivate: [superAdminGuard],
    children: [
      {
        path: 'users',
        loadComponent: () =>
          import('./features/super-admin/user-management.component').then(
            (m) => m.UserManagementComponent
          ),
      },
      {
        path: '',
        redirectTo: 'users',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: '/login',
  },
];
