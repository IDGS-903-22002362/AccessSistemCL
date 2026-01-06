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
import { EscudosService } from '../../core/services/escudos.service';

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
    FormsModule, // ✅ NECESARIO PARA ngModel
    MatCheckboxModule, // (opcional, ya lo importaste)
  ],

  template: `
    <!-- Card Jornada Activa con ancho limitado y más estético -->
    <div class="flex justify-center mb-8">
      <mat-card
        *ngIf="jornadaActiva"
        class="shadow-lg rounded-xl overflow-hidden border border-gray-200 max-w-2xl w-full"
      >
        <!-- Header compacto -->
        <div
          class="px-5 py-3 flex items-center justify-between"
          style="background-color:#007A53"
        >
          <div class="text-white">
            <h2 class="text-lg font-bold">
              Jornada {{ jornadaActiva.jornada }}
            </h2>
            <p class="text-xs opacity-90">
              {{ jornadaActiva.fecha }} · {{ jornadaActiva.hora }}
            </p>
          </div>

          <span
            class="bg-white text-green-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center"
          >
            <mat-icon
              class="mr-1"
              style="font-size: 16px; width: 16px; height: 16px;"
              >sports_soccer</mat-icon
            >
            Partido Activo
          </span>
        </div>

        <!-- Content compacto -->
        <mat-card-content class="p-4">
          <div class="flex items-center justify-center gap-6">
            <!-- Escudo Local -->
            <div class="text-center flex flex-col items-center">
              <div class="mb-2">
                <img
                  *ngIf="escudoLocal"
                  [src]="escudoLocal"
                  alt="Escudo {{ jornadaActiva.equipo_local }}"
                  class="h-20 w-20 object-contain"
                />
                <div
                  *ngIf="!escudoLocal"
                  class="h-20 w-20 flex items-center justify-center"
                >
                  <mat-icon
                    class="text-gray-300"
                    style="font-size: 48px; width: 48px; height: 48px;"
                    >shield</mat-icon
                  >
                </div>
              </div>
              <p class="text-gray-500 text-xs mb-1">Local</p>
              <p class="text-sm font-bold text-gray-800">
                {{ jornadaActiva.equipo_local }}
              </p>
            </div>

            <!-- VS -->
            <div class="text-center px-4">
              <p class="text-3xl font-bold text-gray-400">VS</p>
            </div>

            <!-- Escudo Visitante -->
            <div class="text-center flex flex-col items-center">
              <div class="mb-2">
                <img
                  *ngIf="escudoVisitante"
                  [src]="escudoVisitante"
                  alt="Escudo {{ jornadaActiva.equipo_visitante }}"
                  class="h-20 w-20 object-contain"
                />
                <div
                  *ngIf="!escudoVisitante"
                  class="h-20 w-20 flex items-center justify-center"
                >
                  <mat-icon
                    class="text-gray-300"
                    style="font-size: 48px; width: 48px; height: 48px;"
                    >shield</mat-icon
                  >
                </div>
              </div>
              <p class="text-gray-500 text-xs mb-1">Visitante</p>
              <p class="text-sm font-bold text-gray-800">
                {{ jornadaActiva.equipo_visitante }}
              </p>
            </div>
          </div>

          <!-- Detalles del partido compactos -->
          <div
            class="mt-3 pt-3 border-t border-gray-200 flex justify-around text-xs"
          >
            <div class="flex items-center text-gray-600">
              <mat-icon
                class="mr-1 text-green-600"
                style="font-size: 18px; width: 18px; height: 18px;"
                >location_on</mat-icon
              >
              <span>{{ jornadaActiva.estadio }}</span>
            </div>

            <div class="flex items-center text-gray-600">
              <mat-icon
                class="mr-1 text-green-600"
                style="font-size: 18px; width: 18px; height: 18px;"
                >schedule</mat-icon
              >
              <span>{{ jornadaActiva.hora }}</span>
            </div>
          </div>

          <div *ngIf="!isHamcoUser" class="mt-4 flex justify-center">
            <button
              mat-raised-button
              style="background-color:#007A53; color: white; padding: 0.5rem 1.5rem;"
              (click)="goToRegistro()"
            >
              Registrar usuarios
            </button>
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
export class UserJornadaComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private usersAccessService = inject(UsersAccesService);
  private escudosService = inject(EscudosService);
  currentUserName = '';
  private funcionesService = inject(FuncionesService);
  funcionesMap = new Map<string, string>();
  isHamcoUser = false;

  // URLs de los escudos
  escudoLocal: string | null = null;
  escudoVisitante: string | null = null;
  // ===== Filtros =====
  showFilters = false;

  filters = {
    estado: '',
    funcion: '',
  };

  allUsers: any[] = []; // respaldo sin filtrar
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
    'fecha',
  ];

  private jornadaService = inject(JornadaActivaService);

  jornadaActiva?: JornadaActiva;

  loadJornadaActiva(): void {
    this.jornadaService
      .getJornadasActivas$()
      .pipe(take(1))
      .subscribe({
        next: async (jornadas) => {
          console.log('Jornadas activas:', jornadas);
          this.jornadaActiva = jornadas.length > 0 ? jornadas[0] : undefined;

          // Cargar escudos si hay jornada activa
          if (this.jornadaActiva) {
            console.log('Cargando escudos para:', {
              local: this.jornadaActiva.equipo_local,
              visitante: this.jornadaActiva.equipo_visitante,
            });

            const escudos = await this.escudosService.getEscudosPartido(
              this.jornadaActiva.equipo_local,
              this.jornadaActiva.equipo_visitante
            );

            console.log('Escudos obtenidos:', escudos);
            this.escudoLocal = escudos.local;
            this.escudoVisitante = escudos.visitante;
          }
        },
        error: (err) => console.error(err),
      });
  }

  applyFilters(): void {
    let filtered = [...this.allUsers];

    if (this.filters.estado) {
      filtered = filtered.filter((u) => u.estatus === this.filters.estado);
    }

    if (this.filters.funcion) {
      filtered = filtered.filter((u) => u.funcion === this.filters.funcion);
    }

    this.filteredUsers = filtered;
  }

  ngOnInit() {
    this.authService.user$.pipe(take(1)).subscribe((user) => {
      if (user) {
        this.currentUserName =
          user.displayName ||
          user.email?.split('@')[0] || // apodo desde email
          'Usuario';

        const apodo =
          user.displayName ||
          user.email?.split('@')[0];

        const email = user.email?.toLowerCase() || '';

        this.isHamcoUser = email.endsWith('@hamco.mx');

      }
    });

    this.loadFunciones();
    this.loadJornadaActiva();
  }

  goToRegistro() {
    this.router.navigate(['/user/registro']);
  }
}
