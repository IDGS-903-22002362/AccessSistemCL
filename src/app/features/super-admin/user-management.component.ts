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
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AuthAdminService } from '../../core/services/auth-admin.service';
import { UsersService, User } from '../../core/services/users.service';
import { RolesService, Role } from '../../core/services/roles.service';
import { EmpresasService, Empresa } from '../../core/services/empresas.service';
import { AreasService, Area } from '../../core/services/areas.service';

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
                    <input matInput formControlName="email" type="email" />
                    @if (userForm.get('email')?.hasError('required')) {
                    <mat-error>Email requerido</mat-error>
                    } @if (userForm.get('email')?.hasError('email')) {
                    <mat-error>Email inválido</mat-error>
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
                    <mat-label>Rol</mat-label>
                    <mat-select formControlName="role">
                      @for (role of roles; track role.id) {
                      <mat-option [value]="role.id">{{ role.name }}</mat-option>
                      }
                    </mat-select>
                    @if (userForm.get('role')?.hasError('required')) {
                    <mat-error>Rol requerido</mat-error>
                    }
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

                  <mat-form-field class="w-full md:col-span-2">
                    <mat-label>Áreas</mat-label>
                    <mat-select formControlName="areaIds" multiple>
                      @for (area of areas; track area.id) {
                      <mat-option [value]="area.id">{{
                        area.nombre
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

                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef class="font-semibold">
                      Acciones
                    </th>
                    <td mat-cell *matCellDef="let user">
                      <button
                        mat-icon-button
                        color="warn"
                        (click)="deleteUser(user.id!)"
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
  private authService = inject(AuthService);
  private authAdminService = inject(AuthAdminService);
  private usersService = inject(UsersService);
  private rolesService = inject(RolesService);
  private empresasService = inject(EmpresasService);
  private areasService = inject(AreasService);
  private snackBar = inject(MatSnackBar);

  userForm!: FormGroup;
  roleForm!: FormGroup;
  empresaForm!: FormGroup;
  areaForm!: FormGroup;

  users: User[] = [];
  roles: Role[] = [];
  empresas: Empresa[] = [];
  areas: Area[] = [];

  creatingUser = false;

  userColumns = ['email', 'role', 'empresa', 'areas', 'actions'];
  roleColumns = ['name', 'description', 'actions'];
  empresaColumns = ['nombre', 'descripcion', 'actions'];
  areaColumns = ['nombre', 'descripcion', 'empresa', 'actions'];

  ngOnInit() {
    this.initForms();
    this.loadData();
  }

  initForms() {
    this.userForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['', Validators.required],
      empresaId: [''],
      areaIds: [[]],
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
  }

  async loadData() {
    try {
      [this.users, this.roles, this.empresas, this.areas] = await Promise.all([
        this.usersService.getUsers(),
        this.rolesService.getRoles(),
        this.empresasService.getEmpresas(),
        this.areasService.getAreas(),
      ]);
    } catch (error) {
      this.showError('Error cargando datos');
    }
  }

  async createUser() {
    if (this.userForm.invalid) return;

    this.creatingUser = true;
    try {
      const formValue = this.userForm.value;

      // Crear usuario en Firebase Auth
      await this.authAdminService.createUser(
        formValue.email,
        formValue.password
      );

      // Guardar metadata en Firestore
      await this.usersService.createUser({
        email: formValue.email,
        role: formValue.role,
        empresaId: formValue.empresaId || undefined,
        areaIds: formValue.areaIds || [],
      });

      this.showSuccess('Usuario creado exitosamente');
      this.userForm.reset();
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
