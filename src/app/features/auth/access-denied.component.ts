import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <mat-card class="max-w-md w-full p-8 text-center">
        <mat-icon class="text-red-500 text-8xl mb-4">block</mat-icon>
        <h1 class="text-3xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
        <p class="text-gray-600 mb-6">
          No tienes permisos para acceder a esta página.
        </p>
        <div class="flex gap-4 justify-center">
          <button mat-raised-button color="primary" (click)="goBack()">
            Volver
          </button>
          <button mat-raised-button (click)="goHome()">Ir a Inicio</button>
        </div>
      </mat-card>
    </div>
  `,
})
export class AccessDeniedComponent {
  private router = inject(Router);

  goBack() {
    window.history.back();
  }

  goHome() {
    this.router.navigate(['/']);
  }
}
