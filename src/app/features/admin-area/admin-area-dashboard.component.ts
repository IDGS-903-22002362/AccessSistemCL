import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { UsersService, User } from '../../core/services/users.service';
import { RolesService } from '../../core/services/roles.service';
import {
  FuncionesService,
  Funcion,
} from '../../core/services/funciones.service';
import { AreasService, Area } from '../../core/services/areas.service';
import {
  UsersAccesService,
  UserAccess,
} from '../../core/services/usersSolicitud.service';
import { UserJornadaComponent } from '../user/user-jornada.component';

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
    MatCheckboxModule,
    MatDialogModule,
    MatTooltipModule,
    FormsModule,
    HttpClientModule,
    UserJornadaComponent,
  ],
  template: `
    <div class="min-h-screen bg-white p-6">
      <div class="max-w-7xl mx-auto">
        <div
          class="flex justify-between items-center mb-8 bg-[#007A53] text-white p-6 rounded-lg shadow-lg"
        >
          <h1 class="text-3xl font-bold">
            {{ headerTitle }}
          </h1>
          <button
            mat-raised-button
            (click)="logout()"
            class="flex items-center gap-2 !bg-white !text-[#007A53] hover:!bg-gray-100"
          >
            <mat-icon>logout</mat-icon>
            Cerrar Sesión
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <mat-card class="p-6 border-2 border-[#007A53]">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-semibold text-[#007A53]">
                Solicitudes Pendientes
              </h2>
              <mat-icon
                class="text-orange-500"
                style="font-size: 48px; width: 48px; height: 48px;"
                >schedule</mat-icon
              >
            </div>
            <p class="text-4xl font-bold text-[#007A53]">{{ pendingCount }}</p>
            <p class="text-gray-600 mt-2">Pendientes de revisión</p>
          </mat-card>

          <mat-card class="p-6 border-2 border-[#007A53]">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-semibold text-[#007A53]">
                Solicitudes Aprobadas
              </h2>
              <mat-icon
                class="text-[#007A53]"
                style="font-size: 48px; width: 48px; height: 48px;"
                >check_circle</mat-icon
              >
            </div>
            <p class="text-4xl font-bold text-[#007A53]">{{ approvedCount }}</p>
            <p class="text-gray-600 mt-2">Aprobadas</p>
          </mat-card>

          <mat-card class="p-6 border-2 border-[#007A53]">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-semibold text-[#007A53]">
                Solicitudes Rechazadas
              </h2>
              <mat-icon
                class="text-red-500"
                style="font-size: 48px; width: 48px; height: 48px;"
                >cancel</mat-icon
              >
            </div>
            <p class="text-4xl font-bold text-red-600">{{ rejectedCount }}</p>
            <p class="text-gray-600 mt-2">Rechazadas</p>
          </mat-card>
        </div>
        <div class="mt-8 flex justify-center">
          <!--Componente de jornadas -->
          <app-user-jornada></app-user-jornada>
        </div>

        <mat-card class="mt-8 p-6 border-2 border-[#007A53]">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-semibold text-[#007A53]">
              Solicitudes de Acceso
            </h2>
            <div class="flex gap-2">
              <button
                mat-raised-button
                (click)="showFilters = !showFilters"
                [disabled]="loading"
                class="!bg-[#007A53] !text-white hover:!bg-[#006644]"
              >
                <mat-icon>filter_list</mat-icon>
                <span class="ml-2">Filtros</span>
              </button>
              <button
                mat-raised-button
                (click)="loadSolicitudes()"
                [disabled]="loading"
                class="!bg-[#007A53] !text-white hover:!bg-[#006644]"
              >
                <mat-icon>refresh</mat-icon>
                <span class="ml-2">Actualizar</span>
              </button>
            </div>
          </div>

          <!-- Panel de Filtros -->
          <div
            *ngIf="showFilters"
            class="bg-[#007A53] bg-opacity-5 border border-[#007A53] p-4 rounded-lg mb-4 grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <div>
              <label class="block text-sm font-medium text-[#007A53] mb-1"
                >Área</label
              >
              <select
                [(ngModel)]="filters.area"
                (change)="applyFilters()"
                class="w-full p-2 border-2 border-[#007A53] rounded focus:outline-none focus:ring-2 focus:ring-[#007A53]"
              >
                <option value="">Todas</option>
                <option *ngFor="let area of uniqueAreas" [value]="area">
                  {{ areasMap.get(area) || area }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-[#007A53] mb-1"
                >Estado</label
              >
              <select
                [(ngModel)]="filters.estado"
                (change)="applyFilters()"
                class="w-full p-2 border-2 border-[#007A53] rounded focus:outline-none focus:ring-2 focus:ring-[#007A53]"
              >
                <option value="">Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="aprobado">Aprobado</option>
                <option value="rechazado">Rechazado</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-[#007A53] mb-1"
                >Función</label
              >
              <select
                [(ngModel)]="filters.funcion"
                (change)="applyFilters()"
                class="w-full p-2 border-2 border-[#007A53] rounded focus:outline-none focus:ring-2 focus:ring-[#007A53]"
              >
                <option value="">Todas</option>
                <option *ngFor="let func of uniqueFunciones" [value]="func">
                  {{ funcionesMap.get(func) || func }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-[#007A53] mb-1"
                >Registrante</label
              >
              <select
                [(ngModel)]="filters.registrante"
                (change)="applyFilters()"
                class="w-full p-2 border-2 border-[#007A53] rounded focus:outline-none focus:ring-2 focus:ring-[#007A53]"
              >
                <option value="">Todos</option>
                <option *ngFor="let reg of uniqueRegistrantes" [value]="reg">
                  {{ reg }}
                </option>
              </select>
            </div>
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
              <thead class="bg-[#007A53] text-white">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase">
                    Nombre
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase">
                    Email
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase">
                    Área
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase">
                    Función
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase">
                    Teléfono
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase">
                    Estado
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase">
                    PDF
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr
                  *ngFor="let solicitud of filteredSolicitudes"
                  class="hover:bg-[#007A53] hover:bg-opacity-5"
                  [class.bg-[#007A53]]="selectedSolicitudes.has(solicitud.id!)"
                  [class.bg-opacity-10]="selectedSolicitudes.has(solicitud.id!)"
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
                    {{ areasMap.get(solicitud.areaId) || solicitud.areaId }}
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
                  <td class="px-4 py-4 whitespace-nowrap text-center">
                    <button
                      *ngIf="
                        solicitud.estatus === 'aprobado' && solicitud.pdfUrl
                      "
                      mat-icon-button
                      color="primary"
                      (click)="downloadPDF(solicitud.pdfUrl, solicitud.nombre)"
                      matTooltip="Descargar acreditación"
                    >
                      <mat-icon>download</mat-icon>
                    </button>
                    <span
                      *ngIf="
                        !(solicitud.estatus === 'aprobado' && solicitud.pdfUrl)
                      "
                      class="text-gray-400"
                      >-</span
                    >
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
  private rolesService = inject(RolesService);
  private funcionesService = inject(FuncionesService);
  private areasService = inject(AreasService);
  private usersAccessService = inject(UsersAccesService);
  private router = inject(Router);

  // Estado del componente
  loading = false;
  hasPermissions = false;
  processing = false;
  headerTitle = 'Dashboard Admin de Área';

  // Datos del AdminArea
  currentAdminData: User | null = null;
  adminAreas: string[] = [];
  adminFunciones: string[] = [];
  isAdminEspecial = false;

  // Solicitudes
  allSolicitudes: UserAccess[] = [];
  filteredSolicitudes: UserAccess[] = [];
  funcionesMap: Map<string, string> = new Map();
  areasMap: Map<string, string> = new Map();

  // Selección múltiple
  selectedSolicitudes: Set<string> = new Set();
  selectAll = false;

  // Filtros
  filters = {
    area: '',
    estado: '',
    funcion: '',
    registrante: '',
  };
  showFilters = false;

  // Opciones para filtros
  uniqueAreas: string[] = [];
  uniqueFunciones: string[] = [];
  uniqueRegistrantes: string[] = [];

  // Contadores
  pendingCount = 0;
  approvedCount = 0;
  rejectedCount = 0;

  async ngOnInit() {
    console.log('🚀 Iniciando AdminArea Dashboard...');
    this.loading = true;
    try {
      await this.loadFunciones();
      await this.loadAreas();
      await this.loadAdminData();
      if (this.hasPermissions) {
        await this.loadSolicitudes();
      } else {
        console.warn('⚠️ No se cargarán solicitudes - sin permisos');
        this.loading = false;
      }
    } catch (error) {
      console.error('❌ Error en ngOnInit:', error);
      this.loading = false;
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

  async loadAreas() {
    try {
      console.log('🏢 Cargando áreas...');
      const areas = await this.areasService.getAreas();
      areas.forEach((area) => {
        if (area.id) {
          this.areasMap.set(area.id, area.nombre);
        }
      });
      console.log('✅ Mapa de áreas cargado:', this.areasMap);
    } catch (error) {
      console.error('❌ Error cargando áreas:', error);
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

      // Verificar si es AdminEspecial
      const roles = await this.rolesService.getRoles();
      const userRole = roles.find((r) => r.id === this.currentAdminData?.role);
      this.isAdminEspecial = userRole?.name === 'AdminEspecial';

      console.log('👤 Rol del usuario:', userRole?.name);
      console.log('🔑 Es AdminEspecial:', this.isAdminEspecial);

      // AdminEspecial tiene acceso completo sin restricciones
      // Para otros roles, verificar que tengan al menos un área y una función
      if (this.isAdminEspecial) {
        this.hasPermissions = true;
        console.log('✅ AdminEspecial detectado: acceso completo otorgado');
      } else {
        this.hasPermissions =
          this.adminAreas.length > 0 && this.adminFunciones.length > 0;

        console.log('🔍 Evaluación de permisos:', {
          areasLength: this.adminAreas.length,
          funcionesLength: this.adminFunciones.length,
          condition1: this.adminAreas.length > 0,
          condition2: this.adminFunciones.length > 0,
          hasPermissions: this.hasPermissions,
        });
      }

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
      this.loading = false;
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

      // Filtrar en memoria según permisos
      this.filteredSolicitudes = this.allSolicitudes.filter((solicitud) => {
        return this.canViewSolicitud(solicitud);
      });

      console.log('✅ Solicitudes filtradas:', this.filteredSolicitudes.length);

      // Actualizar contadores
      this.updateCounts();

      // Extraer opciones únicas para filtros
      this.extractFilterOptions();
    } catch (error) {
      console.error('Error cargando solicitudes:', error);
      this.filteredSolicitudes = [];
    } finally {
      this.loading = false;
    }
  }

  /**
   * Extraer opciones únicas para los filtros
   */
  private extractFilterOptions() {
    const areas = new Set<string>();
    const funciones = new Set<string>();
    const registrantes = new Set<string>();

    this.filteredSolicitudes.forEach((sol) => {
      if (sol.areaId) areas.add(sol.areaId);
      if (sol.funcion) funciones.add(sol.funcion);
      if (sol.registrantEmail) registrantes.add(sol.registrantEmail);
    });

    this.uniqueAreas = Array.from(areas);
    this.uniqueFunciones = Array.from(funciones);
    this.uniqueRegistrantes = Array.from(registrantes);
  }

  /**
   * Aplicar filtros a las solicitudes
   */
  applyFilters() {
    let filtered = this.allSolicitudes.filter((solicitud) =>
      this.canViewSolicitud(solicitud)
    );

    if (this.filters.area) {
      filtered = filtered.filter((s) => s.areaId === this.filters.area);
    }
    if (this.filters.estado) {
      filtered = filtered.filter((s) => s.estatus === this.filters.estado);
    }
    if (this.filters.funcion) {
      filtered = filtered.filter((s) => s.funcion === this.filters.funcion);
    }
    if (this.filters.registrante) {
      filtered = filtered.filter(
        (s) => s.registrantEmail === this.filters.registrante
      );
    }

    this.filteredSolicitudes = filtered;
    this.updateCounts();
    this.selectedSolicitudes.clear();
    this.selectAll = false;
  }

  /**
   * Toggle selección individual
   */
  toggleSelection(id: string) {
    if (this.selectedSolicitudes.has(id)) {
      this.selectedSolicitudes.delete(id);
    } else {
      this.selectedSolicitudes.add(id);
    }
    this.updateSelectAll();
  }

  /**
   * Toggle seleccionar todas
   */
  toggleSelectAll() {
    if (this.selectAll) {
      // Seleccionar solo las pendientes que pueden gestionarse
      this.filteredSolicitudes.forEach((sol) => {
        if (
          sol.id &&
          sol.estatus === 'pendiente' &&
          this.canManageSolicitud(sol)
        ) {
          this.selectedSolicitudes.add(sol.id);
        }
      });
    } else {
      this.selectedSolicitudes.clear();
    }
  }

  /**
   * Actualizar estado de selectAll
   */
  private updateSelectAll() {
    const pendientes = this.filteredSolicitudes.filter(
      (s) => s.estatus === 'pendiente' && this.canManageSolicitud(s)
    );
    this.selectAll =
      pendientes.length > 0 &&
      pendientes.every((s) => s.id && this.selectedSolicitudes.has(s.id));
  }

  /**
   * Obtener cantidad de solicitudes pendientes
   */
  getPendienteCount(): number {
    return this.filteredSolicitudes.filter(
      (s) => s.estatus === 'pendiente' && this.canManageSolicitud(s)
    ).length;
  }

  /**
   * Verificar si el AdminArea puede ver esta solicitud
   * Regla: AdminEspecial puede ver todas las solicitudes
   * Otros roles: areaId debe estar en adminAreas AND funcion debe estar en adminFunciones
   */
  private canViewSolicitud(solicitud: UserAccess): boolean {
    // AdminEspecial puede ver todas las solicitudes
    if (this.isAdminEspecial) {
      return true;
    }

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
   * Aprobar solicitudes seleccionadas
   */
  async aprobarSeleccionadas() {
    if (this.selectedSolicitudes.size === 0) {
      alert('No hay solicitudes seleccionadas');
      return;
    }

    const confirmacion = confirm(
      `¿Está seguro de aprobar ${this.selectedSolicitudes.size} solicitud(es)?`
    );
    if (!confirmacion) return;

    this.processing = true;
    const currentUser = this.authService.getCurrentUser();
    const reviewerEmail = currentUser?.email || 'desconocido';
    let exitosos = 0;
    let fallidos = 0;

    for (const id of this.selectedSolicitudes) {
      const solicitud = this.allSolicitudes.find((s) => s.id === id);
      if (!solicitud || !this.canManageSolicitud(solicitud)) continue;

      try {
        // Actualizar en Firestore
        // ✅ El correo se enviará automáticamente por Cloud Function
        await this.usersAccessService.updateUser(id, {
          estatus: 'aprobado',
          reviewedBy: reviewerEmail,
          reviewedAt: new Date(),
        });

        console.log('✅ Solicitud aprobada:', solicitud.email);
        console.log('📧 Cloud Function enviará el correo automáticamente');

        // Actualizar localmente
        solicitud.estatus = 'aprobado';
        solicitud.reviewedBy = reviewerEmail;
        solicitud.reviewedAt = new Date();
        exitosos++;
      } catch (error) {
        console.error('Error aprobando solicitud:', id, error);
        fallidos++;
      }
    }

    this.selectedSolicitudes.clear();
    this.selectAll = false;
    this.updateCounts();
    this.processing = false;

    if (exitosos > 0) {
      alert(
        `✅ Aprobadas: ${exitosos}\n❌ Fallidas: ${fallidos}\n\n📧 Los correos se enviarán automáticamente por Cloud Functions.`
      );
    } else {
      alert(`❌ No se pudo aprobar ninguna solicitud. Fallidas: ${fallidos}`);
    }
  }

  /**
   * Rechazar solicitudes seleccionadas
   */
  async rechazarSeleccionadas() {
    if (this.selectedSolicitudes.size === 0) {
      alert('No hay solicitudes seleccionadas');
      return;
    }

    const confirmacion = confirm(
      `¿Está seguro de rechazar ${this.selectedSolicitudes.size} solicitud(es)?`
    );
    if (!confirmacion) return;

    this.processing = true;
    const currentUser = this.authService.getCurrentUser();
    const reviewerEmail = currentUser?.email || 'desconocido';
    let exitosos = 0;
    let fallidos = 0;

    for (const id of this.selectedSolicitudes) {
      const solicitud = this.allSolicitudes.find((s) => s.id === id);
      if (!solicitud || !this.canManageSolicitud(solicitud)) continue;

      try {
        // Actualizar en Firestore
        // ✅ El correo se enviará automáticamente por Cloud Function
        await this.usersAccessService.updateUser(id, {
          estatus: 'rechazado',
          reviewedBy: reviewerEmail,
          reviewedAt: new Date(),
        });

        console.log('✅ Solicitud rechazada:', solicitud.email);
        console.log('📧 Cloud Function enviará el correo automáticamente');

        // Actualizar localmente
        solicitud.estatus = 'rechazado';
        solicitud.reviewedBy = reviewerEmail;
        solicitud.reviewedAt = new Date();
        exitosos++;
      } catch (error) {
        console.error('Error rechazando solicitud:', id, error);
        fallidos++;
      }
    }

    this.selectedSolicitudes.clear();
    this.selectAll = false;
    this.updateCounts();
    this.processing = false;

    alert(`✅ Rechazadas: ${exitosos}\n❌ Fallidas: ${fallidos}`);
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

  goToRegistro() {
    this.router.navigate(['/user/registro']);
  }

  downloadPDF(pdfUrl: string, userName: string): void {
    if (!pdfUrl) {
      console.error('No hay URL de PDF disponible');
      return;
    }

    // Crear un elemento anchor temporal para descargar
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.target = '_blank';
    link.download = `acreditacion_${userName.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
