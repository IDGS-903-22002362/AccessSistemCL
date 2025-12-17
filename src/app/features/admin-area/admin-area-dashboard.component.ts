import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-area-dashboard',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <div class="max-w-7xl mx-auto">
        <div class="flex justify-between items-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900">
            Dashboard Admin de Área
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
            <p class="text-4xl font-bold text-orange-600">0</p>
            <p class="text-gray-600 mt-2">Pendientes de revisión</p>
          </mat-card>

          <mat-card class="p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-semibold">Solicitudes Aprobadas</h2>
              <mat-icon class="text-green-500 text-4xl">check_circle</mat-icon>
            </div>
            <p class="text-4xl font-bold text-green-600">0</p>
            <p class="text-gray-600 mt-2">Aprobadas hoy</p>
          </mat-card>

          <mat-card class="p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-semibold">Solicitudes Rechazadas</h2>
              <mat-icon class="text-red-500 text-4xl">cancel</mat-icon>
            </div>
            <p class="text-4xl font-bold text-red-600">0</p>
            <p class="text-gray-600 mt-2">Rechazadas hoy</p>
          </mat-card>
        </div>

        <mat-card class="mt-8 p-6">
          <h2 class="text-2xl font-semibold mb-4">Acciones Rápidas</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button mat-raised-button color="primary" class="h-16">
              <mat-icon>rate_review</mat-icon>
              <span class="ml-2">Revisar Solicitudes</span>
            </button>
            <button mat-raised-button color="accent" class="h-16">
              <mat-icon>assessment</mat-icon>
              <span class="ml-2">Ver Reportes</span>
            </button>
          </div>
        </mat-card>
      </div>
    </div>
  `,
  styles: [],
})
export class AdminAreaDashboardComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  async logout() {
    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
}
