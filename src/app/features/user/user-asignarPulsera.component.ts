import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
    selector: 'app-asignar-codigo-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule
    ],
    template: `
    <h2 mat-dialog-title>Asignar Código de Pulsera</h2>
    <mat-dialog-content>
      <p class="mb-4">Usuario: <strong>{{ data.nombre }}</strong></p>
      <p class="mb-2 text-sm text-gray-600" *ngIf="data.codigoActual !== 'SIN_PULSERA_ASIGNADA'">
        Código actual: <span class="font-mono">{{ data.codigoActual }}</span>
      </p>
      
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Código de Pulsera</mat-label>
        <input
          matInput
          [(ngModel)]="codigoPulsera"
          placeholder="Ej: PULSERA001"
          required
          maxlength="50"
        />
        <mat-hint>Ingrese el código único de la pulsera</mat-hint>
      </mat-form-field>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button 
        mat-raised-button 
        color="primary" 
        (click)="onAssign()"
        [disabled]="!codigoPulsera || codigoPulsera.trim() === ''"
        style="background-color: #007A53;"
      >
        {{ data.codigoActual === 'SIN_PULSERA_ASIGNADA' ? 'Asignar' : 'Actualizar' }}
      </button>
    </mat-dialog-actions>
  `,
    styles: [`
    :host {
      display: block;
    }
  `]
})
export class AsignarCodigoDialogComponent {
    codigoPulsera: string = '';

    constructor(
        public dialogRef: MatDialogRef<AsignarCodigoDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        // Si ya tiene un código, lo cargamos
        if (data.codigoActual && data.codigoActual !== 'SIN_PULSERA_ASIGNADA') {
            this.codigoPulsera = data.codigoActual;
        }
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    onAssign(): void {
        if (this.codigoPulsera && this.codigoPulsera.trim() !== '') {
            this.dialogRef.close({ codigoPulsera: this.codigoPulsera.trim() });
        }
    }
}