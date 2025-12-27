import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import {
  MatDialogModule,
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth, fetchSignInMethodsForEmail } from '@angular/fire/auth';
import { AuthService } from '../../core/services/auth.service';
import { AuthAdminService } from '../../core/services/auth-admin.service';
import { UsersService, User } from '../../core/services/users.service';
import { RolesService, Role } from '../../core/services/roles.service';
import { EmpresasService, Empresa } from '../../core/services/empresas.service';
import { AreasService, Area } from '../../core/services/areas.service';
import {
  FuncionesService,
  Funcion,
} from '../../core/services/funciones.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTabsModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    MatListModule,
    MatCheckboxModule,
    MatTooltipModule,
  ],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <div class="max-w-7xl mx-auto">
        <div class="flex justify-between items-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Super Admin Panel</h1>
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

        <mat-tab-group class="bg-white rounded-lg shadow">
          <!-- TAB USUARIOS -->
          <mat-tab label="Usuarios">
            <div class="p-6">
              <h2 class="text-xl font-semibold mb-4">Crear Usuario</h2>
              <form
                [formGroup]="userForm"
                (ngSubmit)="createUser()"
                class="space-y-4 mb-8"
              >
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <mat-form-field class="w-full">
                    <mat-label>Email</mat-label>
                    <input
                      matInput
                      formControlName="email"
                      type="email"
                      (input)="onEmailInput()"
                    />
                    @if (userForm.get('email')?.hasError('required')) {
                    <mat-error>Email requerido</mat-error>
                    } @if (userForm.get('email')?.hasError('email')) {
                    <mat-error>Email inválido</mat-error>
                    } @if (emailValidationMessage) {
                    <mat-hint
                      [class]="
                        emailValidationMessage.includes('✓')
                          ? 'text-green-600'
                          : emailValidationMessage.includes(
                              'ya está registrado'
                            )
                          ? 'text-red-600'
                          : 'text-gray-600'
                      "
                    >
                      {{ emailValidationMessage }}
                    </mat-hint>
                    }
                  </mat-form-field>

                  <mat-form-field class="w-full">
                    <mat-label>Password</mat-label>
                    <input
                      matInput
                      formControlName="password"
                      type="password"
                    />
                    @if (userForm.get('password')?.hasError('required')) {
                    <mat-error>Password requerido</mat-error>
                    } @if (userForm.get('password')?.hasError('minlength')) {
                    <mat-error>Mínimo 6 caracteres</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field class="w-full">
                    <mat-label>Apodo</mat-label>
                    <input matInput formControlName="apodo" />
                  </mat-form-field>

                  <mat-form-field class="w-full">
                    <mat-label>Rol</mat-label>
                    <mat-select
                      formControlName="role"
                      (selectionChange)="onRoleChange()"
                    >
                      @for (role of roles; track role.id) {
                      <mat-option [value]="role.id">{{ role.name }}</mat-option>
                      }
                    </mat-select>
                    @if (userForm.get('role')?.hasError('required')) {
                    <mat-error>Rol requerido</mat-error>
                    }
                  </mat-form-field>

                  @if (!hideEmpresaAndAreasFields) {
                  <mat-form-field class="w-full">
                    <mat-label>Empresa</mat-label>
                    <mat-select formControlName="empresaId">
                      @for (empresa of empresas; track empresa.id) {
                      <mat-option [value]="empresa.id">{{
                        empresa.nombre
                      }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field class="w-full">
                    <mat-label>Áreas</mat-label>
                    <mat-select formControlName="areaIds" multiple>
                      @for (area of areas; track area.id) {
                      <mat-option [value]="area.id">{{
                        area.nombre
                      }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                  } @if (showFuncionesField) {
                  <mat-form-field class="w-full md:col-span-2">
                    <mat-label>Funciones (para AdminArea)</mat-label>
                    <mat-select formControlName="funcionIds" multiple>
                      @for (funcion of funciones; track funcion.id) {
                      <mat-option [value]="funcion.id">{{
                        funcion.nombre
                      }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                  }
                </div>

                <div class="flex justify-end">
                  <button
                    mat-raised-button
                    color="primary"
                    type="submit"
                    [disabled]="userForm.invalid || creatingUser"
                  >
                    {{ creatingUser ? 'Creando...' : 'Crear Usuario' }}
                  </button>
                </div>
              </form>

              <h2 class="text-xl font-semibold mb-4">Lista de Usuarios</h2>
              <div class="overflow-x-auto">
                <table mat-table [dataSource]="users" class="w-full">
                  <ng-container matColumnDef="email">
                    <th mat-header-cell *matHeaderCellDef class="font-semibold">
                      Email
                    </th>
                    <td mat-cell *matCellDef="let user">{{ user.email }}</td>
                  </ng-container>

                  <ng-container matColumnDef="apodo">
                    <th mat-header-cell *matHeaderCellDef class="font-semibold">
                      Apodo
                    </th>
                    <td mat-cell *matCellDef="let user">
                      {{ user.apodo || '-' }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="role">
                    <th mat-header-cell *matHeaderCellDef class="font-semibold">
                      Rol
                    </th>
                    <td mat-cell *matCellDef="let user">
                      {{ getRoleName(user.role) }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="empresa">
                    <th mat-header-cell *matHeaderCellDef class="font-semibold">
                      Empresa
                    </th>
                    <td mat-cell *matCellDef="let user">
                      {{ getEmpresaName(user.empresaId) }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="areas">
                    <th mat-header-cell *matHeaderCellDef class="font-semibold">
                      Áreas
                    </th>
                    <td mat-cell *matCellDef="let user">
                      <mat-chip-set>
                        @for (areaId of user.areaIds || []; track areaId) {
                        <mat-chip>{{ getAreaName(areaId) }}</mat-chip>
                        }
                      </mat-chip-set>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="funciones">
                    <th mat-header-cell *matHeaderCellDef class="font-semibold">
                      Funciones
                    </th>
                    <td mat-cell *matCellDef="let user">
                      @if (user.funcionIds && user.funcionIds.length > 0) {
                      <mat-chip-set>
                        @for (funcionId of user.funcionIds; track funcionId) {
                        <mat-chip>{{ getFuncionName(funcionId) }}</mat-chip>
                        }
                      </mat-chip-set>
                      } @else {
                      <span class="text-gray-400">-</span>
                      }
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef class="font-semibold">
                      Acciones
                    </th>
                    <td mat-cell *matCellDef="let user">
                      <button
                        mat-icon-button
                        color="primary"
                        (click)="editUserApodo(user)"
                        matTooltip="Editar apodo"
                      >
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button
                        mat-icon-button
                        color="warn"
                        (click)="deleteUser(user.id!)"
                        matTooltip="Eliminar"
                      >
                        <mat-icon>delete</mat-icon>
                      </button>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="userColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: userColumns"></tr>
                </table>
              </div>
            </div>
          </mat-tab>

          <!-- TAB ROLES -->
          <mat-tab label="Roles">
            <div class="p-6">
              <h2 class="text-xl font-semibold mb-4">Crear Rol</h2>
              <form
                [formGroup]="roleForm"
                (ngSubmit)="createRole()"
                class="space-y-4 mb-8"
              >
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <mat-form-field class="w-full">
                    <mat-label>Nombre</mat-label>
                    <input matInput formControlName="name" />
                    @if (roleForm.get('name')?.hasError('required')) {
                    <mat-error>Nombre requerido</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field class="w-full">
                    <mat-label>Descripción</mat-label>
                    <input matInput formControlName="description" />
                  </mat-form-field>
                </div>

                <div class="flex justify-end">
                  <button
                    mat-raised-button
                    color="primary"
                    type="submit"
                    [disabled]="roleForm.invalid"
                  >
                    Crear Rol
                  </button>
                </div>
              </form>

              <h2 class="text-xl font-semibold mb-4">Lista de Roles</h2>
              <div class="overflow-x-auto">
                <table mat-table [dataSource]="roles" class="w-full">
                  <ng-container matColumnDef="name">
                    <th mat-header-cell *matHeaderCellDef class="font-semibold">
                      Nombre
                    </th>
                    <td mat-cell *matCellDef="let role">{{ role.name }}</td>
                  </ng-container>

                  <ng-container matColumnDef="description">
                    <th mat-header-cell *matHeaderCellDef class="font-semibold">
                      Descripción
                    </th>
                    <td mat-cell *matCellDef="let role">
                      {{ role.description || '-' }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef class="font-semibold">
                      Acciones
                    </th>
                    <td mat-cell *matCellDef="let role">
                      <button
                        mat-icon-button
                        color="warn"
                        (click)="deleteRole(role.id!)"
                      >
                        <mat-icon>delete</mat-icon>
                      </button>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="roleColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: roleColumns"></tr>
                </table>
              </div>
            </div>
          </mat-tab>

          <!-- TAB EMPRESAS -->
          <mat-tab label="Empresas">
            <div class="p-6">
              <h2 class="text-xl font-semibold mb-4">Crear Empresa</h2>
              <form
                [formGroup]="empresaForm"
                (ngSubmit)="createEmpresa()"
                class="space-y-4 mb-8"
              >
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <mat-form-field class="w-full">
                    <mat-label>Nombre</mat-label>
                    <input matInput formControlName="nombre" />
                    @if (empresaForm.get('nombre')?.hasError('required')) {
                    <mat-error>Nombre requerido</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field class="w-full">
                    <mat-label>Descripción</mat-label>
                    <input matInput formControlName="descripcion" />
                  </mat-form-field>
                </div>

                <div class="flex justify-end">
                  <button
                    mat-raised-button
                    color="primary"
                    type="submit"
                    [disabled]="empresaForm.invalid"
                  >
                    Crear Empresa
                  </button>
                </div>
              </form>

              <h2 class="text-xl font-semibold mb-4">Lista de Empresas</h2>
              <div class="overflow-x-auto">
                <table mat-table [dataSource]="empresas" class="w-full">
                  <ng-container matColumnDef="nombre">
                    <th mat-header-cell *matHeaderCellDef class="font-semibold">
                      Nombre
                    </th>
                    <td mat-cell *matCellDef="let empresa">
                      {{ empresa.nombre }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="descripcion">
                    <th mat-header-cell *matHeaderCellDef class="font-semibold">
                      Descripción
                    </th>
                    <td mat-cell *matCellDef="let empresa">
                      {{ empresa.descripcion || '-' }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef class="font-semibold">
                      Acciones
                    </th>
                    <td mat-cell *matCellDef="let empresa">
                      <button
                        mat-icon-button
                        color="warn"
                        (click)="deleteEmpresa(empresa.id!)"
                      >
                        <mat-icon>delete</mat-icon>
                      </button>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="empresaColumns"></tr>
                  <tr
                    mat-row
                    *matRowDef="let row; columns: empresaColumns"
                  ></tr>
                </table>
              </div>
            </div>
          </mat-tab>

          <!-- TAB ÁREAS -->
          <mat-tab label="Áreas">
            <div class="p-6">
              <h2 class="text-xl font-semibold mb-4">Crear Área</h2>
              <form
                [formGroup]="areaForm"
                (ngSubmit)="createArea()"
                class="space-y-4 mb-8"
              >
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <mat-form-field class="w-full">
                    <mat-label>Nombre</mat-label>
                    <input matInput formControlName="nombre" />
                    @if (areaForm.get('nombre')?.hasError('required')) {
                    <mat-error>Nombre requerido</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field class="w-full">
                    <mat-label>Descripción</mat-label>
                    <input matInput formControlName="descripcion" />
                  </mat-form-field>

                  <mat-form-field class="w-full">
                    <mat-label>Empresa</mat-label>
                    <mat-select formControlName="empresaId">
                      @for (empresa of empresas; track empresa.id) {
                      <mat-option [value]="empresa.id">{{
                        empresa.nombre
                      }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                </div>

                <div class="flex justify-end">
                  <button
                    mat-raised-button
                    color="primary"
                    type="submit"
                    [disabled]="areaForm.invalid"
                  >
                    Crear Área
                  </button>
                </div>
              </form>

              <h2 class="text-xl font-semibold mb-4">Lista de Áreas</h2>
              <div class="overflow-x-auto">
                <table mat-table [dataSource]="areas" class="w-full">
                  <ng-container matColumnDef="nombre">
                    <th mat-header-cell *matHeaderCellDef class="font-semibold">
                      Nombre
                    </th>
                    <td mat-cell *matCellDef="let area">{{ area.nombre }}</td>
                  </ng-container>

                  <ng-container matColumnDef="descripcion">
                    <th mat-header-cell *matHeaderCellDef class="font-semibold">
                      Descripción
                    </th>
                    <td mat-cell *matCellDef="let area">
                      {{ area.descripcion || '-' }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="empresa">
                    <th mat-header-cell *matHeaderCellDef class="font-semibold">
                      Empresa
                    </th>
                    <td mat-cell *matCellDef="let area">
                      {{ getEmpresaName(area.empresaId) }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef class="font-semibold">
                      Acciones
                    </th>
                    <td mat-cell *matCellDef="let area">
                      <button
                        mat-icon-button
                        color="warn"
                        (click)="deleteArea(area.id!)"
                      >
                        <mat-icon>delete</mat-icon>
                      </button>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="areaColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: areaColumns"></tr>
                </table>
              </div>
            </div>
          </mat-tab>

          <!-- TAB FUNCIONES -->
          <mat-tab label="Funciones">
            <div class="p-6">
              <h2 class="text-xl font-semibold mb-4">Crear Función</h2>
              <form
                [formGroup]="funcionForm"
                (ngSubmit)="createFuncion()"
                class="space-y-4 mb-8"
              >
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <mat-form-field class="w-full">
                    <mat-label>Nombre</mat-label>
                    <input matInput formControlName="nombre" />
                    @if (funcionForm.get('nombre')?.hasError('required')) {
                    <mat-error>Nombre requerido</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field class="w-full">
                    <mat-label>Descripción</mat-label>
                    <input matInput formControlName="descripcion" />
                  </mat-form-field>
                </div>

                <div class="flex justify-end">
                  <button
                    mat-raised-button
                    color="primary"
                    type="submit"
                    [disabled]="funcionForm.invalid"
                  >
                    Crear Función
                  </button>
                </div>
              </form>

              <h2 class="text-xl font-semibold mb-4">Lista de Funciones</h2>
              <div class="overflow-x-auto">
                <table mat-table [dataSource]="funciones" class="w-full">
                  <ng-container matColumnDef="nombre">
                    <th mat-header-cell *matHeaderCellDef class="font-semibold">
                      Nombre
                    </th>
                    <td mat-cell *matCellDef="let funcion">
                      {{ funcion.nombre }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="descripcion">
                    <th mat-header-cell *matHeaderCellDef class="font-semibold">
                      Descripción
                    </th>
                    <td mat-cell *matCellDef="let funcion">
                      {{ funcion.descripcion || '-' }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef class="font-semibold">
                      Acciones
                    </th>
                    <td mat-cell *matCellDef="let funcion">
                      <button
                        mat-icon-button
                        color="warn"
                        (click)="deleteFuncion(funcion.id!)"
                      >
                        <mat-icon>delete</mat-icon>
                      </button>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="funcionColumns"></tr>
                  <tr
                    mat-row
                    *matRowDef="let row; columns: funcionColumns"
                  ></tr>
                </table>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>
  `,
  styles: [
    `
      ::ng-deep .mat-mdc-tab-body-content {
        overflow: visible !important;
      }
    `,
  ],
})
export class UserManagementComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private auth = inject(Auth);
  private authService = inject(AuthService);
  private authAdminService = inject(AuthAdminService);
  private usersService = inject(UsersService);
  private rolesService = inject(RolesService);
  private empresasService = inject(EmpresasService);
  private areasService = inject(AreasService);
  private funcionesService = inject(FuncionesService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  userForm!: FormGroup;
  roleForm!: FormGroup;
  empresaForm!: FormGroup;
  areaForm!: FormGroup;
  funcionForm!: FormGroup;

  users: User[] = [];
  roles: Role[] = [];
  empresas: Empresa[] = [];
  areas: Area[] = [];
  funciones: Funcion[] = [];

  creatingUser = false;
  showFuncionesField = false;
  hideEmpresaAndAreasFields = false;
  emailValidationMessage = '';

  userColumns = [
    'email',
    'apodo',
    'role',
    'empresa',
    'areas',
    'funciones',
    'actions',
  ];
  roleColumns = ['name', 'description', 'actions'];
  empresaColumns = ['nombre', 'descripcion', 'actions'];
  areaColumns = ['nombre', 'descripcion', 'empresa', 'actions'];
  funcionColumns = ['nombre', 'descripcion', 'actions'];

  ngOnInit() {
    this.initForms();
    this.loadData();
  }

  initForms() {
    this.userForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      apodo: [''],
      role: ['', Validators.required],
      empresaId: [''],
      areaIds: [[]],
      funcionIds: [[]],
    });

    this.roleForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
    });

    this.empresaForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
    });

    this.areaForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      empresaId: [''],
    });

    this.funcionForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
    });
  }

  async loadData() {
    try {
      [this.users, this.roles, this.empresas, this.areas, this.funciones] =
        await Promise.all([
          this.usersService.getUsers(),
          this.rolesService.getRoles(),
          this.empresasService.getEmpresas(),
          this.areasService.getAreas(),
          this.funcionesService.getFunciones(),
        ]);
    } catch (error) {
      this.showError('Error cargando datos');
    }
  }

  onRoleChange() {
    const selectedRoleId = this.userForm.get('role')?.value;
    const selectedRole = this.roles.find((r) => r.id === selectedRoleId);
    this.showFuncionesField = selectedRole?.name === 'AdminArea';
    this.hideEmpresaAndAreasFields = selectedRole?.name === 'AdminEspecial';

    // Limpiar campos cuando es AdminEspecial
    if (this.hideEmpresaAndAreasFields) {
      this.userForm.patchValue({
        empresaId: '',
        areaIds: [],
        funcionIds: [],
      });
    }

    if (!this.showFuncionesField) {
      this.userForm.patchValue({ funcionIds: [] });
    }
  }

  onEmailInput() {
    // Resetear estado
    this.emailValidationMessage = '';

    const emailControl = this.userForm.get('email');
    const email = emailControl?.value?.trim();

    // Validación básica de formato
    if (!email) {
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return;
    }

    // Verificar si ya existe en el sistema local (Firestore)
    const existingUser = this.users.find(
      (u: User) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      this.emailValidationMessage =
        'Este email ya está registrado en el sistema';
    }
  }

  async createUser() {
    if (this.userForm.invalid) return;

    this.creatingUser = true;
    try {
      const formValue = this.userForm.value;
      let userExistedInAuth = false;

      // Intentar crear en Firebase Auth
      try {
        await this.authAdminService.createUser(
          formValue.email,
          formValue.password
        );
      } catch (authError: any) {
        console.log('Error de Auth:', authError);
        // Si el error es porque el email ya existe en Auth, continuamos sin contraseña
        if (
          authError.code === 'auth/email-already-in-use' ||
          authError.code === 'auth/email-already-exists' ||
          authError.message?.toLowerCase().includes('already in use') ||
          authError.message?.toLowerCase().includes('already exists') ||
          authError.message?.toLowerCase().includes('ya está registrado')
        ) {
          userExistedInAuth = true;
          console.log('Usuario ya existe en Auth, vinculando metadata...');
        } else {
          // Si es otro error, lo lanzamos
          throw authError;
        }
      }

      // Verificar si el rol es AdminEspecial para asignar todos los permisos
      const selectedRole = this.roles.find((r) => r.id === formValue.role);
      let areaIds = formValue.areaIds || [];
      let funcionIds = formValue.funcionIds || [];

      if (selectedRole?.name === 'AdminEspecial') {
        // AdminEspecial tiene acceso a todas las áreas y funciones
        areaIds = this.areas.map((area) => area.id!);
        funcionIds = this.funciones.map((funcion) => funcion.id!);
        console.log(
          'AdminEspecial detectado: asignando todas las áreas y funciones'
        );
      }

      // Construir objeto de usuario solo con campos válidos (Firestore no acepta undefined)
      const userData: any = {
        email: formValue.email,
        role: formValue.role,
        areaIds: areaIds,
        funcionIds: funcionIds,
      };

      // Solo agregar campos opcionales si tienen valores
      if (formValue.apodo) {
        userData.apodo = formValue.apodo;
      }
      if (formValue.empresaId) {
        userData.empresaId = formValue.empresaId;
      }

      // Guardar metadata en Firestore
      await this.usersService.createUser(userData);

      const message = userExistedInAuth
        ? 'Usuario vinculado exitosamente (ya existía en Firebase Auth)'
        : 'Usuario creado exitosamente';
      this.showSuccess(message);

      this.userForm.reset();
      this.showFuncionesField = false;
      this.hideEmpresaAndAreasFields = false;
      this.emailValidationMessage = '';
      await this.loadData();
    } catch (error: any) {
      this.showError(error.message || 'Error creando usuario');
    } finally {
      this.creatingUser = false;
    }
  }

  async createRole() {
    if (this.roleForm.invalid) return;

    try {
      await this.rolesService.createRole(this.roleForm.value);
      this.showSuccess('Rol creado exitosamente');
      this.roleForm.reset();
      await this.loadData();
    } catch (error) {
      this.showError('Error creando rol');
    }
  }

  async createEmpresa() {
    if (this.empresaForm.invalid) return;

    try {
      await this.empresasService.createEmpresa(this.empresaForm.value);
      this.showSuccess('Empresa creada exitosamente');
      this.empresaForm.reset();
      await this.loadData();
    } catch (error) {
      this.showError('Error creando empresa');
    }
  }

  async createArea() {
    if (this.areaForm.invalid) return;

    try {
      await this.areasService.createArea(this.areaForm.value);
      this.showSuccess('Área creada exitosamente');
      this.areaForm.reset();
      await this.loadData();
    } catch (error) {
      this.showError('Error creando área');
    }
  }

  async deleteUser(userId: string) {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;

    try {
      await this.usersService.deleteUser(userId);
      this.showSuccess('Usuario eliminado');
      await this.loadData();
    } catch (error) {
      this.showError('Error eliminando usuario');
    }
  }

  async deleteRole(roleId: string) {
    if (!confirm('¿Estás seguro de eliminar este rol?')) return;

    try {
      // Verificar si el rol está en uso
      const usersWithRole = this.users.filter((u) => u.role === roleId);
      if (usersWithRole.length > 0) {
        this.showError(
          `No se puede eliminar el rol. Está asignado a ${usersWithRole.length} usuario(s)`
        );
        return;
      }

      await this.rolesService.deleteRole(roleId);
      this.showSuccess('Rol eliminado');
      await this.loadData();
    } catch (error) {
      this.showError('Error eliminando rol');
    }
  }

  async deleteEmpresa(empresaId: string) {
    if (!confirm('¿Estás seguro de eliminar esta empresa?')) return;

    try {
      // Verificar si la empresa está en uso por usuarios
      const usersWithEmpresa = this.users.filter(
        (u) => u.empresaId === empresaId
      );
      if (usersWithEmpresa.length > 0) {
        this.showError(
          `No se puede eliminar la empresa. Está asignada a ${usersWithEmpresa.length} usuario(s)`
        );
        return;
      }

      // Verificar si la empresa está en uso por áreas
      const areasWithEmpresa = this.areas.filter(
        (a) => a.empresaId === empresaId
      );
      if (areasWithEmpresa.length > 0) {
        this.showError(
          `No se puede eliminar la empresa. Tiene ${areasWithEmpresa.length} área(s) asociada(s)`
        );
        return;
      }

      await this.empresasService.deleteEmpresa(empresaId);
      this.showSuccess('Empresa eliminada');
      await this.loadData();
    } catch (error) {
      this.showError('Error eliminando empresa');
    }
  }

  async deleteArea(areaId: string) {
    if (!confirm('¿Estás seguro de eliminar esta área?')) return;

    try {
      // Verificar si el área está en uso por usuarios
      const usersWithArea = this.users.filter(
        (u) => u.areaIds && u.areaIds.includes(areaId)
      );
      if (usersWithArea.length > 0) {
        this.showError(
          `No se puede eliminar el área. Está asignada a ${usersWithArea.length} usuario(s)`
        );
        return;
      }

      await this.areasService.deleteArea(areaId);
      this.showSuccess('Área eliminada');
      await this.loadData();
    } catch (error) {
      this.showError('Error eliminando área');
    }
  }

  getRoleName(roleId: string): string {
    const role = this.roles.find((r) => r.id === roleId);
    return role ? role.name : '-';
  }

  getEmpresaName(empresaId?: string): string {
    if (!empresaId) return '-';
    const empresa = this.empresas.find((e) => e.id === empresaId);
    return empresa ? empresa.nombre : '-';
  }

  getAreaName(areaId: string): string {
    const area = this.areas.find((a) => a.id === areaId);
    return area ? area.nombre : '-';
  }

  getFuncionName(funcionId: string): string {
    const funcion = this.funciones.find((f) => f.id === funcionId);
    return funcion ? funcion.nombre : '-';
  }

  async createFuncion() {
    if (this.funcionForm.invalid) return;

    try {
      await this.funcionesService.createFuncion(this.funcionForm.value);
      this.showSuccess('Función creada exitosamente');
      this.funcionForm.reset();
      await this.loadData();
    } catch (error) {
      this.showError('Error creando función');
    }
  }

  async deleteFuncion(funcionId: string) {
    if (!confirm('¿Estás seguro de eliminar esta función?')) return;

    try {
      // Verificar si la función está en uso por usuarios
      const usersWithFuncion = this.users.filter(
        (u) => u.funcionIds && u.funcionIds.includes(funcionId)
      );
      if (usersWithFuncion.length > 0) {
        this.showError(
          `No se puede eliminar la función. Está asignada a ${usersWithFuncion.length} usuario(s)`
        );
        return;
      }

      await this.funcionesService.deleteFuncion(funcionId);
      this.showSuccess('Función eliminada');
      await this.loadData();
    } catch (error) {
      this.showError('Error eliminando función');
    }
  }

  editUserApodo(user: User) {
    const dialogRef = this.dialog.open(EditApodoDialogComponent, {
      width: '400px',
      data: { apodo: user.apodo || '' },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result !== undefined && result !== null && user.id) {
        try {
          await this.usersService.updateUser(user.id, { apodo: result });
          this.showSuccess('Apodo actualizado');
          await this.loadData();
        } catch (error) {
          this.showError('Error actualizando apodo');
        }
      }
    });
  }

  private showSuccess(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar'],
    });
  }

  private showError(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
  }

  async logout() {
    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      this.showError('Error al cerrar sesión');
    }
  }
}

// Diálogo para editar apodo
@Component({
  selector: 'app-edit-apodo-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Editar Apodo</h2>
    <mat-dialog-content class="py-4">
      <mat-form-field class="w-full">
        <mat-label>Apodo</mat-label>
        <input matInput [(ngModel)]="apodo" />
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button color="primary" (click)="onSave()">
        Guardar
      </button>
    </mat-dialog-actions>
  `,
})
export class EditApodoDialogComponent {
  apodo: string;
  data = inject(MAT_DIALOG_DATA) as { apodo: string };
  private dialogRef = inject(MatDialogRef<EditApodoDialogComponent>);

  constructor() {
    this.apodo = this.data.apodo;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    this.dialogRef.close(this.apodo);
  }
}
