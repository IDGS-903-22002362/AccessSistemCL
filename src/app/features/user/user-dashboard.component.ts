import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { AuthService } from '../../core/services/auth.service';
import { UsersService } from '../../core/services/users.service';
import {
  UsersAccesService,
  UserAccess,
} from '../../core/services/usersSolicitud.service';
import { take } from 'rxjs/operators';
import { User } from '@angular/fire/auth';
import { FuncionesService } from '../../core/services/funciones.service';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { UserJornadaComponent } from '../user/user-jornada.component';





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
    FormsModule,          // ✅ NECESARIO PARA ngModel
    MatCheckboxModule,
    UserJornadaComponent,    // (opcional, ya lo importaste)
  ],

  template: `
    <div class="min-h-screen bg-gray-50">
      <mat-toolbar style="background-color:#007A53" class="shadow-md">
        <div class="flex items-center gap-3 text-white">
          <img
            src="images/leon.png"
            alt="Club León"
            class="h-8 w-auto"
          />
          <span class="font-medium">
            Bienvenido, {{ currentUserName }}
          </span>
        </div>

        <span class="flex-1"></span>

        <button mat-icon-button (click)="logout()" class="text-white">
          <mat-icon>logout</mat-icon>
        </button>
      </mat-toolbar>



      <div class="container mx-auto p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
              <mat-card-title>Denegados</mat-card-title>
            </mat-card-header>
            <mat-card-content class="text-center py-8">
              <div class="text-4xl font-bold text-orange-600">
                {{ usuariosRechazados }}
              </div>
              <p class="text-gray-600 mt-2">Accesos denegados</p>
            </mat-card-content>
          </mat-card>
        </div>
<!--Componente de jornadas -->
        <app-user-jornada></app-user-jornada>



<div class="mt-8 flex justify-center">
  <button
    mat-raised-button
    style="background-color:#007A53; color: white; padding: 0.75rem 2rem;"
    (click)="goToRegistro()"
  >
    Registrar usuarios
  </button>
</div>



        <mat-card>
          <mat-card-header>
            <mat-card-title>Solicitudes Recientes</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="overflow-x-auto">
              <div class="flex justify-end mb-4">
  <button
    mat-raised-button
    (click)="showFilters = !showFilters"
    style="background-color:#007A53; color:white"
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
      <option value="rechazado">Rechazado</option>
    </select>
  </div>

  <!-- Función -->
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

              <table mat-table [dataSource]="filteredUsers" class="w-full">

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

                <!-- Función -->
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
                      {{ user.estatus | titlecase }}
                    </span>
                  </td>
                </ng-container>

                <!-- Fecha -->
                <ng-container matColumnDef="fecha">
                  <th mat-header-cell *matHeaderCellDef>Fecha</th>
                  <td mat-cell *matCellDef="let user">{{ user.fecha }}</td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr
                  mat-row
                  *matRowDef="let row; columns: displayedColumns"
                ></tr>
              </table>

              @if (filteredUsers.length === 0) {
              <div class="text-center py-8 text-gray-500">
                No hay solicitudes registradas
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
export class UserDashboardComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private usersAccessService = inject(UsersAccesService);
  currentUserName = '';
  private funcionesService = inject(FuncionesService);
  funcionesMap = new Map<string, string>();
  // ===== Filtros =====
  showFilters = false;

  filters = {
    estado: '',
    funcion: '',
  };

  allUsers: any[] = [];      // respaldo sin filtrar
  filteredUsers: any[] = []; // lo que se muestra

  uniqueFunciones: string[] = [];


  async loadFunciones(): Promise<void> {
    const funciones = await this.funcionesService.getFunciones();

    funciones.forEach((funcion) => {
      if (funcion.id) {
        this.funcionesMap.set(funcion.id, funcion.nombre);
      }
    });
  }



  displayedColumns: string[] = [
    'nombre',
    'email',
    'funcion',
    'estatus',
    'fecha'
  ];

  dataSource: any[] = []; // Placeholder vacío

  //contadores
  totalUsuarios = 0;
  usuariosAprobados = 0;
  usuariosRechazados = 0;





  async loadUsers(): Promise<void> {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser?.email) return;

      const users = await this.usersAccessService.getUsersByRegistrant(
        currentUser.email
      );

      const mapped = users.map((user) => ({
        ...user,
        funcionNombre: this.funcionesMap.get(user.funcion) || '—',
        fecha: user.createdAt?.toDate
          ? user.createdAt.toDate().toLocaleDateString()
          : '—',
      }));

      this.allUsers = mapped;
      this.filteredUsers = mapped;

      // opciones únicas
      this.uniqueFunciones = [
        ...new Set(mapped.map(u => u.funcion))
      ];

      this.totalUsuarios = users.length;
      this.usuariosAprobados = users.filter(u => u.estatus === 'aprobado').length;
      this.usuariosRechazados = users.filter(u => u.estatus === 'rechazado').length;

    } catch (error) {
      console.error('Error cargando usuarios', error);
    }
  }

  applyFilters(): void {
    let filtered = [...this.allUsers];

    if (this.filters.estado) {
      filtered = filtered.filter(
        u => u.estatus === this.filters.estado
      );
    }

    if (this.filters.funcion) {
      filtered = filtered.filter(
        u => u.funcion === this.filters.funcion
      );
    }

    this.filteredUsers = filtered;
  }


  ngOnInit() {
    this.authService.user$.pipe(take(1)).subscribe(user => {
      if (user) {
        this.currentUserName =
          user.displayName ||
          user.email?.split('@')[0] || // apodo desde email
          'Usuario';
      }
    });

    this.loadFunciones();
    this.loadUsers();
  }



  goToRegistro() {
    this.router.navigate(['/user/registro']);
  }


  async logout(): Promise<void> {
    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }


  getEstadoClass(estado: string): string {
    const classes: any = {
      pendiente: 'px-2 py-1 rounded bg-yellow-100 text-yellow-800',
      aprobado: 'px-2 py-1 rounded bg-green-100 text-green-800',
      rechazado: 'px-2 py-1 rounded bg-red-100 text-red-800',
    };
    return classes[estado] || 'px-2 py-1 rounded bg-gray-100 text-gray-800';
  }
}