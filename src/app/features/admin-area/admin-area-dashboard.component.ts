import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { AuthService } from '../../core/services/auth.service';
import { UsersService, User } from '../../core/services/users.service';
import {
  FuncionesService,
  Funcion,
} from '../../core/services/funciones.service';
import {
  UsersAccesService,
  UserAccess,
} from '../../core/services/usersSolicitud.service';

@Component({
  selector: 'app-admin-area-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
  ],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <div class="max-w-7xl mx-auto">
        <div class="flex justify-between items-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900">
            {{ headerTitle }}
          </h1>
          <button
            mat-raised-button
            color="warn"
            (click)="logout()"
            class="flex items-center gap-2"
          >
            <mat-icon>logout</mat-icon>
            Cerrar Sesión
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <mat-card class="p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-semibold">Solicitudes Pendientes</h2>
              <mat-icon class="text-orange-500 text-4xl">pending</mat-icon>
            </div>
            <p class="text-4xl font-bold text-orange-600">{{ pendingCount }}</p>
            <p class="text-gray-600 mt-2">Pendientes de revisión</p>
          </mat-card>

          <mat-card class="p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-semibold">Solicitudes Aprobadas</h2>
              <mat-icon class="text-green-500 text-4xl">check_circle</mat-icon>
            </div>
            <p class="text-4xl font-bold text-green-600">{{ approvedCount }}</p>
            <p class="text-gray-600 mt-2">Aprobadas</p>
          </mat-card>

          <mat-card class="p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-semibold">Solicitudes Rechazadas</h2>
              <mat-icon class="text-red-500 text-4xl">cancel</mat-icon>
            </div>
            <p class="text-4xl font-bold text-red-600">{{ rejectedCount }}</p>
            <p class="text-gray-600 mt-2">Rechazadas</p>
          </mat-card>
        </div>

        <mat-card class="mt-8 p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-semibold">Solicitudes de Acceso</h2>
            <button
              mat-raised-button
              color="primary"
              (click)="loadSolicitudes()"
              [disabled]="loading"
            >
              <mat-icon>refresh</mat-icon>
              <span class="ml-2">Actualizar</span>
            </button>
          </div>

          <div *ngIf="loading" class="text-center py-8">
            <p class="text-gray-600">Cargando solicitudes...</p>
          </div>

          <div *ngIf="!loading && !hasPermissions" class="text-center py-8">
            <mat-icon class="text-red-500 text-5xl">block</mat-icon>
            <p class="text-red-600 mt-4 text-lg">
              No tienes permisos para administrar solicitudes.
            </p>
            <p class="text-gray-600 mt-2">
              Contacta con el administrador del sistema.
            </p>
          </div>

          <div
            *ngIf="
              !loading && hasPermissions && filteredSolicitudes.length === 0
            "
            class="text-center py-8"
          >
            <mat-icon class="text-gray-400 text-5xl">inbox</mat-icon>
            <p class="text-gray-600 mt-4">No hay solicitudes disponibles.</p>
          </div>

          <div
            *ngIf="!loading && hasPermissions && filteredSolicitudes.length > 0"
            class="overflow-x-auto"
          >
            <table class="w-full">
              <thead class="bg-gray-100">
                <tr>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase"
                  >
                    Nombre
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase"
                  >
                    Email
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase"
                  >
                    Función
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase"
                  >
                    Teléfono
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase"
                  >
                    Estado
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase"
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr
                  *ngFor="let solicitud of filteredSolicitudes"
                  class="hover:bg-gray-50"
                >
                  <td class="px-4 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">
                      {{ solicitud.nombre }} {{ solicitud.apellidoPaterno }}
                    </div>
                    <div class="text-sm text-gray-500">
                      {{ solicitud.apellidoMaterno }}
                    </div>
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ solicitud.email }}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{
                      funcionesMap.get(solicitud.funcion) || solicitud.funcion
                    }}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ solicitud.telefono }}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap">
                    <span
                      class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                      [ngClass]="{
                        'bg-yellow-100 text-yellow-800':
                          solicitud.estatus === 'pendiente',
                        'bg-green-100 text-green-800':
                          solicitud.estatus === 'aprobado',
                        'bg-red-100 text-red-800':
                          solicitud.estatus === 'rechazado'
                      }"
                    >
                      {{ solicitud.estatus }}
                    </span>
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex gap-2">
                      <button
                        *ngIf="
                          canManageSolicitud(solicitud) &&
                          solicitud.estatus === 'pendiente'
                        "
                        mat-raised-button
                        color="primary"
                        (click)="aprobar(solicitud)"
                        [disabled]="processingId === solicitud.id"
                        class="text-xs"
                      >
                        <mat-icon class="text-sm">check</mat-icon>
                        Aprobar
                      </button>
                      <button
                        *ngIf="
                          canManageSolicitud(solicitud) &&
                          solicitud.estatus === 'pendiente'
                        "
                        mat-raised-button
                        color="warn"
                        (click)="rechazar(solicitud)"
                        [disabled]="processingId === solicitud.id"
                        class="text-xs"
                      >
                        <mat-icon class="text-sm">close</mat-icon>
                        Rechazar
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </mat-card>
      </div>
    </div>
  `,
  styles: [],
})
export class AdminAreaDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private usersService = inject(UsersService);
  private funcionesService = inject(FuncionesService);
  private usersAccessService = inject(UsersAccesService);
  private router = inject(Router);

  // Estado del componente
  loading = false;
  hasPermissions = false;
  processingId: string | null = null;
  headerTitle = 'Dashboard Admin de Área';

  // Datos del AdminArea
  currentAdminData: User | null = null;
  adminAreas: string[] = [];
  adminFunciones: string[] = [];

  // Solicitudes
  allSolicitudes: UserAccess[] = [];
  filteredSolicitudes: UserAccess[] = [];
  funcionesMap: Map<string, string> = new Map(); // ID -> Nombre

  // Contadores
  pendingCount = 0;
  approvedCount = 0;
  rejectedCount = 0;

  async ngOnInit() {
    console.log('🚀 Iniciando AdminArea Dashboard...');
    try {
      await this.loadFunciones();
      await this.loadAdminData();
      if (this.hasPermissions) {
        await this.loadSolicitudes();
      } else {
        console.warn('⚠️ No se cargarán solicitudes - sin permisos');
      }
    } catch (error) {
      console.error('❌ Error en ngOnInit:', error);
    }
  }

  async loadFunciones() {
    try {
      console.log('📚 Cargando funciones...');
      const funciones = await this.funcionesService.getFunciones();
      funciones.forEach((func) => {
        if (func.id) {
          this.funcionesMap.set(func.id, func.nombre);
        }
      });
      console.log('✅ Mapa de funciones cargado:', this.funcionesMap);
    } catch (error) {
      console.error('❌ Error cargando funciones:', error);
    }
  }

  /**
   * Cargar datos del AdminArea desde Firestore
   */
  private async loadAdminData() {
    try {
      console.log('🔍 Iniciando carga de datos del AdminArea...');
      const currentUser = this.authService.getCurrentUser();
      console.log('🔍 Usuario actual (getCurrentUser):', currentUser?.email);

      if (!currentUser?.email) {
        console.log('❌ No hay email del usuario');
        this.hasPermissions = false;
        return;
      }

      console.log('📞 Consultando datos del usuario en Firestore...');
      this.currentAdminData = await this.usersService.getUserByEmail(
        currentUser.email
      );

      console.log(
        '📋 Datos del AdminArea desde Firestore:',
        this.currentAdminData
      );

      if (!this.currentAdminData) {
        console.log('❌ No se encontraron datos del usuario');
        this.hasPermissions = false;
        return;
      }

      // Obtener áreas y funciones del AdminArea
      this.adminAreas = this.currentAdminData.areaIds || [];
      this.adminFunciones = this.currentAdminData.funcionIds || [];

      console.log('✅ Áreas del AdminArea:', this.adminAreas);
      console.log('✅ Áreas length:', this.adminAreas.length);
      console.log('✅ Funciones del AdminArea:', this.adminFunciones);
      console.log('✅ Funciones length:', this.adminFunciones.length);

      // Verificar que tenga al menos un área y una función asignada
      this.hasPermissions =
        this.adminAreas.length > 0 && this.adminFunciones.length > 0;

      console.log('🔍 Evaluación de permisos:', {
        areasLength: this.adminAreas.length,
        funcionesLength: this.adminFunciones.length,
        condition1: this.adminAreas.length > 0,
        condition2: this.adminFunciones.length > 0,
        hasPermissions: this.hasPermissions,
      });

      // ✅ Actualizar título con apodo
      if (this.currentAdminData.apodo) {
        this.headerTitle = `Bienvenido ${this.currentAdminData.apodo}`;
      }

      console.log('🔐 Tiene permisos:', this.hasPermissions);
    } catch (error) {
      console.error('Error cargando datos del AdminArea:', error);
      this.hasPermissions = false;
    }
  }

  /**
   * Cargar todas las solicitudes y filtrarlas según permisos
   */
  async loadSolicitudes() {
    if (!this.hasPermissions) {
      console.log('⚠️ No se cargan solicitudes porque no tiene permisos');
      return;
    }

    this.loading = true;
    try {
      // Obtener todas las solicitudes de usersAccess
      this.allSolicitudes = await this.usersAccessService.getUsers();
      console.log(
        '📥 Total de solicitudes en Firestore:',
        this.allSolicitudes.length
      );
      console.log('📥 Solicitudes completas:', this.allSolicitudes);

      // Filtrar en memoria según areaId AND funcion
      this.filteredSolicitudes = this.allSolicitudes.filter((solicitud) => {
        const canView = this.canViewSolicitud(solicitud);
        console.log(`🔍 Solicitud ${solicitud.nombre}:`, {
          areaId: solicitud.areaId,
          funcion: solicitud.funcion,
          canView: canView,
        });
        return canView;
      });

      console.log('✅ Solicitudes filtradas:', this.filteredSolicitudes.length);

      // Actualizar contadores
      this.updateCounts();
    } catch (error) {
      console.error('Error cargando solicitudes:', error);
      this.filteredSolicitudes = [];
    } finally {
      this.loading = false;
    }
  }

  /**
   * Verificar si el AdminArea puede ver esta solicitud
   * Regla: areaId debe estar en adminAreas AND funcion debe estar en adminFunciones
   */
  private canViewSolicitud(solicitud: UserAccess): boolean {
    if (!solicitud.areaId || !solicitud.funcion) {
      console.log('❌ Solicitud sin areaId o funcion:', solicitud);
      return false;
    }

    // Limpiar espacios y normalizar
    const solicitudAreaId = solicitud.areaId.trim();
    const solicitudFuncion = solicitud.funcion.trim();

    const hasArea = this.adminAreas.some(
      (area) => area.trim() === solicitudAreaId
    );
    const hasFuncion = this.adminFunciones.some(
      (func) => func.trim() === solicitudFuncion
    );

    console.log('🔍 Verificando solicitud:', {
      solicitudAreaId: solicitudAreaId,
      solicitudFuncion: solicitudFuncion,
      adminAreas: this.adminAreas,
      adminFunciones: this.adminFunciones,
      hasArea: hasArea,
      hasFuncion: hasFuncion,
      result: hasArea && hasFuncion,
      solicitudNombre: solicitud.nombre,
    });

    return hasArea && hasFuncion;
  }

  /**
   * Verificar si el AdminArea puede gestionar esta solicitud
   */
  canManageSolicitud(solicitud: UserAccess): boolean {
    return this.canViewSolicitud(solicitud);
  }

  /**
   * Aprobar solicitud
   */
  async aprobar(solicitud: UserAccess) {
    if (!solicitud.id || !this.canManageSolicitud(solicitud)) {
      console.error('No tienes permisos para aprobar esta solicitud');
      return;
    }

    this.processingId = solicitud.id;
    try {
      await this.usersAccessService.updateUser(solicitud.id, {
        estatus: 'aprobado',
      });

      // Actualizar localmente
      solicitud.estatus = 'aprobado';
      this.updateCounts();

      console.log('Solicitud aprobada correctamente');
    } catch (error) {
      console.error('Error al aprobar solicitud:', error);
    } finally {
      this.processingId = null;
    }
  }

  /**
   * Rechazar solicitud
   */
  async rechazar(solicitud: UserAccess) {
    if (!solicitud.id || !this.canManageSolicitud(solicitud)) {
      console.error('No tienes permisos para rechazar esta solicitud');
      return;
    }

    this.processingId = solicitud.id;
    try {
      await this.usersAccessService.updateUser(solicitud.id, {
        estatus: 'rechazado',
      });

      // Actualizar localmente
      solicitud.estatus = 'rechazado';
      this.updateCounts();

      console.log('Solicitud rechazada correctamente');
    } catch (error) {
      console.error('Error al rechazar solicitud:', error);
    } finally {
      this.processingId = null;
    }
  }

  /**
   * Actualizar contadores de solicitudes
   */
  private updateCounts() {
    this.pendingCount = this.filteredSolicitudes.filter(
      (s) => s.estatus === 'pendiente'
    ).length;
    this.approvedCount = this.filteredSolicitudes.filter(
      (s) => s.estatus === 'aprobado'
    ).length;
    this.rejectedCount = this.filteredSolicitudes.filter(
      (s) => s.estatus === 'rechazado'
    ).length;
  }

  async logout() {
    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
}
