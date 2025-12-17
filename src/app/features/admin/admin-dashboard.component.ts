import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTableModule,
    MatSidenavModule,
    MatListModule,
  ],
  template: `
    <div class="min-h-screen bg-gray-50">
      <mat-toolbar color="primary" class="shadow-md">
        <span class="text-xl font-semibold">Dashboard Administrador</span>
        <span class="flex-1"></span>
        <button mat-icon-button (click)="logout()">
          <mat-icon>logout</mat-icon>
        </button>
      </mat-toolbar>

      <div class="flex">
        <mat-sidenav-container
          class="flex-1"
          style="min-height: calc(100vh - 64px);"
        >
          <mat-sidenav mode="side" opened class="w-64 bg-white">
            <mat-nav-list>
              <a
                mat-list-item
                routerLink="/admin"
                routerLinkActive="bg-blue-50"
                [routerLinkActiveOptions]="{ exact: true }"
              >
                <mat-icon matListItemIcon>dashboard</mat-icon>
                <span matListItemTitle>Dashboard</span>
              </a>
              <a
                mat-list-item
                routerLink="/admin/solicitudes"
                routerLinkActive="bg-blue-50"
              >
                <mat-icon matListItemIcon>assignment</mat-icon>
                <span matListItemTitle>Solicitudes</span>
              </a>
              <a
                mat-list-item
                routerLink="/admin/usuarios"
                routerLinkActive="bg-blue-50"
              >
                <mat-icon matListItemIcon>people</mat-icon>
                <span matListItemTitle>Usuarios</span>
              </a>
              <a
                mat-list-item
                routerLink="/admin/reportes"
                routerLinkActive="bg-blue-50"
              >
                <mat-icon matListItemIcon>bar_chart</mat-icon>
                <span matListItemTitle>Reportes</span>
              </a>
            </mat-nav-list>
          </mat-sidenav>

          <mat-sidenav-content class="p-6">
            <div
              class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            >
              <mat-card class="hover:shadow-lg transition-shadow">
                <mat-card-header>
                  <mat-card-title class="text-sm"
                    >Total Solicitudes</mat-card-title
                  >
                </mat-card-header>
                <mat-card-content class="text-center py-4">
                  <div class="text-4xl font-bold text-blue-600">0</div>
                </mat-card-content>
              </mat-card>

              <mat-card class="hover:shadow-lg transition-shadow">
                <mat-card-header>
                  <mat-card-title class="text-sm">Pendientes</mat-card-title>
                </mat-card-header>
                <mat-card-content class="text-center py-4">
                  <div class="text-4xl font-bold text-orange-600">0</div>
                </mat-card-content>
              </mat-card>

              <mat-card class="hover:shadow-lg transition-shadow">
                <mat-card-header>
                  <mat-card-title class="text-sm">Aprobadas</mat-card-title>
                </mat-card-header>
                <mat-card-content class="text-center py-4">
                  <div class="text-4xl font-bold text-green-600">0</div>
                </mat-card-content>
              </mat-card>

              <mat-card class="hover:shadow-lg transition-shadow">
                <mat-card-header>
                  <mat-card-title class="text-sm"
                    >Usuarios Activos</mat-card-title
                  >
                </mat-card-header>
                <mat-card-content class="text-center py-4">
                  <div class="text-4xl font-bold text-purple-600">0</div>
                </mat-card-content>
              </mat-card>
            </div>

            <mat-card>
              <mat-card-header>
                <mat-card-title>Solicitudes Recientes</mat-card-title>
                <button mat-raised-button color="primary">
                  <mat-icon>add</mat-icon> Nueva Solicitud
                </button>
              </mat-card-header>
              <mat-card-content>
                <div class="overflow-x-auto">
                  <table mat-table [dataSource]="dataSource" class="w-full">
                    <ng-container matColumnDef="id">
                      <th mat-header-cell *matHeaderCellDef>ID</th>
                      <td mat-cell *matCellDef="let element">
                        {{ element.id }}
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="usuario">
                      <th mat-header-cell *matHeaderCellDef>Usuario</th>
                      <td mat-cell *matCellDef="let element">
                        {{ element.usuario }}
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="fecha">
                      <th mat-header-cell *matHeaderCellDef>Fecha</th>
                      <td mat-cell *matCellDef="let element">
                        {{ element.fecha }}
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="tipo">
                      <th mat-header-cell *matHeaderCellDef>Tipo</th>
                      <td mat-cell *matCellDef="let element">
                        {{ element.tipo }}
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="estado">
                      <th mat-header-cell *matHeaderCellDef>Estado</th>
                      <td mat-cell *matCellDef="let element">
                        <span [class]="getEstadoClass(element.estado)">
                          {{ element.estado }}
                        </span>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="acciones">
                      <th mat-header-cell *matHeaderCellDef>Acciones</th>
                      <td mat-cell *matCellDef="let element">
                        <button mat-icon-button color="primary">
                          <mat-icon>visibility</mat-icon>
                        </button>
                        <button mat-icon-button color="accent">
                          <mat-icon>edit</mat-icon>
                        </button>
                      </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                    <tr
                      mat-row
                      *matRowDef="let row; columns: displayedColumns"
                    ></tr>
                  </table>

                  @if (dataSource.length === 0) {
                  <div class="text-center py-8 text-gray-500">
                    No hay solicitudes registradas
                  </div>
                  }
                </div>
              </mat-card-content>
            </mat-card>
          </mat-sidenav-content>
        </mat-sidenav-container>
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
export class AdminDashboardComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  displayedColumns: string[] = [
    'id',
    'usuario',
    'fecha',
    'tipo',
    'estado',
    'acciones',
  ];
  dataSource: any[] = []; // Placeholder vacío

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
      Pendiente: 'px-2 py-1 rounded bg-yellow-100 text-yellow-800',
      Aprobado: 'px-2 py-1 rounded bg-green-100 text-green-800',
      Rechazado: 'px-2 py-1 rounded bg-red-100 text-red-800',
    };
    return classes[estado] || 'px-2 py-1 rounded bg-gray-100 text-gray-800';
  }
}
