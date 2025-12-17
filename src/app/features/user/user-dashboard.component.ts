import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { AuthService } from '../../core/services/auth.service';

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
              <mat-card-title>Mis Solicitudes</mat-card-title>
            </mat-card-header>
            <mat-card-content class="text-center py-8">
              <div class="text-4xl font-bold text-blue-600">0</div>
              <p class="text-gray-600 mt-2">Solicitudes activas</p>
            </mat-card-content>
          </mat-card>

          <mat-card class="hover:shadow-lg transition-shadow">
            <mat-card-header>
              <mat-card-title>Accesos</mat-card-title>
            </mat-card-header>
            <mat-card-content class="text-center py-8">
              <div class="text-4xl font-bold text-green-600">0</div>
              <p class="text-gray-600 mt-2">Accesos autorizados</p>
            </mat-card-content>
          </mat-card>

          <mat-card class="hover:shadow-lg transition-shadow">
            <mat-card-header>
              <mat-card-title>Pendientes</mat-card-title>
            </mat-card-header>
            <mat-card-content class="text-center py-8">
              <div class="text-4xl font-bold text-orange-600">0</div>
              <p class="text-gray-600 mt-2">En revisión</p>
            </mat-card-content>
          </mat-card>
        </div>

        <mat-card>
          <mat-card-header>
            <mat-card-title>Solicitudes Recientes</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="overflow-x-auto">
              <table mat-table [dataSource]="dataSource" class="w-full">
                <ng-container matColumnDef="id">
                  <th mat-header-cell *matHeaderCellDef>ID</th>
                  <td mat-cell *matCellDef="let element">{{ element.id }}</td>
                </ng-container>

                <ng-container matColumnDef="fecha">
                  <th mat-header-cell *matHeaderCellDef>Fecha</th>
                  <td mat-cell *matCellDef="let element">
                    {{ element.fecha }}
                  </td>
                </ng-container>

                <ng-container matColumnDef="tipo">
                  <th mat-header-cell *matHeaderCellDef>Tipo</th>
                  <td mat-cell *matCellDef="let element">{{ element.tipo }}</td>
                </ng-container>

                <ng-container matColumnDef="estado">
                  <th mat-header-cell *matHeaderCellDef>Estado</th>
                  <td mat-cell *matCellDef="let element">
                    <span [class]="getEstadoClass(element.estado)">
                      {{ element.estado }}
                    </span>
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

  displayedColumns: string[] = ['id', 'fecha', 'tipo', 'estado'];
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
