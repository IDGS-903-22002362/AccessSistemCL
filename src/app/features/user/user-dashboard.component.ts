import {
  Component,
  inject,
  OnInit,
  ChangeDetectorRef,
  Inject,
} from '@angular/core';
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
import {
  JornadaActivaService,
  JornadaActiva,
} from '../../core/services/jornadas.service';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserJornadaComponent } from '../user/user-jornada.component';
import { UserFormEspecialComponent } from './user-formularioEspecial.component';
import { AsignarCodigoDialogComponent } from './user-asignarPulsera.component';
import { AreasService } from '../../core/services/areas.service';

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
    MatSnackBarModule,
    MatDialogModule,
    MatProgressSpinnerModule,
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
        <div *ngIf="!isHamcoUser" class="mt-4 flex justify-center">
            <button
              mat-raised-button
              style="background-color:#007A53; color: white; padding: 0.5rem 1.5rem;"
              (click)="goToRegistro()"
            >
              Registrar usuarios
            </button>
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
                <!-- Empresa -->
                <div>
                  <label class="block text-sm font-medium text-[#007A53] mb-1">
                    Empresa
                  </label>
                  <select
                    [(ngModel)]="filters.empresa"
                    (change)="applyFilters()"
                    class="w-full p-2 border-2 border-[#007A53] rounded
                          focus:outline-none focus:ring-2 focus:ring-[#007A53]"
                  >
                    <option value="">Todas</option>
                    <option *ngFor="let emp of uniqueEmpresas" [value]="emp">
                      {{ empresasMap.get(emp) || emp }}
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
                <!-- Area -->
                <ng-container matColumnDef="area">
                  <th mat-header-cell *matHeaderCellDef>Area</th>
                  <td mat-cell *matCellDef="let user">
                    {{ user.areaNombre }}
                  </td>
                </ng-container>

                <!-- FunciÃ³n -->
                <ng-container matColumnDef="funcion">
                  <th mat-header-cell *matHeaderCellDef>Función</th>
                  <td mat-cell *matCellDef="let user">
                    {{ user.funcionNombre }}
                  </td>
                </ng-container>
                <!-- Pulsera (Area) -->
                <ng-container matColumnDef="pulsera">
                  <th mat-header-cell *matHeaderCellDef>Pulsera</th>
                  <td mat-cell *matCellDef="let user">
                    {{ user.areaNombre || 'Sin asignar' }}
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

                <!-- PDF -->
                <ng-container matColumnDef="pdf">
                  <th mat-header-cell *matHeaderCellDef>PDF</th>
                  <td mat-cell *matCellDef="let user">
                    @if (user.estatusNormalized === 'aprobado') {
                    <div class="flex items-center gap-2">
                      @if (user.pdfUrlResolved) {
                      <button
                        mat-icon-button
                        color="primary"
                        (click)="downloadPDF(user.pdfUrlResolved, user.nombre)"
                        matTooltip="Descargar acreditación"
                      >
                        <mat-icon>download</mat-icon>
                      </button>
                      <button
                        mat-icon-button
                        style="color: #25D366;"
                        (click)="shareWhatsApp(user)"
                        matTooltip="Compartir por WhatsApp"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path
                            d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
                          />
                        </svg>
                      </button>
                      }
                      <button
                        mat-icon-button
                        color="accent"
                        (click)="resendEmail(user.id, user.nombre)"
                        matTooltip="Reenviar correo con QR"
                      >
                        <mat-icon>email</mat-icon>
                      </button>
                    </div>
                    } @else {
                    <span class="text-gray-400">-</span>
                    }
                  </td>
                </ng-container>
                <!-- Acciones (solo para hamco) -->
                <ng-container matColumnDef="acciones">
                  <th mat-header-cell *matHeaderCellDef>Acciones</th>
                  <td mat-cell *matCellDef="let user">
                    @if (isHamcoUser) { @if (!user.codigoPulsera ||
                    user.codigoPulsera === 'SIN_PULSERA_ASIGNADA') {
                    <button
                      mat-raised-button
                      color="primary"
                      (click)="asignarCodigoPulsera(user)"
                      style="background-color: #007A53; color: white;"
                      matTooltip="Asignar código de pulsera"
                    >
                      <mat-icon>qr_code</mat-icon>
                      Asignar
                    </button>
                    } @else {
                    <div class="flex flex-col items-start">
                      <span
                        class="font-mono text-sm bg-gray-100 px-2 py-1 rounded"
                      >
                        {{ user.codigoPulsera }}
                      </span>
                    </div>
                    } }
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
  private areasService = inject(AreasService);
  funcionesMap = new Map<string, string>();
  empresasMap = new Map<string, string>();
  areasMap = new Map<string, string>();
  isHamcoUser = false;
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private jornadaActivaService = inject(JornadaActivaService);

  // Jornada activa
  jornadaActiva: JornadaActiva | null = null;

  // ===== Filtros =====
  showFilters = false;

  searchText = '';
  filters = {
    estado: '',
    funcion: '',
    empresa: '',
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
  uniqueEmpresas: string[] = [];

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

  async loadAreas(): Promise<void> {
    const areas = await this.areasService.getAreas();

    areas.forEach((areas) => {
      if (areas.id) {
        this.areasMap.set(areas.id, areas.nombre);
      }
    });
  }

  // Modifica displayedColumns para que sea dinámico
  get displayedColumns(): string[] {
    const baseColumns = [
      'nombre',
      'email',
      'empresa',
      'area',
      'funcion',
      'pulsera',
      'estatus',
      'pdf',
    ];
    if (this.isHamcoUser) {
      return [...baseColumns, 'acciones'];
    }
    return baseColumns;
  }

  dataSource: any[] = []; // Placeholder vacÃ­o

  //contadores
  totalUsuarios = 0;
  usuariosAprobados = 0;
  usuariosCanjeados = 0;

  async loadUsers(): Promise<void> {
    const EMPRESA_OTRA_ID = '05mwfxhSyFDrGd72tuzO';
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser?.email) return;

      let users: UserAccess[] = [];

      // HAMCO VE TODO
      if (this.isHamcoUser) {
        users = await this.usersAccessService.getUsers();
      } else {
        // 👤 USUARIOS NORMALES: solo los que registró
        users = await this.usersAccessService.getUsersByRegistrant(
          currentUser.email
        );
      }

      // 🔥 FILTRAR POR JORNADA ACTIVA (todos los usuarios)
      if (this.jornadaActiva) {
        users = users.filter((u) => u.jornada === this.jornadaActiva!.jornada);
        console.log(
          `✅ Usuarios filtrados por jornada activa ${this.jornadaActiva.jornada}:`,
          users.length
        );
      }

      const mapped = users.map((user) => {
        const estatusNormalized = this.normalizeStatus(user.estatus);
        const pdfUrlResolved =
          user.pdfUrl || (user as any).pdfURL || (user as any).pdf_url || '';

        return {
          ...user,
          estatusNormalized,
          pdfUrlResolved,
          funcionNombre: this.funcionesMap.get(user.funcion) || '?',
          empresaNombre:
            user.empresaId === '05mwfxhSyFDrGd72tuzO'
              ? (user as any).empresa?.nombre || 'OTRA'
              : this.empresasMap.get(user.empresaId) || '?',
          areaNombre: this.areasMap.get(user.areaId || '') || 'Sin asignar',
          fecha: user.createdAt?.toDate
            ? user.createdAt.toDate().toLocaleDateString()
            : '?',
        };
      });

      // 🔹 datos base
      this.allUsers = mapped;
      this.filteredUsers = mapped;
      this.updatePagination();

      // 🔹 filtros
      this.uniqueFunciones = [...new Set(mapped.map((u) => u.funcion))];
      this.uniqueEmpresas = [...new Set(mapped.map((u) => u.empresaId))];

      // 🔹 contadores
      this.totalUsuarios = mapped.length;
      this.usuariosAprobados = mapped.filter(
        (u) => u.estatusNormalized === 'aprobado'
      ).length;
      this.usuariosCanjeados = mapped.filter(
        (u) => u.estatusNormalized === 'canjeado'
      ).length;

      // 🔹 forzar refresco
      this.cdr.markForCheck();
      this.cdr.detectChanges();

      console.log(
        `✅ Usuarios cargados (${this.isHamcoUser ? 'GLOBAL - HAMCO' : 'FILTRADO'
        })`,
        mapped.length
      );

      // 🔄 verificar PDFs pendientes
      this.checkForPendingPDFs(mapped);
    } catch (error) {
      console.error('❌ Error cargando usuarios', error);
    }
  }

  // Añade este método para asignar código de pulsera
  async asignarCodigoPulsera(user: any): Promise<void> {
    const dialogRef = this.dialog.open(AsignarCodigoDialogComponent, {
      width: '400px',
      data: {
        nombre: `${user.nombre} ${user.apellidoPaterno}`,
        codigoActual: user.codigoPulsera || 'SIN_PULSERA_ASIGNADA',
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result && result.codigoPulsera) {
        try {
          await this.usersAccessService.updateUser(user.id, {
            codigoPulsera: result.codigoPulsera,
          });

          this.snackBar.open('✅ Código asignado correctamente', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar'],
          });

          // Recargar usuarios para mostrar el cambio
          await this.loadUsers();
        } catch (error) {
          console.error('Error al asignar código:', error);
          this.snackBar.open('❌ Error al asignar código', 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar'],
          });
        }
      }
    });
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
    if (this.filters.empresa) {
      filtered = filtered.filter((u) => u.empresaId === this.filters.empresa);
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
    await this.loadAreas();
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
          await this.loadAreas();
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

  shareWhatsApp(user: any): void {
    if (!user) {
      return;
    }

    if (user.estatusNormalized !== 'aprobado') {
      this.snackBar.open(
        'Solo se puede compartir por WhatsApp cuando el usuario esta aprobado.',
        'Cerrar',
        {
          duration: 5000,
          panelClass: ['error-snackbar'],
          horizontalPosition: 'center',
          verticalPosition: 'top',
        }
      );
      return;
    }

    const pdfUrl = user.pdfUrlResolved;
    if (!pdfUrl || !this.isValidHttpUrl(pdfUrl)) {
      this.snackBar.open(
        'PDF no disponible o URL invalida para compartir.',
        'Cerrar',
        {
          duration: 5000,
          panelClass: ['error-snackbar'],
          horizontalPosition: 'center',
          verticalPosition: 'top',
        }
      );
      return;
    }

    const rawPhone = user.telefono || user.phone || user.celular || '';
    const normalizedPhone = this.normalizePhoneForWhatsApp(rawPhone);
    if (!normalizedPhone) {
      this.snackBar.open(
        'Numero de telefono invalido para WhatsApp.',
        'Cerrar',
        {
          duration: 6000,
          panelClass: ['error-snackbar'],
          horizontalPosition: 'center',
          verticalPosition: 'top',
        }
      );
      return;
    }

    const nombre = `${user.nombre || ''} ${user.apellidoPaterno || ''}`.trim();
    const saludo = nombre ? `Hola ${nombre},` : 'Hola,';
    const message = `${saludo} aqui esta tu constancia de acreditacion: ${pdfUrl}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${normalizedPhone}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }

  private normalizePhoneForWhatsApp(value: string | undefined): string | null {
    if (!value) {
      return null;
    }

    const digits = value.replace(/\D/g, '');
    if (!digits) {
      return null;
    }

    if (digits.length === 10) {
      return `52${digits}`;
    }

    if (digits.length === 12 && digits.startsWith('52')) {
      return digits;
    }

    if (digits.length === 13 && digits.startsWith('521')) {
      return `52${digits.slice(3)}`;
    }

    return null;
  }

  private isValidHttpUrl(value: string): boolean {
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  async resendEmail(userId: string, userName: string): Promise<void> {
    if (!userId) {
      this.snackBar.open('Error: ID de usuario no disponible', 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'top',
      });
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Reenviar Acreditación',
        message: `¿Deseas reenviar el correo de acreditación a ${userName}?`,
        confirmText: 'Reenviar',
        cancelText: 'Cancelar',
      },
    });

    const confirmed = await dialogRef.afterClosed().toPromise();
    if (!confirmed) return;

    const snackBarRef = this.snackBar.open('Reenviando correo...', '', {
      duration: 0,
      panelClass: ['info-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });

    try {
      const result = await this.usersAccessService.resendAccreditationEmail(
        userId
      );

      snackBarRef.dismiss();

      if (result.success) {
        const mensaje = result.hasPdf
          ? 'Correo reenviado exitosamente con el PDF existente'
          : 'PDF generado y correo enviado exitosamente';
        this.snackBar.open(mensaje, 'Cerrar', {
          duration: 5000,
          panelClass: ['success-snackbar'],
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });
      } else {
        this.snackBar.open(
          'Error al reenviar correo: ' + result.message,
          'Cerrar',
          {
            duration: 7000,
            panelClass: ['error-snackbar'],
            horizontalPosition: 'center',
            verticalPosition: 'top',
          }
        );
      }
    } catch (error: any) {
      snackBarRef.dismiss();
      console.error('Error al reenviar correo:', error);
      this.snackBar.open(
        'Error al reenviar correo: ' + (error.message || 'Error desconocido'),
        'Cerrar',
        {
          duration: 7000,
          panelClass: ['error-snackbar'],
          horizontalPosition: 'center',
          verticalPosition: 'top',
        }
      );
    }
  }
}

// Componente de diálogo de confirmación
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <div class="p-6">
      <h2 class="text-xl font-semibold text-gray-800 mb-4">{{ data.title }}</h2>
      <p class="text-gray-600 mb-6">{{ data.message }}</p>
      <div class="flex justify-end gap-3">
        <button mat-stroked-button (click)="onCancel()" class="px-6">
          {{ data.cancelText || 'Cancelar' }}
        </button>
        <button
          mat-raised-button
          color="primary"
          (click)="onConfirm()"
          class="px-6"
          style="background-color: #007A53;"
        >
          {{ data.confirmText || 'Confirmar' }}
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      ::ng-deep .mat-mdc-dialog-container {
        border-radius: 12px !important;
      }
    `,
  ],
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
