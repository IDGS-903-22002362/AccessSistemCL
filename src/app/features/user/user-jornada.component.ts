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
import {
    JornadaActivaService,
    JornadaActiva,
} from '../../core/services/jornadas.service';
import { take } from 'rxjs/operators';
import { User } from '@angular/fire/auth';
import { FuncionesService } from '../../core/services/funciones.service';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';




@Component({
    selector: 'app-user-jornada',
    standalone: true,
    imports: [
        CommonModule,
        MatToolbarModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatTableModule,
        FormsModule,          // ✅ NECESARIO PARA ngModel
        MatCheckboxModule,    // (opcional, ya lo importaste)
    ],

    template: `
<!-- Card Jornada Activa -->
<mat-card
  *ngIf="jornadaActiva"
  class="mb-8 shadow-xl rounded-2xl overflow-hidden border border-gray-100"
>
  <!-- Header -->
  <div class="px-6 py-4 flex items-center justify-between" style="background-color:#007A53">
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
            <div
              class="mt-6 flex flex-col sm:flex-row justify-between items-center bg-gray-50 rounded-xl p-4"
            >
              <div class="flex items-center text-gray-700 mb-2 sm:mb-0">
                <mat-icon class="mr-2 text-green-600">location_on</mat-icon>
                <span class="font-medium">{{ jornadaActiva.estadio }}</span>
              </div>

      <div class="flex items-center text-gray-700">
        <mat-icon class="mr-2 text-green-600">schedule</mat-icon>
        <span>{{ jornadaActiva.hora }}</span>
      </div>
    </div>
    <!--
    <button
      ngIf="jornadaActiva"
      mat-raised-button
      color="primary"
      (click)="goToRegistro()"
    >
      Registrar usuarios
    </button>
-->
<div class="mt-8 flex justify-center">
  <button
    mat-raised-button
    style="background-color:#007A53; color: white; padding: 0.75rem 2rem;"
    (click)="goToRegistro()"
  >
    Registrar usuarios
  </button>
</div>

  </mat-card-content>
</mat-card>
<div class="mt-8 flex justify-center">
  <button
    mat-raised-button
    style="background-color:#007A53; color: white; padding: 0.75rem 2rem;"
    (click)="goToRegistro()"
  >
    Registrar usuarios
  </button>
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
export class UserJornadaComponent {
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
        this.loadJornadaActiva();
    }



    goToRegistro() {
        this.router.navigate(['/user/registro']);
    }
}