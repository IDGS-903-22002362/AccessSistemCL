import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { AuthService } from '../../core/services/auth.service';
import { UsersAccesService, UserAccess } from '../../core/services/usersSolicitud.service';
import { JornadaActivaService, JornadaActiva } from '../../core/services/jornadas.service';
import { take } from 'rxjs/operators';



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
<!-- Card Jornada Activa -->
<mat-card
  *ngIf="jornadaActiva"
  class="mb-8 shadow-xl rounded-2xl overflow-hidden border border-gray-100"
>
  <!-- Header -->
  <div class="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between">
    <div class="text-white">
      <h2 class="text-xl font-bold">
        Jornada {{ jornadaActiva.jornada }}
      </h2>
      <p class="text-sm opacity-90">
        {{ jornadaActiva.fecha }} · {{ jornadaActiva.hora }}
      </p>
    </div>

    <span
      class="bg-white text-green-700 px-4 py-1 rounded-full text-sm font-semibold flex items-center"
    >
      <mat-icon class="mr-1 text-sm">sports_soccer</mat-icon>
      Partido Activo
    </span>
  </div>

  <!-- Content -->
  <mat-card-content class="p-6">
    <div class="grid grid-cols-1 md:grid-cols-3 items-center gap-6">

      <!-- Local -->
      <div class="text-center">
        <p class="text-gray-500 text-sm mb-1">Local</p>
        <h3 class="text-2xl font-bold text-gray-900">
          {{ jornadaActiva.equipo_local }}
        </h3>
      </div>

      <!-- VS -->
      <div class="text-center">
        <span class="text-3xl font-extrabold text-gray-400">VS</span>
      </div>

      <!-- Visitante -->
      <div class="text-center">
        <p class="text-gray-500 text-sm mb-1">Visitante</p>
        <h3 class="text-2xl font-bold text-gray-900">
          {{ jornadaActiva.equipo_visitante }}
        </h3>
      </div>

    </div>

    <!-- Info -->
    <div class="mt-6 flex flex-col sm:flex-row justify-between items-center bg-gray-50 rounded-xl p-4">
      <div class="flex items-center text-gray-700 mb-2 sm:mb-0">
        <mat-icon class="mr-2 text-green-600">location_on</mat-icon>
        <span class="font-medium">{{ jornadaActiva.estadio }}</span>
      </div>

      <div class="flex items-center text-gray-700">
        <mat-icon class="mr-2 text-green-600">schedule</mat-icon>
        <span>{{ jornadaActiva.hora }}</span>
      </div>
    </div>
  </mat-card-content>
</mat-card>



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
  private jornadaService = inject(JornadaActivaService);

  jornadaActiva?: JornadaActiva;



  loadJornadaActiva(): void {
    this.jornadaService.getJornadasActivas$().pipe(take(1)).subscribe({
      next: jornadas => {
        console.log('Jornadas activas:', jornadas);
        this.jornadaActiva = jornadas.length > 0 ? jornadas[0] : undefined;
      },
      error: err => console.error(err)
    });
  }





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
    this.loadJornadaActiva();
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
