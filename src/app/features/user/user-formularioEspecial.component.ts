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
import * as XLSX from 'xlsx';
import {
  JornadaActivaService,
  JornadaActiva,
} from '../../core/services/jornadas.service';
import { take } from 'rxjs/operators';




@Component({
  selector: 'app-user-form-especial',
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
    <!-- Notificaciones -->
        <div
          *ngIf="notifications.length"
          class="notification-stack space-y-3"
        >
          <div
            *ngFor="let note of notifications"
            class="notification"
            [class.notification-success]="note.type === 'success'"
            [class.notification-error]="note.type === 'error'"
            [class.notification-info]="note.type === 'info'"
            role="status"
            aria-live="polite"
          >
            <div class="notification-icon">
              <mat-icon>{{ note.icon }}</mat-icon>
            </div>
            <div class="flex-1">
              <p class="font-semibold text-gray-900">{{ note.title }}</p>
              <p class="text-sm text-gray-600">{{ note.message }}</p>
            </div>
            <button
              mat-icon-button
              class="!text-gray-400 hover:!text-gray-600"
              aria-label="Cerrar notificacion"
              (click)="dismissNotification(note.id)"
            >
              <mat-icon>close</mat-icon>
            </button>
          </div>
        </div>
        <div class="flex justify-center mb-6">
          <button
            mat-raised-button
            color="accent"
            class="!bg-[#007A53] !text-white !px-6 !py-3 !rounded-lg hover:!bg-[#006B49]"
            (click)="showManualForm = !showManualForm"
          >
            <mat-icon class="mr-2">
              {{ showManualForm ? 'expand_less' : 'expand_more' }}
            </mat-icon>
            {{
              showManualForm
                ? 'Ocultar Registro Manual'
                : 'Abrir Registro Manual'
            }}
          </button>
        </div>
  <!-- Formulario manual -->
          <mat-card
            *ngIf="showManualForm"
            class="mb-8 shadow-lg rounded-2xl overflow-hidden border border-gray-100"
          >
            <div class="bg-[#007A53] px-6 py-4">
              <mat-card-title class="text-white text-xl font-semibold !m-0">
                <mat-icon class="mr-2 align-middle">person_add</mat-icon>
                Registro Manual
              </mat-card-title>
            </div>
            <br />
            <mat-card-content class="p-6">
              <form
                [formGroup]="manualForm"
                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <!-- Campo Nombre -->
                <mat-form-field appearance="fill" class="w-full">
                  <mat-label class="text-gray-600">Nombre</mat-label>
                  <input matInput formControlName="nombre" />
                  <mat-icon matPrefix class="text-gray-400 mr-2">person</mat-icon>
                  <mat-error
                    *ngIf="
                      manualForm.get('nombre')?.invalid &&
                      manualForm.get('nombre')?.touched
                    "
                  >
                    El nombre es requerido
                  </mat-error>
                </mat-form-field>
  
                <!-- Campo Apellido Paterno -->
                <mat-form-field appearance="fill" class="w-full">
                  <mat-label class="text-gray-600">Apellido Paterno</mat-label>
                  <input matInput formControlName="apellidoPaterno" />
                  <mat-icon matPrefix class="text-gray-400 mr-2">badge</mat-icon>
                  <mat-error
                    *ngIf="
                      manualForm.get('apellidoPaterno')?.invalid &&
                      manualForm.get('apellidoPaterno')?.touched
                    "
                  >
                    El apellido paterno es requerido
                  </mat-error>
                </mat-form-field>
  
                <!-- Campo Apellido Materno -->
                <mat-form-field appearance="fill" class="w-full">
                  <mat-label class="text-gray-600">Apellido Materno</mat-label>
                  <input matInput formControlName="apellidoMaterno" />
                  <mat-icon matPrefix class="text-gray-400 mr-2">badge</mat-icon>
                </mat-form-field>
  
                <!-- Campo Función -->
                <mat-form-field appearance="fill" class="w-full">
                  <mat-label class="text-gray-600">Función/Cargo</mat-label>
                  <mat-select formControlName="funcion" panelClass="rounded-lg">
                    <mat-option
                      *ngFor="let func of funciones"
                      [value]="func.id"
                      class="hover:bg-[#F3FAF6]"
                    >
                      <div class="flex items-center">
                        <span>{{ func.nombre }}</span>
                      </div>
                    </mat-option>
                  </mat-select>
                  <mat-icon matPrefix class="text-gray-400 mr-2">work</mat-icon>
                  <mat-error
                    *ngIf="
                      manualForm.get('funcion')?.invalid &&
                      manualForm.get('funcion')?.touched
                    "
                  >
                    La función es requerida
                  </mat-error>
                </mat-form-field>
  
                <!-- Campo Teléfono -->
                <mat-form-field appearance="fill" class="w-full">
                  <mat-label class="text-gray-600">Teléfono</mat-label>
                  <input
                    matInput
                    formControlName="telefono"
                    type="tel"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    (keypress)="onlyNumbers($event)"
                  />

                  <mat-icon matPrefix class="text-gray-400 mr-2">phone</mat-icon>
                  <mat-error
                    *ngIf="
                      manualForm.get('telefono')?.invalid &&
                      manualForm.get('telefono')?.touched
                    "
                  >
                    El teléfono es requerido
                  </mat-error>
                </mat-form-field>
  
                <!-- Campo Email -->
                <mat-form-field *ngIf="!isHamcoUser" appearance="fill" class="w-full">
                  <mat-label class="text-gray-600">Correo Electrónico</mat-label>
                  <input matInput formControlName="email" type="email" />
                  <mat-icon matPrefix class="text-gray-400 mr-2">email</mat-icon>
                  <mat-error
                    *ngIf="
                      manualForm.get('email')?.invalid &&
                      manualForm.get('email')?.touched
                    "
                  >
                    {{
                      manualForm.get('email')?.hasError('required')
                        ? 'El email es requerido'
                        : 'Email inválido'
                    }}
                  </mat-error>
                </mat-form-field>
                
                <mat-form-field
                  *ngIf="isHamcoUser"
                  appearance="fill"
                  class="w-full"
                >
                  <mat-label class="text-gray-600">Código de Pulsera</mat-label>
                  <input matInput formControlName="codigoPulsera" />
                  <mat-icon matPrefix class="text-gray-400 mr-2">confirmation_number</mat-icon>
                </mat-form-field>
                <form [formGroup]="areaForm">
                  <mat-form-field appearance="fill" class="w-full">
                    <mat-label class="text-gray-600"
                      >Seleccionar Área</mat-label
                    >
                    <mat-select
                      formControlName="areaId"
                      panelClass="rounded-lg"
                    >
                      <mat-option
                        *ngFor="let area of areas"
                        [value]="area.id"
                        class="hover:bg-[#F3FAF6]"
                      >
                        <div class="flex items-center">
                          <span>{{ area.nombre }}</span>
                        </div>
                      </mat-option>
                    </mat-select>
                    <mat-hint class="flex items-center text-[#007A53] mt-2">
                      <mat-icon class="text-sm mr-1">info</mat-icon>
                      El área seleccionada determina los permisos de los
                      usuarios
                    </mat-hint>
                  </mat-form-field>
                </form>
                <form [formGroup]="empresaForm">
              <mat-form-field appearance="fill" class="w-full">
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
  
  
                <!-- Botón Agregar -->
                <div class="md:col-span-2 lg:col-span-3 flex justify-center mt-4">
                  <button
                    type="button"
                    mat-raised-button
                    color="primary"
                    class="!bg-[#007A53] hover:!bg-[#006B49] !text-white !font-medium !px-8 !py-3 !rounded-lg !shadow-lg transition-all duration-200 transform hover:scale-105"
                    (click)="submitSingleUserFromManual()"
                  >
                    <mat-icon class="mr-2">add_circle</mat-icon>
                    Agregar Usuario a la Lista
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>
    `,
  styles: [
    `
        :host {
          color: #111827;
        }
  
        .notification {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          box-shadow: 0 10px 25px -20px rgba(0, 0, 0, 0.25);
          animation: note-slide 180ms ease-out;
        }
  
        .notification-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #f3faf6;
          color: #007a53;
        }
  
        .notification-success,
        .notification-info,
        .notification-error {
          border-color: #cfe6dc;
        }
  
        .notification-stack {
          position: fixed;
          top: 1.5rem;
          right: 1.5rem;
          z-index: 50;
          width: min(420px, 92vw);
        }
  
        @media (max-width: 640px) {
          .notification-stack {
            left: 50%;
            right: auto;
            transform: translateX(-50%);
          }
        }
  
        @keyframes note-slide {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
  
  
  
  ::ng-deep .mat-form-field-appearance-outline .mat-form-field-outline-start,
  ::ng-deep .mat-form-field-appearance-outline .mat-form-field-outline-end {
    border-color: #e5e7eb;
  }
  
  ::ng-deep .mat-form-field-appearance-outline.mat-focused .mat-form-field-outline-start,
  ::ng-deep .mat-form-field-appearance-outline.mat-focused .mat-form-field-outline-end,
  ::ng-deep .mat-form-field-appearance-outline.mat-focused .mat-form-field-outline-gap {
    border-color: #007A53 !important;
    border-width: 1px !important;
  }
  
  ::ng-deep .mat-form-field-appearance-outline .mat-form-field-flex {
    background-color: white !important;
    border-radius: 8px !important;
  }
  
  
  
  /* Ajuste para íconos en campos con prefijo */
  ::ng-deep .mat-form-field-appearance-outline .mat-form-field-prefix {
    align-self: center !important;
    padding-left: 8px !important;
    padding-right: 8px !important;
  }
  
  /* Asegurar que el input esté correctamente alineado */
  ::ng-deep .mat-form-field-appearance-outline .mat-form-field-infix {
    padding-top: 12px !important;
    padding-bottom: 12px !important;
  }
  
  /* Mejorar la apariencia de los select */
  ::ng-deep .mat-form-field-appearance-outline .mat-select-arrow-wrapper {
    transform: translateY(0) !important;
  }
  /* Asegurar que todos los mat-form-field tengan el mismo estilo base */
  ::ng-deep .mat-form-field {
    width: 100% !important;
  }
  
  /* Mejorar la apariencia del hint */
  ::ng-deep .mat-form-field-hint-wrapper {
    padding-left: 0 !important;
  }
  
  /* Ajustar el espacio entre campos en el grid */
  .form-grid {
    gap: 1rem !important;
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
export class UserFormEspecialComponent implements OnInit {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private areasService = inject(AreasService);
  private funcionesService = inject(FuncionesService);
  private usersAccessService = inject(UsersAccesService);
  private authService = inject(AuthService);
  private empresasService = inject(EmpresasService);
  private usersService = inject(UsersService);
  isHamcoUser = false;
  private jornadaService = inject(JornadaActivaService);

  jornadaActiva?: JornadaActiva;

  loadJornadaActiva(): void {
    this.jornadaService
      .getJornadasActivas$()
      .pipe(take(1))
      .subscribe({
        next: (jornadas) => {
          this.jornadaActiva = jornadas.length ? jornadas[0] : undefined;

          if (!this.jornadaActiva) {
            this.pushNotification(
              'error',
              'Sin jornada activa',
              'No existe una jornada activa para registrar usuarios.'
            );
          }
        },
        error: () => {
          this.pushNotification(
            'error',
            'Error',
            'No se pudo obtener la jornada activa.'
          );
        },
      });
  }





  selectedFileName: string | null = null;
  showManualForm = false;
  canSelectEmpresa = false;
  currentUserRoleName: string | null = null;
  isParsing = false;
  isSubmitting = false;
  notifications: Array<{
    id: number;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
    icon: string;
  }> = [];
  private notificationId = 0;

  async checkEmpresaAccess() {
    const authUser = this.authService.getCurrentUser();
    if (!authUser?.email) return;

    const userData = await this.usersService.getUserWithRoleNameByEmail(
      authUser.email
    );

    console.log('USER DATA RESUELTO:', userData);

    this.canSelectEmpresa = userData?.roleName === 'AdminEspecial';
    this.currentUserRoleName = userData?.roleName || null;


    this.isHamcoUser = userData?.apodo === 'hamco';
    this.setTableColumns();
  }


  goToDashboard(): void {
    // AdminEspecial debe ir a /user (que es su dashboard)
    // Otros usuarios van a sus respectivos dashboards
    if (this.currentUserRoleName === 'AdminEspecial') {
      this.router.navigate(['/user']);
    } else if (this.currentUserRoleName === 'AdminArea') {
      this.router.navigate(['/admin-area']);
    } else {
      this.router.navigate(['/user']);
    }
  }

  areas: Area[] = [];
  funciones: Funcion[] = [];
  previewUsers: any[] = [];
  columns: string[] = [];

  private setTableColumns() {
    if (this.isHamcoUser) {
      this.columns = ['nombre', 'codigoPulsera', 'telefono', 'acciones'];
    } else {
      this.columns = ['nombre', 'email', 'telefono', 'acciones'];
    }
  }

  removeUser(index: number) {
    this.previewUsers.splice(index, 1);

    // Forzamos actualizacion de la tabla
    this.previewUsers = [...this.previewUsers];
    this.pushNotification(
      'info',
      'Usuario eliminado',
      'Se retiro el usuario de la lista.'
    );
  }

  areaForm = this.fb.group({
    areaId: ['', Validators.required],
  });

  manualForm = this.fb.group({
    nombre: ['', Validators.required],
    apellidoPaterno: ['', Validators.required],
    apellidoMaterno: [''],
    funcion: ['', Validators.required],
    telefono: [
      '',
      [
        Validators.required,
        Validators.pattern('^[0-9]+$'), // solo números
        Validators.minLength(10),       // opcional (teléfono típico MX)
        Validators.maxLength(10),       // opcional
      ],
    ],

    email: ['', [Validators.required, Validators.email]],
    codigoPulsera: [''],
  });

  empresas: Empresa[] = [];
  empresaForm = this.fb.group({
    empresaId: [''],
  });

  async loadEmpresas() {
    try {
      this.empresas =
        await this.empresasService.getEmpresasPorUsuarioLogueado();
    } catch (error) {
      console.error('Error cargando empresas:', error);
      this.empresas = [];
    }
  }

  async loadAreasByUsuario() {
    const authUser = this.authService.getCurrentUser();

    if (!authUser?.email) {
      console.warn('Usuario no autenticado');
      this.pushNotification(
        'error',
        'Sesion no valida',
        'No se pudo identificar al usuario autenticado.'
      );
      return;
    }

    const userData = await this.usersService.getUserByEmail(authUser.email);

    if (!userData?.areaIds || userData.areaIds.length === 0) {
      console.warn('Usuario sin áreas asignadas');
      this.areas = [];
      this.pushNotification(
        'info',
        'Sin areas asignadas',
        'Contacte al administrador para habilitar su area.'
      );
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

    if (this.isHamcoUser) {
      this.manualForm.get('codigoPulsera')?.setValidators([Validators.required]);
      this.manualForm.get('email')?.clearValidators();
    } else {
      this.manualForm.get('email')?.setValidators([
        Validators.required,
        Validators.email,
      ]);
      this.manualForm.get('codigoPulsera')?.clearValidators();
    }

    this.manualForm.get('email')?.updateValueAndValidity();
    this.manualForm.get('codigoPulsera')?.updateValueAndValidity();


    await this.loadEmpresas();
    this.loadJornadaActiva();
    this.pushNotification(
      'info',
      'Listo para registrar',
      'Seleccione la empresa y el area antes de agregar usuarios.'
    );
  }

  async loadFunciones() {
    try {
      this.funciones = await this.funcionesService.getFunciones();
      console.log('Funciones cargadas:', this.funciones);
    } catch (error) {
      console.error('Error cargando funciones:', error);
      this.funciones = [];
    }
  }

  downloadTemplate() {
    const url = 'files/Archivo_definitivo.xlsx';
    const filename = 'Archivo_definitivo.xlsx';

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  }
  onlyNumbers(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;

    // Permite solo números (0–9)
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }



  private processParsedUsers(rows: any[]) {
    const errors: string[] = [];
    const parsedUsers: any[] = [];

    rows.forEach((row, index) => {
      const user: any = {};

      Object.keys(row).forEach((key) => {
        let value = String(row[key] ?? '').trim();

        if (key === 'email') {
          value = value
            .replace(/^=HYPERLINK\("mailto:/i, '')
            .replace(/".*$/, '')
            .replace(/"/g, '');
        }

        if (key === 'funcion') {
          const funcionEncontrada = this.funciones.find(
            (f) => f.nombre.toLowerCase() === value.toLowerCase()
          );

          if (!funcionEncontrada) {
            errors.push(
              `Linea ${index + 2}: la funcion "${value}" no existe`
            );
          } else {
            user.funcion = funcionEncontrada.id;
          }
          return;
        }

        user[key] = value;
      });

      parsedUsers.push(user);
    });

    if (errors.length) {
      this.isParsing = false;
      this.pushNotification(
        'error',
        'Archivo con errores',
        `${errors[0]}${errors.length > 1 ? ` (+${errors.length - 1} más)` : ''}`
      );
      return;
    }

    this.previewUsers = [...this.previewUsers, ...parsedUsers];
    this.isParsing = false;
    this.pushNotification(
      'success',
      'Archivo cargado',
      `Se agregaron ${parsedUsers.length} usuarios a la lista.`
    );
  }

  private fileReadError() {
    this.isParsing = false;
    this.pushNotification(
      'error',
      'Error al leer',
      'No se pudo leer el archivo seleccionado.'
    );
  }
  parseXLSX(buffer: ArrayBuffer) {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convierte la hoja a JSON usando encabezados
    const rows = XLSX.utils.sheet_to_json<any>(worksheet, {
      defval: '',
      raw: false,
    });

    if (!rows.length) {
      this.isParsing = false;
      this.pushNotification(
        'error',
        'Archivo vacío',
        'El archivo XLSX no contiene registros.'
      );
      return;
    }

    this.processParsedUsers(rows);
  }



  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    this.selectedFileName = file.name;
    this.isParsing = true;

    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
      const reader = new FileReader();
      reader.onload = () => this.parseCSV(reader.result as string);
      reader.onerror = () => this.fileReadError();
      reader.readAsText(file);
    }
    else if (extension === 'xlsx') {
      const reader = new FileReader();
      reader.onload = (e: any) => this.parseXLSX(e.target.result);
      reader.onerror = () => this.fileReadError();
      reader.readAsArrayBuffer(file);
    }
    else {
      this.isParsing = false;
      this.pushNotification(
        'error',
        'Formato no soportado',
        'Solo se permiten archivos CSV o XLSX.'
      );
    }
  }


  parseCSV(csv: string) {
    const errors: string[] = [];
    const parsedUsers: any[] = [];

    const lines = csv
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'));

    if (!lines.length) {
      this.isParsing = false;
      this.pushNotification(
        'error',
        'Archivo vacio',
        'El archivo CSV no contiene registros.'
      );
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim());

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
            (f) => f.nombre.toLowerCase() === value.toLowerCase()
          );

          if (!funcionEncontrada) {
            errors.push(`Linea ${index + 2}: la funcion "${value}" no existe`);
          } else {
            user.funcion = funcionEncontrada.id;
          }
          return;
        }

        user[h] = value;
      });

      parsedUsers.push(user);
    });

    if (errors.length) {
      this.pushNotification(
        'error',
        'Archivo con errores',
        `${errors[0]}${errors.length > 1 ? ` (+${errors.length - 1} mas)` : ''}`
      );
      this.isParsing = false;
      return;
    }

    this.previewUsers = [...this.previewUsers, ...parsedUsers];
    this.isParsing = false;
    this.processParsedUsers(parsedUsers);
    this.pushNotification(
      'success',
      'Archivo cargado',
      `Se agregaron ${parsedUsers.length} usuarios a la lista.`
    );
  }

  addManualUser(): void {
    if (this.manualForm.invalid || !this.jornadaActiva) {
      this.pushNotification(
        'error',
        'No se pudo agregar',
        !this.jornadaActiva
          ? 'No existe una jornada activa.'
          : 'Completa correctamente el formulario.'
      );
      return;
    }

    const user = {
      // Datos del formulario
      nombre: this.manualForm.value.nombre,
      apellidoPaterno: this.manualForm.value.apellidoPaterno,
      apellidoMaterno: this.manualForm.value.apellidoMaterno,
      funcion: this.manualForm.value.funcion,
      telefono: this.manualForm.value.telefono,
      email: this.manualForm.value.email, // ✅ CORRECTO

      // Contexto
      areaId: this.areaForm.value.areaId,
      empresaId: this.empresaForm.value.empresaId || null,

      // Jornada automática
      jornada: this.jornadaActiva.jornada, // ✅ EXISTE

      // Metadata
      fechaRegistro: new Date().toISOString(),
    };

    // Mostrar inmediatamente en la tabla
    this.previewUsers = [...this.previewUsers, user];

    // Limpiar formulario
    this.manualForm.reset();

    this.pushNotification(
      'success',
      'Usuario agregado',
      `Asignado a la jornada ${this.jornadaActiva.jornada}`
    );
  }

  async submitSingleUserFromManual(): Promise<void> {
    // 🔎 Validación formulario
    if (this.manualForm.invalid) {
      this.manualForm.markAllAsTouched();
      this.pushNotification(
        'error',
        'Campos incompletos',
        'Complete correctamente el formulario.'
      );
      return;
    }

    // 🔎 Validación área
    if (this.areaForm.invalid) {
      this.pushNotification(
        'error',
        'Área requerida',
        'Seleccione un área para continuar.'
      );
      return;
    }

    // 🔎 Validación jornada
    if (!this.jornadaActiva) {
      this.pushNotification(
        'error',
        'Sin jornada activa',
        'No existe una jornada activa para registrar usuarios.'
      );
      return;
    }

    // 🔎 Validación sesión
    const authUser = this.authService.getCurrentUser();
    if (!authUser?.email) {
      this.pushNotification(
        'error',
        'Sesión no válida',
        'Inicie sesión nuevamente.'
      );
      return;
    }

    this.isSubmitting = true;

    try {
      // 📌 Usuario que registra
      const leaderData = await this.usersService.getUserByEmail(authUser.email);

      // 📌 Determinar empresa
      let empresaIdFinal: string | undefined;

      if (this.canSelectEmpresa) {
        empresaIdFinal = this.empresaForm.value.empresaId ?? undefined;

        if (!empresaIdFinal) {
          this.pushNotification(
            'error',
            'Empresa requerida',
            'Seleccione una empresa.'
          );
          return;
        }
      } else {
        empresaIdFinal = leaderData?.empresaId;
      }

      if (!empresaIdFinal) {
        throw new Error('Empresa no definida');
      }

      const formValue = this.manualForm.value;

      // 🧱 Objeto FINAL que se guarda en Firebase
      const userData: any = {
        nombre: formValue.nombre,
        apellidoPaterno: formValue.apellidoPaterno,
        apellidoMaterno: formValue.apellidoMaterno,
        funcion: formValue.funcion,
        telefono: formValue.telefono,

        areaId: this.areaForm.value.areaId,
        empresaId: empresaIdFinal,

        // ✅ AQUÍ FALTA LA JORNADA - ESTE ES EL PROBLEMA
        jornada: this.jornadaActiva?.jornada, // ← AÑADE ESTA LÍNEA
        // O si prefieres el objeto completo:
        // jornadaActiva: this.jornadaActiva,

        estatus: this.isHamcoUser ? 'canjeado' : 'aprobado',
      };

      // 🔀 Hamco vs Normal
      if (this.isHamcoUser) {
        userData.codigoPulsera = formValue.codigoPulsera;
      } else {
        userData.email = formValue.email;
      }

      // 👮 Solo AdminEspecial
      if (this.canSelectEmpresa) {
        userData.reviewedBy = authUser.email;
        userData.reviewedAt = new Date();
      }

      // 💾 Guardar en Firestore
      await this.usersAccessService.createUser(userData, authUser.email);

      // 🧹 Limpiar formulario
      this.manualForm.reset();

      this.pushNotification(
        'success',
        'Usuario registrado',
        'El usuario fue registrado correctamente.'
      );
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      this.pushNotification(
        'error',
        'Error al registrar',
        'No se pudo registrar el usuario.'
      );
    } finally {
      this.isSubmitting = false;
    }
  }




  async submitAll() {
    if (this.areaForm.invalid) {
      this.pushNotification(
        'error',
        'Area requerida',
        'Seleccione un area para continuar.'
      );
      return;
    }

    const authUser = this.authService.getCurrentUser();
    if (!authUser?.email) {
      this.pushNotification(
        'error',
        'Sesion no valida',
        'Inicie sesion nuevamente para continuar.'
      );
      return;
    }

    this.isSubmitting = true;
    const leaderData = await this.usersService.getUserByEmail(authUser.email);

    let empresaIdFinal: string | undefined;

    if (this.canSelectEmpresa) {
      empresaIdFinal = this.empresaForm.value.empresaId ?? undefined;
      if (!empresaIdFinal) {
        this.pushNotification(
          'error',
          'Empresa requerida',
          'Seleccione una empresa para enviar las solicitudes.'
        );
        this.isSubmitting = false;
        return;
      }
    } else {
      empresaIdFinal = leaderData?.empresaId;
    }

    if (!empresaIdFinal) {
      this.pushNotification(
        'error',
        'Empresa no disponible',
        'No se pudo determinar la empresa asignada.'
      );
      this.isSubmitting = false;
      return;
    }

    try {
      for (const u of this.previewUsers) {
        const userData: any = {
          ...u,
          areaId: this.areaForm.value.areaId,
          empresaId: empresaIdFinal,
          // ✅ AQUÍ TAMBIÉN FALTA LA JORNADA
          jornada: this.jornadaActiva?.jornada, // ← AÑADE ESTA LÍNEA
          estatus: this.isHamcoUser ? 'canjeado' : 'aprobado',
        };

        // Solo si es AdminEspecial
        if (this.canSelectEmpresa) {
          userData.reviewedBy = authUser.email;
          userData.reviewedAt = new Date();
        }

        await this.usersAccessService.createUser(userData, authUser.email);
      }

      this.previewUsers = [];
      this.pushNotification(
        'success',
        'Solicitudes enviadas',
        'Las solicitudes fueron enviadas correctamente.'
      );
    } catch (error) {
      console.error('Error al enviar solicitudes:', error);
      this.pushNotification(
        'error',
        'Error al enviar',
        'Ocurrio un problema al enviar las solicitudes.'
      );
    } finally {
      this.isSubmitting = false;
    }
  }

  private pushNotification(
    type: 'success' | 'error' | 'info',
    title: string,
    message: string
  ) {
    const iconMap = {
      success: 'check_circle',
      error: 'error_outline',
      info: 'info',
    } as const;

    const note = {
      id: ++this.notificationId,
      type,
      title,
      message,
      icon: iconMap[type],
    };

    this.notifications = [note, ...this.notifications].slice(0, 3);
    setTimeout(() => this.dismissNotification(note.id), 6000);
  }

  dismissNotification(id: number) {
    this.notifications = this.notifications.filter((note) => note.id !== id);
  }
}
