import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AuthService } from '../../core/services/auth.service';
import { UsersService } from '../../core/services/users.service';
import {
  UsersAccesService,
  UserAccess,
} from '../../core/services/usersSolicitud.service';
import { take, filter } from 'rxjs/operators';
import { User } from '@angular/fire/auth';
import { FuncionesService } from '../../core/services/funciones.service';
import { EmpresasService } from '../../core/services/empresas.service';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserJornadaComponent } from '../user/user-jornada.component';
import { UserFormEspecialComponent } from './user-formularioEspecial.component';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule, // âœ… NECESARIO PARA ngModel
    MatCheckboxModule,
    MatTooltipModule,
    UserJornadaComponent, // (opcional, ya lo importaste)
    UserFormEspecialComponent, //(componente de formulario especial para Hamco)
  ],

  template: `
    <div class="min-h-screen bg-gray-50">
      <mat-toolbar style="background-color:#007A53" class="shadow-md">
        <div class="flex items-center gap-3 text-white">
          <img src="images/leon.png" alt="Club LeÃ³n" class="h-8 w-auto" />
          <span class="font-medium"> Bienvenido, {{ currentUserName }} </span>
        </div>

        <span class="flex-1"></span>

        <button mat-icon-button (click)="logout()" class="text-white">
          <mat-icon>logout</mat-icon>
        </button>
      </mat-toolbar>

      <div class="container mx-auto p-6">
        <div
          *ngIf="!isHamcoUser"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        >
          <mat-card class="hover:shadow-lg transition-shadow">
            <mat-card-header>
              <mat-card-title>Usuarios Registrados</mat-card-title>
            </mat-card-header>
            <mat-card-content class="text-center py-8">
              <div class="text-4xl font-bold text-blue-600">
                {{ totalUsuarios }}
              </div>
              <p class="text-gray-600 mt-2">Solicitudes activas</p>
            </mat-card-content>
          </mat-card>

          <mat-card class="hover:shadow-lg transition-shadow">
            <mat-card-header>
              <mat-card-title>Accesos</mat-card-title>
            </mat-card-header>
            <mat-card-content class="text-center py-8">
              <div class="text-4xl font-bold text-green-600">
                {{ usuariosAprobados }}
              </div>
              <p class="text-gray-600 mt-2">Accesos autorizados</p>
            </mat-card-content>
          </mat-card>

          <mat-card class="hover:shadow-lg transition-shadow">
            <mat-card-header>
              <mat-card-title>Canjeados</mat-card-title>
            </mat-card-header>
            <mat-card-content class="text-center py-8">
              <div class="text-4xl font-bold text-gray-400">
                {{ usuariosCanjeados }}
              </div>
              <p class="text-gray-600 mt-2">Accesos canjeados</p>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Componente de jornadas con ancho limitado -->
        <div class="flex justify-center mb-8">
          <div class="w-full max-w-4xl">
            <app-user-jornada></app-user-jornada>
          </div>
        </div>

        <!-- Formulario especial SOLO para hamco -->
        <div *ngIf="isHamcoUser" class="flex justify-center mb-8">
          <div class="w-full max-w-6xl">
            <app-user-form-especial></app-user-form-especial>
          </div>
        </div>

        <mat-card>
          <mat-card-header>
            <mat-card-title>Solicitudes Recientes</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="overflow-x-auto">
              <div class="flex gap-2 mb-4 flex-wrap items-center">
                <!-- Buscador -->
                <div class="flex-1 min-w-[250px] relative">
                  <div class="relative">
                    <mat-icon
                      class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >search</mat-icon
                    >
                    <input
                      [(ngModel)]="searchText"
                      (ngModelChange)="applySearch()"
                      placeholder="Buscar por nombre o email"
                      class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007A53] focus:border-transparent"
                    />
                  </div>
                </div>

                <button
                  mat-raised-button
                  (click)="showFilters = !showFilters"
                  style="background-color:#007A53; color:white; height: 48px;"
                >
                  <mat-icon>filter_list</mat-icon>
                  <span class="ml-2">Filtros</span>
                </button>
              </div>

              <div
                *ngIf="showFilters"
                class="bg-[#007A53] bg-opacity-5 border border-[#007A53]
         p-4 rounded-lg mb-4 grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <!-- Estado -->
                <div>
                  <label class="block text-sm font-medium text-[#007A53] mb-1">
                    Estado
                  </label>
                  <select
                    [(ngModel)]="filters.estado"
                    (change)="applyFilters()"
                    class="w-full p-2 border-2 border-[#007A53] rounded
             focus:outline-none focus:ring-2 focus:ring-[#007A53]"
                  >
                    <option value="">Todos</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="aprobado">Aprobado</option>
                    <option value="canjeado">Canjeado</option>
                  </select>
                </div>

                <!-- FunciÃ³n -->
                <div>
                  <label class="block text-sm font-medium text-[#007A53] mb-1">
                    Función
                  </label>
                  <select
                    [(ngModel)]="filters.funcion"
                    (change)="applyFilters()"
                    class="w-full p-2 border-2 border-[#007A53] rounded
             focus:outline-none focus:ring-2 focus:ring-[#007A53]"
                  >
                    <option value="">Todas</option>
                    <option *ngFor="let func of uniqueFunciones" [value]="func">
                      {{ funcionesMap.get(func) || func }}
                    </option>
                  </select>
                </div>
              </div>

              <table mat-table [dataSource]="paginatedUsers" class="w-full">
                <!-- Nombre -->
                <ng-container matColumnDef="nombre">
                  <th mat-header-cell *matHeaderCellDef>Nombre</th>
                  <td mat-cell *matCellDef="let user">
                    {{ user.nombre }} {{ user.apellidoPaterno }}
                  </td>
                </ng-container>

                <!-- Email -->
                <ng-container matColumnDef="email">
                  <th mat-header-cell *matHeaderCellDef>Email</th>
                  <td mat-cell *matCellDef="let user">{{ user.email }}</td>
                </ng-container>

                <!-- Empresa -->
                <ng-container matColumnDef="empresa">
                  <th mat-header-cell *matHeaderCellDef>Empresa</th>
                  <td mat-cell *matCellDef="let user">
                    {{ user.empresaNombre }}
                  </td>
                </ng-container>

                <!-- FunciÃ³n -->
                <ng-container matColumnDef="funcion">
                  <th mat-header-cell *matHeaderCellDef>Función</th>
                  <td mat-cell *matCellDef="let user">
                    {{ user.funcionNombre }}
                  </td>
                </ng-container>

                <!-- Estatus -->
                <ng-container matColumnDef="estatus">
                  <th mat-header-cell *matHeaderCellDef>Estatus</th>
                  <td mat-cell *matCellDef="let user">
                    <span [class]="getEstadoClass(user.estatus)">
                      {{ user.estatusNormalized || user.estatus | titlecase }}
                    </span>
                  </td>
                </ng-container>

                <!-- Fecha -->
                <ng-container matColumnDef="fecha">
                  <th mat-header-cell *matHeaderCellDef>Fecha</th>
                  <td mat-cell *matCellDef="let user">{{ user.fecha }}</td>
                </ng-container>

                <!-- PDF -->
                <ng-container matColumnDef="pdf">
                  <th mat-header-cell *matHeaderCellDef>PDF</th>
                  <td mat-cell *matCellDef="let user">
                    @if (user.estatusNormalized === 'aprobado' &&
                    user.pdfUrlResolved) {
                    <button
                      mat-icon-button
                      color="primary"
                      (click)="downloadPDF(user.pdfUrlResolved, user.nombre)"
                      matTooltip="Descargar acreditación"
                    >
                      <mat-icon>download</mat-icon>
                    </button>
                    } @else {
                    <span class="text-gray-400">-</span>
                    }
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr
                  mat-row
                  *matRowDef="let row; columns: displayedColumns"
                ></tr>
              </table>

              @if (paginatedUsers.length === 0) {
              <div class="text-center py-8 text-gray-500">
                No hay solicitudes registradas
              </div>
              }

              <!-- Paginador -->
              @if (filteredUsers.length > 0) {
              <div
                class="flex justify-between items-center mt-4 text-sm text-gray-600"
              >
                <div>
                  Mostrando {{ startIndex + 1 }} - {{ endIndex }} de
                  {{ filteredUsers.length }} registros
                </div>
                <div class="flex gap-2">
                  <button
                    mat-icon-button
                    [disabled]="currentPage === 1"
                    (click)="previousPage()"
                  >
                    <mat-icon>chevron_left</mat-icon>
                  </button>
                  <span class="flex items-center px-2">
                    Página {{ currentPage }} de {{ totalPages }}
                  </span>
                  <button
                    mat-icon-button
                    [disabled]="currentPage === totalPages"
                    (click)="nextPage()"
                  >
                    <mat-icon>chevron_right</mat-icon>
                  </button>
                </div>
              </div>
              }
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class UserDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private usersAccessService = inject(UsersAccesService);
  private cdr = inject(ChangeDetectorRef);
  currentUserName = '';
  private funcionesService = inject(FuncionesService);
  private empresasService = inject(EmpresasService);
  funcionesMap = new Map<string, string>();
  empresasMap = new Map<string, string>();
  isHamcoUser = false;

  // ===== Filtros =====
  showFilters = false;

  searchText = '';
  filters = {
    estado: '',
    funcion: '',
  };

  allUsers: any[] = []; // respaldo sin filtrar
  filteredUsers: any[] = []; // lo que se muestra despuÃ©s de filtros
  paginatedUsers: any[] = []; // lo que se muestra en la pÃ¡gina actual

  // PaginaciÃ³n
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  startIndex = 0;
  endIndex = 0;

  uniqueFunciones: string[] = [];

  async loadFunciones(): Promise<void> {
    const funciones = await this.funcionesService.getFunciones();

    funciones.forEach((funcion) => {
      if (funcion.id) {
        this.funcionesMap.set(funcion.id, funcion.nombre);
      }
    });
  }

  async loadEmpresas(): Promise<void> {
    const empresas = await this.empresasService.getEmpresas();

    empresas.forEach((empresa) => {
      if (empresa.id) {
        this.empresasMap.set(empresa.id, empresa.nombre);
      }
    });
  }

  displayedColumns: string[] = [
    'nombre',
    'email',
    'empresa',
    'funcion',
    'estatus',
    'fecha',
    'pdf',
  ];

  dataSource: any[] = []; // Placeholder vacÃ­o

  //contadores
  totalUsuarios = 0;
  usuariosAprobados = 0;
  usuariosCanjeados = 0;

  async loadUsers(): Promise<void> {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser?.email) return;

      const users = await this.usersAccessService.getUsersByRegistrant(
        currentUser.email
      );

      const mapped = users.map((user) => {
        const estatusNormalized = this.normalizeStatus(user.estatus);
        const pdfUrlResolved =
          user.pdfUrl ||
          (user as { pdfURL?: string }).pdfURL ||
          (user as { pdf_url?: string }).pdf_url ||
          '';

        return {
          ...user,
          estatusNormalized,
          pdfUrlResolved,
          funcionNombre: this.funcionesMap.get(user.funcion) || '?',
          empresaNombre: this.empresasMap.get(user.empresaId) || '?',
          fecha: user.createdAt?.toDate
            ? user.createdAt.toDate().toLocaleDateString()
            : '?',
        };
      });

      this.allUsers = mapped;
      this.filteredUsers = mapped;
      this.updatePagination();

      // opciones únicas
      this.uniqueFunciones = [...new Set(mapped.map((u) => u.funcion))];

      this.totalUsuarios = users.length;
      this.usuariosAprobados = mapped.filter(
        (u) => u.estatusNormalized === 'aprobado'
      ).length;
      this.usuariosCanjeados = users.filter(
        (u) => u.estatus === 'canjeado'
      ).length;

      // Forzar detección de cambios para actualizar la vista inmediatamente
      this.cdr.markForCheck();
      this.cdr.detectChanges();

      console.log('✅ Usuarios cargados y vista actualizada:', users.length);

      // Verificar si hay usuarios aprobados sin PDF y programar recargas
      this.checkForPendingPDFs(mapped);
    } catch (error) {
      console.error('Error cargando usuarios', error);
    }
  }

  /**
   * Verifica si hay usuarios aprobados sin PDF y programa recargas automáticas
   */
  private checkForPendingPDFs(users: any[]): void {
    const usuariosSinPDF = users.filter(
      (u) => u.estatusNormalized === 'aprobado' && !u.pdfUrlResolved
    );

    if (usuariosSinPDF.length > 0) {
      console.log(
        `⏳ Hay ${usuariosSinPDF.length} usuarios aprobados esperando PDF...`
      );

      // Programar recarga en 3 segundos
      setTimeout(() => {
        console.log('🔄 Recargando para verificar PDFs generados...');
        this.loadUsers();
      }, 3000);
    }
  }

  applySearch(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.allUsers];

    // Filtro de bÃºsqueda por nombre o email
    if (this.searchText.trim()) {
      const search = this.searchText.toLowerCase();
      filtered = filtered.filter((u) => {
        const nombreCompleto = `${u.nombre} ${u.apellidoPaterno}`.toLowerCase();
        const email = u.email?.toLowerCase() || '';
        return nombreCompleto.includes(search) || email.includes(search);
      });
    }

    if (this.filters.estado) {
      const normalizedFilter = this.normalizeStatus(this.filters.estado);
      filtered = filtered.filter(
        (u) => u.estatusNormalized === normalizedFilter
      );
    }

    if (this.filters.funcion) {
      filtered = filtered.filter((u) => u.funcion === this.filters.funcion);
    }

    this.filteredUsers = filtered;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredUsers.length / this.pageSize);
    if (this.totalPages === 0) this.totalPages = 1;
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;

    this.startIndex = (this.currentPage - 1) * this.pageSize;
    this.endIndex = Math.min(
      this.startIndex + this.pageSize,
      this.filteredUsers.length
    );

    this.paginatedUsers = this.filteredUsers.slice(
      this.startIndex,
      this.endIndex
    );
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  async ngOnInit() {
    // Cargar nombre del usuario
    this.authService.user$.pipe(take(1)).subscribe((user) => {
      if (user) {
        this.currentUserName =
          user.displayName || user.email?.split('@')[0] || 'Usuario';

        const email = user.email?.toLowerCase() || '';

        this.isHamcoUser = email.endsWith('@hamco.mx');
      }
    });

    // Cargar datos iniciales - PRIMERO los mapas, LUEGO los usuarios
    await this.loadFunciones();
    await this.loadEmpresas();
    await this.loadUsers();

    // 👇 ESCUCHAMOS CUANDO SE CREA UN USUARIO (tiempo real)
    this.usersAccessService.userCreated$.subscribe(async () => {
      console.log('🔔 Evento userCreated recibido, recargando usuarios...');

      // Esperar un momento para que la Cloud Function genere el PDF
      await new Promise((resolve) => setTimeout(resolve, 2000));

      await this.loadUsers();
      console.log('✅ Usuarios recargados después de creación');
    });

    // Suscribirse a eventos de navegación para recargar datos
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(async (event: any) => {
        if (
          event.url === '/user' ||
          event.url.startsWith('/user?') ||
          event.url.startsWith('/user#')
        ) {
          // Recargar mapas primero, luego usuarios
          await this.loadFunciones();
          await this.loadEmpresas();
          await this.loadUsers();
        }
      });
  }

  goToRegistro() {
    this.router.navigate(['/user/registro']);
  }

  async logout(): Promise<void> {
    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error al cerrar sesiÃ³n:', error);
    }
  }

  getEstadoClass(estado: string): string {
    const normalized = this.normalizeStatus(estado);
    const classes: any = {
      pendiente: 'px-2 py-1 rounded bg-yellow-100 text-yellow-800',
      aprobado: 'px-2 py-1 rounded bg-green-100 text-green-800',
      canjeado: 'px-2 py-1 rounded bg-grey-100 text-grey-800',
    };
    return classes[normalized] || 'px-2 py-1 rounded bg-gray-100 text-gray-800';
  }

  private normalizeStatus(value: string | undefined): string {
    return (value || '').toString().toLowerCase().trim();
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
