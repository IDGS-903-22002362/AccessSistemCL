import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { AuthService } from '../../core/services/auth.service';
import { UsersAccesService, UserAccess } from '../../core/services/usersSolicitud.service';


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
  ],
  template: `
    <div class="min-h-screen bg-gray-50">
      <mat-toolbar color="primary" class="shadow-md">
        <span class="text-xl font-semibold">Dashboard Usuario</span>
        <span class="flex-1"></span>
        <button mat-icon-button (click)="logout()">
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
        <button
  mat-raised-button
  color="primary"
  (click)="goToRegistro()"
>
  Registrar usuarios
</button>
<!-- El modal completo, mostrado condicionalmente con *ngIf -->
<div *ngIf="isOpen" class="fixed inset-0 size-auto max-h-none max-w-none overflow-y-auto bg-transparent backdrop:bg-transparent">
  <!-- Fondo oscuro (backdrop) -->
  <div class="fixed inset-0 bg-gray-900/50 transition-opacity opacity-100"></div>

  <!-- Contenedor principal para centrar el diálogo -->
  <div tabindex="0" class="flex min-h-full items-end justify-center p-4 text-center focus:outline-none sm:items-center sm:p-0">
    <!-- Panel del diálogo -->
    <div class="relative transform overflow-hidden rounded-lg bg-gray-800 text-left shadow-xl outline -outline-offset-1 outline-white/10 transition-all sm:my-8 sm:w-full sm:max-w-lg">
      
      <!-- Contenido principal -->
      <div class="bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
        <div class="sm:flex sm:items-start">
          <!-- Icono -->
          <div class="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-red-500/10 sm:mx-0 sm:size-10">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" data-slot="icon" aria-hidden="true" class="size-6 text-red-400">
              <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          
          <!-- Título y descripción -->
          <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
            <h3 id="dialog-title" class="text-base font-semibold text-white">Deactivate account</h3>
            <div class="mt-2">
              <p class="text-sm text-gray-400">Are you sure you want to deactivate your account? All of your data will be permanently removed. This action cannot be undone.</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Pie de página con botones de acción -->
      <div class="bg-gray-700/25 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
        <!-- Botón Deactivate -->
        <button type="button" (click)="onDeactivate()" class="inline-flex w-full justify-center rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-400 sm:ml-3 sm:w-auto">Deactivate</button>
        
        <!-- Botón Cancel -->
        <button type="button" (click)="onClose()" class="mt-3 inline-flex w-full justify-center rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-white inset-ring inset-ring-white/5 hover:bg-white/20 sm:mt-0 sm:w-auto">Cancel</button>
      </div>
    </div>
  </div>
</div>



        <mat-card>
          <mat-card-header>
            <mat-card-title>Solicitudes Recientes</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="overflow-x-auto">
              <table mat-table [dataSource]="dataSource" class="w-full">
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
                  <td mat-cell *matCellDef="let user">{{ user.funcion }}</td>
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
                <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
              </table>


              @if (dataSource.length === 0) {
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
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() deactivate = new EventEmitter<void>();

  onClose() {
    this.isOpen = false;
    this.close.emit();
  }

  onDeactivate() {
    this.isOpen = false;
    this.deactivate.emit();
  }

  displayedColumns: string[] = [
    'nombre',
    'email',
    'funcion',
    'estatus',
    'fecha'
  ];

  dataSource: any[] = []; // Placeholder vacío

  // 👉 CONTADORES
  totalUsuarios = 0;
  usuariosAprobados = 0;
  usuariosRechazados = 0;

  async loadUsers(): Promise<void> {
    try {
      const users: UserAccess[] = await this.usersAccessService.getUsers();

      // Tabla
      this.dataSource = users.map((user) => ({
        ...user,
        fecha: user.createdAt?.toDate
          ? user.createdAt.toDate().toLocaleDateString()
          : '—',
      }));

      // Contadores
      this.totalUsuarios = users.length;
      this.usuariosAprobados = users.filter(u => u.estatus === 'aprobado').length;
      this.usuariosRechazados = users.filter(u => u.estatus === 'rechazado').length;

    } catch (error) {
      console.error('Error cargando usuarios', error);
    }
  }



  ngOnInit() {
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
