import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Database, ref, push, set, get } from '@angular/fire/database';
import { Functions, httpsCallable } from '@angular/fire/functions';
import {
  JornadaActivaService,
  JornadaActiva,
} from '../../core/services/jornadas.service';

interface Visita {
  id: string;
  nombre: string;
  correo: string;
  carroModelo: string;
  color: string;
  empresa: string;
  placas: string;
  partido: string;
  fechaPartido: string;
  createdAt: number;
  esEmpleado: boolean;
  pdfUrl?: string;
}

@Component({
  selector: 'app-admin-visitas-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTableModule,
    MatSelectModule,
    MatPaginatorModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  styles: [
    `
      .container {
        max-width: 1400px;
        margin: 0 auto;
        padding: 2rem;
      }

      .form-card {
        margin-bottom: 2rem;
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
        margin: 1rem 0;
      }

      mat-form-field {
        width: 100%;
      }

      .lista-card {
        margin-top: 2rem;
      }

      .search-container {
        margin-bottom: 1rem;
      }

      .search-input {
        width: 100%;
        max-width: 400px;
      }

      .table-container {
        overflow-x: auto;
        margin-top: 1rem;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th {
        background-color: #007a53;
        color: white;
        padding: 12px;
        text-align: left;
        font-weight: 600;
      }

      td {
        padding: 12px;
        border-bottom: 1px solid #e0e0e0;
      }

      tr:hover {
        background-color: #f5f5f5;
      }

      .action-buttons {
        display: flex;
        gap: 0.5rem;
      }

      .btn-download {
        background-color: #007a53;
        color: white;
        padding: 6px 12px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .btn-download:hover {
        background-color: #005a3d;
      }

      .btn-email {
        background-color: #2196f3;
        color: white;
        padding: 6px 12px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .btn-email:hover {
        background-color: #1976d2;
      }

      .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      }
    `,
  ],
  template: `
    <div class="min-h-screen bg-gray-50">
      <mat-toolbar color="primary" class="shadow-md">
        <span class="text-xl font-semibold">
          <mat-icon class="align-middle">directions_car</mat-icon>
          Administración de Visitas
        </span>
        <span class="flex-1"></span>
        <button mat-icon-button (click)="logout()">
          <mat-icon>logout</mat-icon>
        </button>
      </mat-toolbar>

      <div class="container">
        <!-- Formulario de Registro -->
        <mat-card class="form-card">
          <mat-card-header>
            <mat-card-title>Registrar Nueva Visita</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="visitaForm" (ngSubmit)="registrarVisita()">
              <div class="form-grid">
                <mat-form-field appearance="fill">
                  <mat-label>Nombre Completo</mat-label>
                  <input matInput formControlName="nombre" required />
                  <mat-error
                    *ngIf="visitaForm.get('nombre')?.hasError('required')"
                  >
                    El nombre es requerido
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="fill">
                  <mat-label>Correo Electrónico</mat-label>
                  <input
                    matInput
                    type="email"
                    formControlName="correo"
                    required
                  />
                  <mat-error
                    *ngIf="visitaForm.get('correo')?.hasError('required')"
                  >
                    El correo es requerido
                  </mat-error>
                  <mat-error
                    *ngIf="visitaForm.get('correo')?.hasError('email')"
                  >
                    Ingrese un correo válido
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="fill">
                  <mat-label>Empresa</mat-label>
                  <input matInput formControlName="empresa" required />
                  <mat-error
                    *ngIf="visitaForm.get('empresa')?.hasError('required')"
                  >
                    La empresa es requerida
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="fill">
                  <mat-label>Modelo de Auto</mat-label>
                  <input matInput formControlName="carroModelo" required />
                  <mat-error
                    *ngIf="visitaForm.get('carroModelo')?.hasError('required')"
                  >
                    El modelo es requerido
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="fill">
                  <mat-label>Color</mat-label>
                  <input matInput formControlName="color" required />
                  <mat-error
                    *ngIf="visitaForm.get('color')?.hasError('required')"
                  >
                    El color es requerido
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="fill">
                  <mat-label>Placas</mat-label>
                  <input matInput formControlName="placas" required />
                  <mat-error
                    *ngIf="visitaForm.get('placas')?.hasError('required')"
                  >
                    Las placas son requeridas
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="fill">
                  <mat-label>Jornada</mat-label>
                  <mat-select formControlName="partido" required>
                    <mat-option value="">Todas</mat-option>
                    <mat-option
                      *ngFor="let jornada of jornadas"
                      [value]="getJornadaDisplay(jornada)"
                    >
                      {{ getJornadaDisplay(jornada) }}
                    </mat-option>
                  </mat-select>
                  <mat-error
                    *ngIf="visitaForm.get('partido')?.hasError('required')"
                  >
                    La jornada es requerida
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="fill">
                  <mat-label>Fecha del Partido</mat-label>
                  <input
                    matInput
                    [matDatepicker]="picker"
                    formControlName="fechaPartido"
                    placeholder="dd/mm/aaaa"
                    required
                  />
                  <mat-datepicker-toggle
                    matIconSuffix
                    [for]="picker"
                  ></mat-datepicker-toggle>
                  <mat-datepicker #picker></mat-datepicker>
                  <mat-error
                    *ngIf="visitaForm.get('fechaPartido')?.hasError('required')"
                  >
                    La fecha es requerida
                  </mat-error>
                </mat-form-field>
              </div>

              <div style="text-align: center; margin-top: 1rem;">
                <button
                  mat-raised-button
                  color="primary"
                  type="submit"
                  [disabled]="visitaForm.invalid || loading"
                >
                  <mat-icon>add</mat-icon>
                  {{ loading ? 'Registrando...' : 'Registrar Visita' }}
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- Lista de Visitas -->
        <mat-card class="lista-card">
          <mat-card-header>
            <mat-card-title
              >Visitas Registradas ({{
                filteredVisitas.length
              }})</mat-card-title
            >
          </mat-card-header>
          <mat-card-content>
            <!-- Buscador -->
            <div class="search-container">
              <mat-form-field appearance="fill" class="search-input">
                <mat-label>Buscar por nombre o placas</mat-label>
                <input
                  matInput
                  [(ngModel)]="searchText"
                  (ngModelChange)="applySearch()"
                  placeholder="Ingrese nombre o placas..."
                />
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>
            </div>

            <div class="table-container" *ngIf="pagedVisitas.length > 0">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Empresa</th>
                    <th>Auto</th>
                    <th>Placas</th>
                    <th>Partido</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let visita of pagedVisitas; let i = index">
                    <td>{{ pageIndex * pageSize + i + 1 }}</td>
                    <td>{{ visita.nombre }}</td>
                    <td>{{ visita.correo }}</td>
                    <td>{{ visita.empresa }}</td>
                    <td>{{ visita.carroModelo }} - {{ visita.color }}</td>
                    <td>{{ visita.placas }}</td>
                    <td>{{ visita.partido }}</td>
                    <td>{{ visita.fechaPartido }}</td>
                    <td>
                      <div class="action-buttons">
                        <button
                          *ngIf="visita.pdfUrl"
                          class="btn-download"
                          (click)="descargarPDF(visita)"
                          title="Descargar PDF"
                        >
                          <mat-icon
                            style="font-size: 18px; width: 18px; height: 18px;"
                            >download</mat-icon
                          >
                          PDF
                        </button>
                        <button
                          class="btn-email"
                          (click)="enviarCorreo(visita)"
                          [title]="
                            visita.pdfUrl
                              ? 'Enviar por correo'
                              : 'Generar y enviar por correo'
                          "
                        >
                          <mat-icon
                            style="font-size: 18px; width: 18px; height: 18px;"
                            >email</mat-icon
                          >
                          {{ visita.pdfUrl ? 'Enviar' : 'Generar y Enviar' }}
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Paginación -->
            <mat-paginator
              *ngIf="filteredVisitas.length > 0"
              [length]="filteredVisitas.length"
              [pageSize]="pageSize"
              [pageIndex]="pageIndex"
              [pageSizeOptions]="[5, 10, 25, 50]"
              (page)="handlePageEvent($event)"
              showFirstLastButtons
            >
            </mat-paginator>

            <div
              *ngIf="visitas.length === 0"
              style="text-align: center; padding: 2rem;"
            >
              <mat-icon
                style="font-size: 48px; width: 48px; height: 48px; color: #ccc;"
              >
                inbox
              </mat-icon>
              <p style="color: #666;">No hay visitas registradas</p>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div class="loading-overlay" *ngIf="loading">
      <mat-spinner></mat-spinner>
    </div>
  `,
})
export class AdminVisitasDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private database = inject(Database);
  private snackBar = inject(MatSnackBar);
  private functions = inject(Functions);
  private jornadaService = inject(JornadaActivaService);

  visitaForm!: FormGroup;
  visitas: Visita[] = [];
  filteredVisitas: Visita[] = [];
  pagedVisitas: Visita[] = [];
  searchText: string = '';
  pageSize: number = 10;
  pageIndex: number = 0;
  loading = false;
  jornadas: JornadaActiva[] = [];

  ngOnInit() {
    this.initForm();
    this.cargarVisitas();
    this.cargarJornadas();
  }

  cargarJornadas() {
    this.jornadaService.getJornadasActivas$().subscribe({
      next: (jornadas) => {
        this.jornadas = jornadas;
        console.log('Jornadas cargadas:', jornadas);
      },
      error: (error) => {
        console.error('Error cargando jornadas:', error);
      },
    });
  }

  getJornadaDisplay(jornada: JornadaActiva): string {
    return `Jornada ${jornada.jornada}: ${jornada.equipo_local} vs ${jornada.equipo_visitante} (${jornada.fecha}) ${jornada.hora}`;
  }

  initForm() {
    this.visitaForm = this.fb.group({
      nombre: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      empresa: ['', Validators.required],
      carroModelo: ['', Validators.required],
      color: ['', Validators.required],
      placas: ['', Validators.required],
      partido: ['', Validators.required],
      fechaPartido: ['', Validators.required],
    });
  }

  async cargarVisitas() {
    try {
      const visitasRef = ref(this.database, 'visitas');
      const snapshot = await get(visitasRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        this.visitas = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));

        // Ordenar por fecha de creación (más reciente primero)
        this.visitas.sort((a, b) => b.createdAt - a.createdAt);
      } else {
        this.visitas = [];
      }

      // Aplicar búsqueda y paginación
      this.applySearch();
    } catch (error) {
      console.error('Error cargando visitas:', error);
      this.snackBar.open('Error al cargar visitas', 'Cerrar', {
        duration: 3000,
      });
    }
  }

  applySearch() {
    if (!this.searchText || this.searchText.trim() === '') {
      this.filteredVisitas = [...this.visitas];
    } else {
      const searchLower = this.searchText.toLowerCase().trim();
      this.filteredVisitas = this.visitas.filter(
        (visita) =>
          visita.nombre.toLowerCase().includes(searchLower) ||
          visita.placas.toLowerCase().includes(searchLower)
      );
    }

    // Resetear a la primera página al buscar
    this.pageIndex = 0;
    this.updatePagedVisitas();
  }

  handlePageEvent(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.updatePagedVisitas();
  }

  updatePagedVisitas() {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.pagedVisitas = this.filteredVisitas.slice(startIndex, endIndex);
  }

  async registrarVisita() {
    if (this.visitaForm.invalid) return;

    this.loading = true;

    try {
      const visitasRef = ref(this.database, 'visitas');
      const newVisitaRef = push(visitasRef);
      const visitaId = newVisitaRef.key;

      if (!visitaId) {
        throw new Error('No se pudo generar el ID de la visita');
      }

      // Convertir fecha a formato string dd/mm/yyyy
      const fechaPartido = this.visitaForm.value.fechaPartido;
      let fechaString = '';
      if (fechaPartido instanceof Date) {
        const dia = String(fechaPartido.getDate()).padStart(2, '0');
        const mes = String(fechaPartido.getMonth() + 1).padStart(2, '0');
        const anio = fechaPartido.getFullYear();
        fechaString = `${dia}/${mes}/${anio}`;
      } else {
        fechaString = fechaPartido;
      }

      const visitaData = {
        ...this.visitaForm.value,
        fechaPartido: fechaString,
        esEmpleado: false,
        createdAt: Date.now(),
      };

      // Guardar en Firebase Realtime Database
      await set(newVisitaRef, visitaData);

      // Llamar a Cloud Function para generar PDF y enviar correo
      const generateVisitaPDF = httpsCallable<
        { visitaId: string; visitaData: any },
        { success: boolean; pdfUrl: string; message: string }
      >(this.functions, 'generateVisitaPDF');

      await generateVisitaPDF({
        visitaId: visitaId,
        visitaData: visitaData,
      });

      this.snackBar.open(
        '✅ Visita registrada exitosamente. PDF generado y correo enviado.',
        'Cerrar',
        {
          duration: 5000,
        }
      );

      this.visitaForm.reset();
      await this.cargarVisitas();
    } catch (error: any) {
      console.error('Error registrando visita:', error);
      this.snackBar.open(
        `❌ Error al registrar visita: ${error.message}`,
        'Cerrar',
        {
          duration: 5000,
        }
      );
    } finally {
      this.loading = false;
    }
  }

  async descargarPDF(visita: Visita) {
    if (!visita.pdfUrl) {
      this.snackBar.open('PDF no disponible', 'Cerrar', { duration: 3000 });
      return;
    }

    try {
      window.open(visita.pdfUrl, '_blank');
    } catch (error) {
      console.error('Error descargando PDF:', error);
      this.snackBar.open('Error al descargar PDF', 'Cerrar', {
        duration: 3000,
      });
    }
  }

  async enviarCorreo(visita: Visita) {
    this.loading = true;

    try {
      // Si no tiene PDF, generarlo primero
      if (!visita.pdfUrl) {
        this.snackBar.open('⏳ Generando PDF...', '', { duration: 2000 });

        // Obtener los datos actuales de la visita desde la base de datos
        const visitasRef = ref(this.database, `visitas/${visita.id}`);
        const snapshot = await get(visitasRef);
        const visitaData = snapshot.val();

        const generateVisitaPDF = httpsCallable<
          { visitaId: string; visitaData: any },
          { success: boolean; pdfUrl: string; message: string }
        >(this.functions, 'generateVisitaPDF');

        await generateVisitaPDF({
          visitaId: visita.id,
          visitaData: visitaData,
        });

        this.snackBar.open(
          '✅ PDF generado y correo enviado exitosamente',
          'Cerrar',
          {
            duration: 5000,
          }
        );

        // Recargar la lista para actualizar el pdfUrl
        await this.cargarVisitas();
      } else {
        // Si ya tiene PDF, solo reenviar
        const resendVisitaEmail = httpsCallable<
          { visitaId: string },
          { success: boolean; message: string }
        >(this.functions, 'resendVisitaEmail');

        await resendVisitaEmail({
          visitaId: visita.id,
        });

        this.snackBar.open('✅ Correo enviado exitosamente', 'Cerrar', {
          duration: 3000,
        });
      }
    } catch (error: any) {
      console.error('Error enviando correo:', error);
      this.snackBar.open(
        `❌ Error al enviar correo: ${error.message}`,
        'Cerrar',
        {
          duration: 3000,
        }
      );
    } finally {
      this.loading = false;
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
