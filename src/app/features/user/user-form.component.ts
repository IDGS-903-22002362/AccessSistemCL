import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';


import { AreasService, Area } from '../../core/services/areas.service';
import {
  FuncionesService,
  Funcion,
} from '../../core/services/funciones.service';
import { UsersAccesService } from '../../core/services/usersSolicitud.service';
import { AuthService } from '../../core/services/auth.service';
import { UsersService } from '../../core/services/users.service';
import { Empresa } from '../../core/services/empresas.service';
import { EmpresasService } from '../../core/services/empresas.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
  ],
  template: `
    <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
<div class="mb-8 bg-[#007A53] p-6 rounded-lg">
  <div class="flex items-center justify-between">
    <!-- Izquierda: Logo + título -->
    <div class="flex items-center gap-3 text-white">
      <img
        src="images/leon.png"
        alt="Club León"
        class="h-8 w-auto"
      />
      <h1 class="text-3xl font-bold">
        Gestión de Usuarios
      </h1>
    </div>

    <!-- Derecha: Botón Dashboard -->
    <button
      mat-stroked-button
      class="!border-white !text-white hover:!bg-white/10 !rounded-lg !px-4 !py-2 transition-all"
      (click)="goToDashboard()"
    >
      <mat-icon class="mr-2">arrow_back</mat-icon>
      Volver al Dashboard
    </button>
  </div>

  <p class="text-white/80 mt-2">
    Registro de solicitud de accesos para usuarios.
  </p>
</div>


<mat-card
  *ngIf="canSelectEmpresa"
  class="mb-8 shadow-lg rounded-2xl overflow-hidden border border-gray-100"
>
  <div class="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
    <mat-card-title class="text-white text-xl font-semibold !m-0">
      <mat-icon class="mr-2 align-middle">business</mat-icon>
      Empresa
    </mat-card-title>
  </div>

  <mat-card-content class="p-6">
    <form [formGroup]="empresaForm">
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Seleccionar Empresa</mat-label>
        <mat-select formControlName="empresaId">
          <mat-option
            *ngFor="let empresa of empresas"
            [value]="empresa.id"
          >
            {{ empresa.nombre }}
          </mat-option>
        </mat-select>
      </mat-form-field>
    </form>
  </mat-card-content>
</mat-card>


        <!-- Sección de selección de área -->
        <mat-card
          class="mb-8 shadow-lg rounded-2xl overflow-hidden border border-gray-100"
        >
          <div class="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4">
            <mat-card-title class="text-white text-xl font-semibold !m-0">
              <mat-icon class="mr-2 align-middle">group</mat-icon>
              Área Asignada
            </mat-card-title>
          </div>
          <mat-card-content class="p-6">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <p class="text-gray-700 mb-4">Seleccione el área organizacional para la cual desea registrar usuarios:</p>
                <form [formGroup]="areaForm">
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label class="text-gray-600">Seleccionar Área</mat-label>
                  <mat-select formControlName="areaId" panelClass="rounded-lg">
                    <mat-option
                      *ngFor="let area of areas"
                      [value]="area.id"
                      class="hover:bg-blue-50"
                    >
                      <div class="flex items-center">
                        <span>{{ area.nombre }}</span>
                      </div>
                    </mat-option>
                  </mat-select>
                  <mat-hint class="flex items-center text-blue-600 mt-2">
                    <mat-icon class="text-sm mr-1">info</mat-icon>
                    El área seleccionada determina los permisos de los usuarios
                  </mat-hint>
                </mat-form-field>
                </form>
              </div>

              <div class="bg-blue-50 border border-blue-100 rounded-xl p-5">
                <h3 class="font-semibold text-blue-800 mb-3 flex items-center">
                  <mat-icon class="mr-2">lightbulb</mat-icon>
                  Información Importante
                </h3>
                <ul class="space-y-2 text-sm text-gray-700">
                  <li class="flex items-start">
                    <mat-icon class="text-green-600 mr-2 text-sm"
                      >check_circle</mat-icon
                    >
                    <span
                      >Puede registrar usuarios individualmente o mediante
                      archivo CSV</span
                    >
                  </li>
                  <li class="flex items-start">
                    <mat-icon class="text-green-600 mr-2 text-sm"
                      >check_circle</mat-icon
                    >
                    <span
                      >Todos los usuarios requieren validación del
                      administrador</span
                    >
                  </li>
                  <li class="flex items-start">
                    <mat-icon class="text-green-600 mr-2 text-sm"
                      >check_circle</mat-icon
                    >
                    <span
                      >Los datos se guardarán automáticamente en el
                      sistema</span
                    >
                  </li>
                </ul>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Sección de herramientas de importación -->
        <mat-card
          class="mb-8 shadow-lg rounded-2xl overflow-hidden border border-gray-100"
        >
          <div class="bg-gradient-to-r from-gray-700 to-gray-900 px-6 py-4">
            <mat-card-title
              class="text-white text-xl font-semibold !m-0 flex items-center justify-between"
            >
              <div>
                <mat-icon class="mr-2 align-middle">cloud_upload</mat-icon>
                Importación Masiva
              </div>
              
            </mat-card-title>
          </div>
          <mat-card-content class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="space-y-4">
                <div class="flex items-center space-x-4">
                  <button
                    mat-raised-button
                    color="primary"
                    class="!bg-blue-600 hover:!bg-blue-700 !text-white !font-medium !px-6 !py-3 !rounded-lg !shadow-md transition-all duration-200"
                    (click)="downloadTemplate()"
                  >
                    <mat-icon class="mr-2">download_for_offline</mat-icon>
                    Descargar Plantilla
                  </button>
                  <div class="text-sm text-gray-600">
                    <p class="font-medium">Plantilla CSV</p>
                    <p class="text-xs">Formato predefinido</p>
                  </div>
                </div>

                <div class="flex items-center space-x-4">
                  <button
                    mat-stroked-button
                    color="primary"
                    class="!border-blue-600 !text-blue-600 hover:!bg-blue-50 !font-medium !px-6 !py-3 !rounded-lg transition-all duration-200"
                    (click)="fileInput.click()"
                  >
                    <mat-icon class="mr-2">upload_file</mat-icon>
                    Seleccionar Archivo
                  </button>
                  <input
                    #fileInput
                    type="file"
                    accept=".csv"
                    hidden
                    (change)="onFileSelected($event)"
                  />
                  <div class="text-sm text-gray-600 flex-1">
                    <p class="font-medium">Subir CSV</p>
                    <p class="text-xs">Máx. 5MB, formato .csv</p>
                  </div>
                </div>
              </div>

              <div class="bg-gray-50 border border-gray-200 rounded-xl p-5">
                <div *ngIf="selectedFileName; else noFile" class="space-y-3">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center">
                      <mat-icon class="text-green-600 mr-3"
                        >description</mat-icon
                      >
                      <div>
                        <p class="font-medium text-gray-800">
                          {{ selectedFileName }}
                        </p>
                        <p class="text-xs text-gray-500">
                          Archivo cargado exitosamente
                        </p>
                      </div>
                    </div>
                    <mat-icon class="text-green-500">check_circle</mat-icon>
                  </div>
                  <div class="flex items-center text-sm text-gray-600">
                    <mat-icon class="text-sm mr-2">schedule</mat-icon>
                    <span>Listo para procesar</span>
                  </div>
                </div>
                <ng-template #noFile>
                  <div class="text-center py-4">
                    <mat-icon class="text-gray-400 text-4xl mb-3"
                      >folder_open</mat-icon
                    >
                    <p class="text-gray-500">No hay archivo seleccionado</p>
                    <p class="text-xs text-gray-400 mt-1">
                      Suba un archivo CSV para continuar
                    </p>
                  </div>
                </ng-template>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
        <div class="flex justify-center mb-6">
  <button
    mat-raised-button
    color="accent"
    class="!bg-green-600 !text-white !px-6 !py-3 !rounded-lg"
    (click)="showManualForm = !showManualForm"
  >
    <mat-icon class="mr-2">
      {{ showManualForm ? 'expand_less' : 'expand_more' }}
    </mat-icon>
    {{ showManualForm ? 'Ocultar Registro Manual' : 'Abrir Registro Manual' }}
  </button>
</div>


        <!-- Formulario manual -->
        <mat-card *ngIf="showManualForm" class="mb-8 shadow-lg rounded-2xl overflow-hidden border border-gray-100">
          <div class="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
            <mat-card-title class="text-white text-xl font-semibold !m-0">
              <mat-icon class="mr-2 align-middle">person_add</mat-icon>
              Registro Manual
            </mat-card-title>
          </div>
          <br />
          <mat-card-content class="p-6">
            <form [formGroup]="manualForm" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <!-- Campo Nombre -->
              <mat-form-field appearance="outline" class="w-full">
                <mat-label class="text-gray-600">Nombre</mat-label>
                <input matInput formControlName="nombre" />
                <mat-icon matPrefix class="text-gray-400 mr-2">person</mat-icon>
                <mat-error *ngIf="areaForm.get('nombre')?.invalid && areaForm.get('nombre')?.touched">
                  El nombre es requerido
                </mat-error>
              </mat-form-field>

              <!-- Campo Apellido Paterno -->
              <mat-form-field appearance="outline" class="w-full">
                <mat-label class="text-gray-600">Apellido Paterno</mat-label>
                <input matInput formControlName="apellidoPaterno" />
                <mat-icon matPrefix class="text-gray-400 mr-2">badge</mat-icon>
                <mat-error *ngIf="areaForm.get('apellidoPaterno')?.invalid && areaForm.get('apellidoPaterno')?.touched">
                  El apellido paterno es requerido
                </mat-error>
              </mat-form-field>

              <!-- Campo Apellido Materno -->
              <mat-form-field appearance="outline" class="w-full">
                <mat-label class="text-gray-600">Apellido Materno</mat-label>
                <input matInput formControlName="apellidoMaterno" />
                <mat-icon matPrefix class="text-gray-400 mr-2">badge</mat-icon>
              </mat-form-field>

              <!-- Campo Función -->
              <mat-form-field appearance="outline" class="w-full">
                <mat-label class="text-gray-600">Función/Cargo</mat-label>
                <mat-select formControlName="funcion" panelClass="rounded-lg">
                  <mat-option
                    *ngFor="let func of funciones"
                    [value]="func.id"
                    class="hover:bg-blue-50"
                  >
                    <div class="flex items-center">
                      <span>{{ func.nombre }}</span>
                    </div>
                  </mat-option>
                </mat-select>
                <mat-icon matPrefix class="text-gray-400 mr-2">work</mat-icon>
                <mat-error *ngIf="areaForm.get('funcion')?.invalid && areaForm.get('funcion')?.touched">
                  La función es requerida
                </mat-error>
              </mat-form-field>

              <!-- Campo Teléfono -->
              <mat-form-field appearance="outline" class="w-full">
                <mat-label class="text-gray-600">Teléfono</mat-label>
                <input matInput formControlName="telefono" type="tel" />
                <mat-icon matPrefix class="text-gray-400 mr-2">phone</mat-icon>
                <mat-error *ngIf="areaForm.get('telefono')?.invalid && areaForm.get('telefono')?.touched">
                  El teléfono es requerido
                </mat-error>
              </mat-form-field>

              <!-- Campo Email -->
              <mat-form-field appearance="outline" class="w-full">
                <mat-label class="text-gray-600">Correo Electrónico</mat-label>
                <input matInput formControlName="email" type="email" />
                <mat-icon matPrefix class="text-gray-400 mr-2">email</mat-icon>
                <mat-error *ngIf="areaForm.get('email')?.invalid && areaForm.get('email')?.touched">
                  {{ areaForm.get('email')?.hasError('required') ? 'El email es requerido' : 'Email inválido' }}
                </mat-error>
              </mat-form-field>

              <!-- Botón Agregar -->
              <div class="md:col-span-2 lg:col-span-3 flex justify-center mt-4">
                <button
                type="button"
                  mat-raised-button
                  color="primary"
                  class="!bg-gradient-to-r !from-green-600 !to-green-700 hover:!from-green-700 hover:!to-green-800 !text-white !font-medium !px-8 !py-3 !rounded-lg !shadow-lg transition-all duration-200 transform hover:scale-105"
                  (click)="addManualUser()"
                >
                  <mat-icon class="mr-2">add_circle</mat-icon>
                  Agregar Usuario a la Lista
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- Tabla de previsualización -->
        <mat-card
          *ngIf="previewUsers.length"
          class="shadow-lg rounded-2xl overflow-hidden border border-gray-100"
        >
          <div class="bg-gradient-to-r from-purple-600 to-purple-800 px-6 py-4">
            <mat-card-title
              class="text-white text-xl font-semibold !m-0 flex items-center justify-between"
            >
              <div>
                <mat-icon class="mr-2 align-middle">list_alt</mat-icon>
                Vista Previa de Usuarios
                <span
                  class="ml-3 bg-white text-purple-700 text-sm font-medium px-3 py-1 rounded-full"
                >
                  {{ previewUsers.length }}
                  {{ previewUsers.length === 1 ? 'usuario' : 'usuarios' }}
                </span>
              </div>
              <button
                mat-raised-button
                color="accent"
                class="!bg-white !text-purple-700 hover:!bg-gray-100 !font-medium"
                (click)="submitAll()"
              >
                <mat-icon class="mr-2">send</mat-icon>
                Enviar Solicitudes
              </button>
            </mat-card-title>
          </div>
          <mat-card-content class="p-0">
            <div class="overflow-x-auto">
              <table mat-table [dataSource]="previewUsers" class="w-full">
                <!-- Nombre Column -->
                <ng-container matColumnDef="nombre">
                  <th
                    mat-header-cell
                    *matHeaderCellDef
                    class="font-semibold text-gray-700 px-6 py-4 bg-gray-50"
                  >
                    <div class="flex items-center">
                      <mat-icon class="mr-2 text-sm">person</mat-icon>
                      Nombre Completo
                    </div>
                  </th>
                  <td
                    mat-cell
                    *matCellDef="let u"
                    class="px-6 py-4 border-t border-gray-100"
                  >
                    <div class="font-medium text-gray-900">
                      {{ u.nombre }} {{ u.apellidoPaterno }}
                      {{ u.apellidoMaterno }}
                    </div>
                    <div class="text-sm text-gray-500">{{ u.funcion }}</div>
                  </td>
                </ng-container>

                <!-- Email Column -->
                <ng-container matColumnDef="email">
                  <th
                    mat-header-cell
                    *matHeaderCellDef
                    class="font-semibold text-gray-700 px-6 py-4 bg-gray-50"
                  >
                    <div class="flex items-center">
                      <mat-icon class="mr-2 text-sm">email</mat-icon>
                      Email
                    </div>
                  </th>
                  <td
                    mat-cell
                    *matCellDef="let u"
                    class="px-6 py-4 border-t border-gray-100"
                  >
                    <div class="text-gray-900">{{ u.email }}</div>
                  </td>
                </ng-container>

                <!-- Teléfono Column -->
                <ng-container matColumnDef="telefono">
                  <th
                    mat-header-cell
                    *matHeaderCellDef
                    class="font-semibold text-gray-700 px-6 py-4 bg-gray-50"
                  >
                    <div class="flex items-center">
                      <mat-icon class="mr-2 text-sm">phone</mat-icon>
                      Teléfono
                    </div>
                  </th>
                  <td
                    mat-cell
                    *matCellDef="let u"
                    class="px-6 py-4 border-t border-gray-100"
                  >
                    <div class="text-gray-900">{{ u.telefono }}</div>
                  </td>
                </ng-container>

                <!-- Acciones Column -->
                <ng-container matColumnDef="acciones">
                  <th
                    mat-header-cell
                    *matHeaderCellDef
                    class="font-semibold text-gray-700 px-6 py-4 bg-gray-50 text-right"
                  >
                    Acciones
                  </th>
                  <td
                    mat-cell
                    *matCellDef="let u; let i = index"
                    class="px-6 py-4 border-t border-gray-100 text-right"
                  >
                    <button
                      mat-icon-button
                      class="!text-red-600 hover:!bg-red-50"
                      (click)="removeUser(i)"
                      aria-label="Eliminar usuario"
                      matTooltip="Eliminar usuario"
                    >
                      <mat-icon>delete_outline</mat-icon>
                    </button>
                  </td>
                </ng-container>

                <tr
                  mat-header-row
                  *matHeaderRowDef="columns"
                  class="bg-gray-50"
                ></tr>
                <tr
                  mat-row
                  *matRowDef="let row; columns: columns; let even = even"
                  [class.bg-gray-50]="even"
                  class="hover:bg-blue-50 transition-colors duration-150"
                ></tr>
              </table>
            </div>

            <div *ngIf="previewUsers.length === 0" class="text-center py-12">
              <mat-icon class="text-gray-300 text-5xl mb-4">group_off</mat-icon>
              <p class="text-gray-500">No hay usuarios en la lista</p>
              <p class="text-sm text-gray-400 mt-1">
                Agregue usuarios mediante el formulario o importación CSV
              </p>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Estado del formulario -->
        <div *ngIf="previewUsers.length === 0" class="text-center py-12">
          <div class="max-w-md mx-auto">
            <mat-icon class="text-gray-300 text-6xl mb-4">how_to_reg</mat-icon>
            <h3 class="text-xl font-semibold text-gray-700 mb-2">
              Lista Vacía
            </h3>
            <p class="text-gray-500 mb-6">
              Comience agregando usuarios mediante el formulario manual o
              importando un archivo CSV.
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                mat-stroked-button
                color="accent"
                class="!border-purple-600 !text-purple-600"
              >
                <mat-icon class="mr-2">description</mat-icon>
                Ver Documentación
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      ::ng-deep .mat-form-field-outline {
        background-color: white;
        border-radius: 8px;
      }

      ::ng-deep .mat-form-field-appearance-outline .mat-form-field-outline {
        color: #e5e7eb;
      }

      ::ng-deep
        .mat-form-field-appearance-outline.mat-focused
        .mat-form-field-outline-thick {
        color: #3b82f6;
      }

      ::ng-deep .mat-select-panel {
        border-radius: 12px !important;
        margin-top: 8px !important;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1),
          0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
      }

      ::ng-deep .mat-option {
        border-radius: 8px !important;
        margin: 4px 8px !important;
      }

      ::ng-deep .mat-card {
        border-radius: 16px !important;
      }

      table {
        border-collapse: separate;
        border-spacing: 0;
      }

      th:first-child {
        border-top-left-radius: 12px;
      }

      th:last-child {
        border-top-right-radius: 12px;
      }

      tr:last-child td:first-child {
        border-bottom-left-radius: 12px;
      }

      tr:last-child td:last-child {
        border-bottom-right-radius: 12px;
      }
    `,
  ],
})
export class UserFormComponent implements OnInit {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private areasService = inject(AreasService);
  private funcionesService = inject(FuncionesService);
  private usersAccessService = inject(UsersAccesService);
  private authService = inject(AuthService);
  private empresasService = inject(EmpresasService);

  selectedFileName: string | null = null;
  showManualForm = false;
  canSelectEmpresa = false;


  async checkEmpresaAccess() {
    const authUser = this.authService.getCurrentUser();
    if (!authUser?.email) return;

    const userData = await this.usersService.getUserWithRoleNameByEmail(authUser.email);

    console.log('USER DATA RESUELTO:', userData);

    this.canSelectEmpresa = userData?.roleName === 'AdminEspecial';
  }






  goToDashboard(): void {
    this.router.navigate(['/user']);
  }

  areas: Area[] = [];
  funciones: Funcion[] = [];
  previewUsers: any[] = [];
  columns = ['nombre', 'email', 'telefono', 'acciones'];
  removeUser(index: number) {
    this.previewUsers.splice(index, 1);

    // Forzamos actualización de la tabla
    this.previewUsers = [...this.previewUsers];
  }



  areaForm = this.fb.group({
    areaId: ['', Validators.required],
  });

  manualForm = this.fb.group({
    nombre: ['', Validators.required],
    apellidoPaterno: ['', Validators.required],
    apellidoMaterno: [''],
    funcion: ['', Validators.required],
    telefono: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });

  private usersService = inject(UsersService);
  empresas: Empresa[] = [];
  empresaForm = this.fb.group({
    empresaId: [''],
  });


  async loadEmpresas() {
    try {
      this.empresas = await this.empresasService.getEmpresasPorUsuarioLogueado();
    } catch (error) {
      console.error('Error cargando empresas:', error);
      this.empresas = [];
    }
  }

  async loadAreasByUsuario() {
    const authUser = this.authService.getCurrentUser();

    if (!authUser?.email) {
      console.warn('Usuario no autenticado');
      return;
    }

    const userData = await this.usersService.getUserByEmail(authUser.email);

    if (!userData?.areaIds || userData.areaIds.length === 0) {
      console.warn('Usuario sin áreas asignadas');
      this.areas = [];
      return;
    }

    this.areas = await this.areasService.getAreasByIds(userData.areaIds);
  }

  async loadPatrocinadoresByUsuario() {
    const authUser = this.authService.getCurrentUser();

    if (!authUser?.email) {
      console.warn('Usuario no autenticado');
      return;
    }

    const userData = await this.usersService.getUserByEmail(authUser.email);

    if (!userData?.areaIds || userData.areaIds.length === 0) {
      console.warn('Usuario sin empresas asignadas');
      this.areas = [];
      return;
    }

    this.areas = await this.areasService.getAreasByIds(userData.areaIds);
  }

  async ngOnInit() {
    await this.loadAreasByUsuario();
    await this.loadFunciones();
    await this.checkEmpresaAccess();
    await this.loadEmpresas();
  }



  async loadFunciones() {
    try {
      this.funciones = await this.funcionesService.getFunciones();
      console.log('✅ Funciones cargadas:', this.funciones);
    } catch (error) {
      console.error('Error cargando funciones:', error);
      this.funciones = [];
    }
  }

  downloadTemplate() {
    // Generar CSV con funciones disponibles como referencia
    let csv = 'nombre,apellidoPaterno,apellidoMaterno,funcion,telefono,email\n';
    csv += '# Funciones disponibles (use el nombre exacto):\n';
    this.funciones.forEach((func) => {
      csv += `# - ${func.nombre}\n`;
    });
    csv += '\n';

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_usuarios.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.selectedFileName = file.name;

    const reader = new FileReader();
    reader.onload = () => this.parseCSV(reader.result as string);
    reader.readAsText(file);
  }

  parseCSV(csv: string) {
    const errors: string[] = [];

    const lines = csv
      .split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#'));

    const headers = lines[0].split(',').map(h => h.trim());

    lines.slice(1).forEach((line, index) => {
      const values = line.split(',');
      const user: any = {};

      headers.forEach((h, i) => {
        let value = values[i]?.trim() || '';

        if (h === 'email') {
          value = value
            .replace(/^=HYPERLINK\("mailto:/i, '')
            .replace(/".*$/, '')
            .replace(/"/g, '');
        }

        if (h === 'funcion') {
          const funcionEncontrada = this.funciones.find(
            f => f.nombre.toLowerCase() === value.toLowerCase()
          );

          if (!funcionEncontrada) {
            errors.push(
              `Línea ${index + 2}: la función "${value}" no existe`
            );
          } else {
            user.funcion = funcionEncontrada.id;
          }
          return;
        }

        user[h] = value;
      });

      this.previewUsers.push(user);
    });

    if (errors.length) {
      alert(
        'Errores encontrados en el archivo:\n\n' +
        errors.join('\n')
      );
      this.previewUsers = [];
      return;
    }

    this.previewUsers = [...this.previewUsers];
  }




  addManualUser() {
    if (this.manualForm.invalid) {
      this.manualForm.markAllAsTouched();
      return;
    }

    const user = this.manualForm.value;

    this.previewUsers.push(user);
    this.previewUsers = [...this.previewUsers];

    this.manualForm.reset();
  }



  async submitAll() {
    if (this.areaForm.invalid) {
      alert('Seleccione un área');
      return;
    }

    const authUser = this.authService.getCurrentUser();
    if (!authUser?.email) {
      alert('Sesión no válida');
      return;
    }

    const leaderData = await this.usersService.getUserByEmail(authUser.email);

    let empresaIdFinal: string | undefined;

    if (this.canSelectEmpresa) {
      empresaIdFinal = this.empresaForm.value.empresaId ?? undefined;
      if (!empresaIdFinal) {
        alert('Seleccione una empresa');
        return;
      }
    } else {
      empresaIdFinal = leaderData?.empresaId;
    }

    if (!empresaIdFinal) {
      alert('No se pudo determinar la empresa');
      return;
    }
    const estatusInicial: 'pendiente' | 'aprobado' =
      this.canSelectEmpresa ? 'aprobado' : 'pendiente';


    for (const u of this.previewUsers) {

      const userData: any = {
        ...u,
        areaId: this.areaForm.value.areaId,
        empresaId: empresaIdFinal,
        estatus: this.canSelectEmpresa ? 'aprobado' : 'pendiente',
      };

      // 👉 SOLO si es AdminEspecial
      if (this.canSelectEmpresa) {
        userData.reviewedBy = authUser.email;
        userData.reviewedAt = new Date();
      }

      await this.usersAccessService.createUser(
        userData,
        authUser.email
      );
    }



    this.previewUsers = [];
    alert('Solicitudes enviadas correctamente');
  }

}
