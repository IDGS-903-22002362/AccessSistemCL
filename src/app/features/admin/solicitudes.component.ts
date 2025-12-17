import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatTableModule],
  template: `
    <div class="p-6">
      <h2 class="text-2xl font-bold mb-6">Gestión de Solicitudes</h2>

      <mat-card>
        <mat-card-header>
          <mat-card-title>Todas las Solicitudes</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="text-center py-12 text-gray-500">
            <p class="text-lg">Módulo en construcción</p>
            <p class="mt-2">
              Aquí se mostrarán todas las solicitudes del sistema
            </p>
          </div>
        </mat-card-content>
      </mat-card>
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
export class SolicitudesComponent {}
