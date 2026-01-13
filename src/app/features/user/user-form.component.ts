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
import { MatProgressBarModule } from '@angular/material/progress-bar';
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
    MatProgressBarModule,
  ],
  template: `
    <div class="min-h-screen bg-[#F7FBF9] py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="mb-8 bg-[#007A53] p-6 rounded-2xl shadow-sm">
          <div class="flex items-center justify-between">
            <!-- Izquierda: Logo + título -->
            <div class="flex items-center gap-3 text-white">
              <img src="images/leon.png" alt="Club León" class="h-8 w-auto" />
              <h1 class="text-3xl font-bold">Gestión de Usuarios</h1>
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
          <div class="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="step-card">
              <p class="step-title">Paso 1</p>
              <p class="step-label">Empresa</p>
              <p class="step-help" *ngIf="canSelectEmpresa; else empresaAuto">
                Selecciona la empresa para esta solicitud.
              </p>
              <ng-template #empresaAuto>
                <p class="step-help">La empresa se asigna automaticamente.</p>
              </ng-template>
            </div>
            <div class="step-card">
              <p class="step-title">Paso 2</p>
              <p class="step-label">Area</p>
              <p class="step-help">
                Define el area para aplicar los permisos correctos.
              </p>
            </div>
            <div class="step-card">
              <p class="step-title">Paso 3</p>
              <p class="step-label">Registrar</p>
              <p class="step-help">
                Importa un archivo o agrega usuarios manualmente.
              </p>
            </div>
          </div>
        </div>

        <!-- Notificaciones -->
        <div *ngIf="notifications.length" class="notification-stack space-y-3">
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

        <mat-card
          *ngIf="canSelectEmpresa"
          class="mb-8 shadow-lg rounded-2xl overflow-hidden border border-gray-100"
        >
          <div class="bg-[#007A53] px-6 py-4">
            <mat-card-title class="text-white text-xl font-semibold !m-0">
              <mat-icon class="mr-2 align-middle">business</mat-icon>
              Empresa
            </mat-card-title>
          </div>
          <mat-card-content class="p-6 space-y-4">
            <p class="text-sm text-gray-600">
              Este paso solo aplica si tu rol permite elegir empresa.
            </p>
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

                  

                  <mat-option value="OTRA" class="text-[#007A53] font-semibold">
                    ➕ Agregar nueva empresa
                  </mat-option>
                </mat-select>


              </mat-form-field>


              <mat-form-field
                *ngIf="showEmpresaOtra"
                appearance="fill"
                class="w-full mt-4"
              >
                <mat-label>Nombre de la empresa</mat-label>
                <input matInput formControlName="empresaOtra" />
                <mat-error>
                  El nombre de la empresa es requerido
                </mat-error>
              </mat-form-field>

            </form>
          </mat-card-content>
        </mat-card>

        <!-- Sección de selección de área -->
        <mat-card
          class="mb-8 shadow-lg rounded-2xl overflow-hidden border border-gray-100"
        >
          <div class="bg-[#007A53] px-6 py-4">
            <mat-card-title class="text-white text-xl font-semibold !m-0">
              <mat-icon class="mr-2 align-middle">group</mat-icon>
              Pulsera
            </mat-card-title>
          </div>
          <mat-card-content class="p-6">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <p class="text-gray-700 mb-4">
                  Seleccione el area organizacional para registrar usuarios.
                </p>
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
              </div>

              <div class="bg-[#F9FDFA] border border-[#E3EFE9] rounded-xl p-5">
                <h3 class="font-semibold text-[#007A53] mb-3 flex items-center">
                  <mat-icon class="mr-2">lightbulb</mat-icon>
                  Informacion importante
                </h3>
                <ul class="space-y-2 text-sm text-gray-700">
                  <li class="flex items-start">
                    <mat-icon class="text-[#007A53] mr-2 text-sm"
                      >check_circle</mat-icon
                    >
                    <span>Registra usuarios manualmente o por archivo.</span>
                  </li>
                  <li class="flex items-start">
                    <mat-icon class="text-[#007A53] mr-2 text-sm"
                      >check_circle</mat-icon
                    >
                    <span>Las solicitudes se validan automaticamente.</span>
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
          <div class="bg-[#007A53] px-6 py-4">
            <mat-card-title
              class="text-white text-xl font-semibold !m-0 flex items-center justify-between"
            >
              <div>
                <mat-icon class="mr-2 align-middle">cloud_upload</mat-icon>
                Importación Masiva
              </div>
            </mat-card-title>
          </div>
          <mat-card-content class="p-6 space-y-5">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="action-tile">
                <p class="action-title">1. Descarga la plantilla</p>
                <p class="action-help">
                  Usa el formato oficial para evitar errores.
                </p>
                <button
                  mat-raised-button
                  color="primary"
                  class="!bg-[#007A53] hover:!bg-[#006B49] !text-white !font-medium !px-6 !py-3 !rounded-lg !shadow-md transition-all duration-200"
                  (click)="downloadTemplate()"
                >
                  <mat-icon class="mr-2">download_for_offline</mat-icon>
                  Descargar Plantilla
                </button>
              </div>

              <div class="action-tile">
                <p class="action-title">2. Sube el archivo</p>
                <p class="action-help">Max 5MB, formato .XLSX o .CSV.</p>
                <button
                  mat-stroked-button
                  color="primary"
                  class="!border-[#007A53] !text-[#007A53] hover:!bg-[#F3FAF6] !font-medium !px-6 !py-3 !rounded-lg transition-all duration-200"
                  (click)="fileInput.click()"
                  [disabled]="isParsing"
                >
                  <mat-icon class="mr-2" [class.animate-spin]="isParsing">{{
                    isParsing ? 'autorenew' : 'upload_file'
                  }}</mat-icon>
                  {{ isParsing ? 'Procesando' : 'Seleccionar Archivo' }}
                </button>
                <input
                  #fileInput
                  type="file"
                  accept=".csv,.xlsx"
                  hidden
                  (change)="onFileSelected($event)"
                />
              </div>
            </div>

            <div class="bg-white border border-gray-200 rounded-xl p-5">
              <div *ngIf="selectedFileName; else noFile" class="space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center">
                    <mat-icon class="text-[#007A53] mr-3">description</mat-icon>
                    <div>
                      <p class="font-medium text-gray-800">
                        {{ selectedFileName }}
                      </p>
                      <p class="text-xs text-gray-500">
                        Archivo cargado exitosamente
                      </p>
                    </div>
                  </div>
                  <mat-icon class="text-[#007A53]">check_circle</mat-icon>
                </div>
                <div class="flex items-center text-sm text-gray-600">
                  <mat-icon class="text-sm mr-2">schedule</mat-icon>
                  <span>Listo para procesar</span>
                </div>
                <div
                  *ngIf="isParsing"
                  class="flex items-center text-sm text-[#007A53]"
                >
                  <mat-icon class="text-sm mr-2 animate-spin"
                    >autorenew</mat-icon
                  >
                  <span>Validando archivo...</span>
                </div>
              </div>
              <ng-template #noFile>
                <div class="text-center py-4">
                  <mat-icon class="text-gray-400 text-4xl mb-3"
                    >folder_open</mat-icon
                  >
                  <p class="text-gray-500">No hay archivo seleccionado</p>
                  <p class="text-xs text-gray-400 mt-1">
                    Sube un archivo para continuar
                  </p>
                </div>
              </ng-template>
            </div>
          </mat-card-content>
        </mat-card>
        <div class="manual-toggle mb-6">
          <div>
            <p class="text-gray-800 font-semibold">Registro manual</p>
            <p class="text-sm text-gray-500">
              Ideal para pocos usuarios o ajustes rapidos.
            </p>
          </div>
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
          <mat-card-content class="p-6">
            <p class="text-sm text-gray-600 mb-6">
              Completa los campos requeridos y agrega el usuario a la lista.
            </p>
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
              <mat-form-field
                *ngIf="!isHamcoUser"
                appearance="fill"
                class="w-full"
              >
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
                <mat-icon matPrefix class="text-gray-400 mr-2"
                  >confirmation_number</mat-icon
                >
              </mat-form-field>

              <!-- Botón Agregar -->
              <div class="md:col-span-2 lg:col-span-3 flex justify-center mt-4">
                <button
                  type="button"
                  mat-raised-button
                  color="primary"
                  class="!bg-[#007A53] hover:!bg-[#006B49] !text-white !font-medium !px-8 !py-3 !rounded-lg !shadow-lg transition-all duration-200 transform hover:scale-105"
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
          <div class="bg-[#007A53] px-6 py-4">
            <mat-card-title
              class="text-white text-xl font-semibold !m-0 flex items-center justify-between"
            >
              <div>
                <mat-icon class="mr-2 align-middle">list_alt</mat-icon>
                Vista Previa de Usuarios
                <span
                  class="ml-3 bg-white text-[#007A53] text-sm font-medium px-3 py-1 rounded-full"
                >
                  {{ previewUsers.length }}
                  {{ previewUsers.length === 1 ? 'usuario' : 'usuarios' }}
                </span>
              </div>
              <button
                mat-raised-button
                color="accent"
                class="!bg-white !text-[#007A53] hover:!bg-[#F3FAF6] !font-medium"
                (click)="submitAll()"
                [disabled]="isSubmitting"
              >
                <mat-icon class="mr-2" [class.animate-spin]="isSubmitting">{{
                  isSubmitting ? 'autorenew' : 'send'
                }}</mat-icon>
                {{ isSubmitting ? 'Enviando...' : 'Enviar Solicitudes' }}
              </button>
            </mat-card-title>
          </div>
          <mat-card-content class="p-0">
            <div class="overflow-x-auto">
              <table mat-table [dataSource]="pagedUsers" class="w-full">
                <!-- Nombre Column -->
                <ng-container matColumnDef="nombre">
                  <th
                    mat-header-cell
                    *matHeaderCellDef
                    class="font-semibold text-[#007A53] px-6 py-4 bg-white border-b border-[#E6F2EC]"
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
                    class="font-semibold text-[#007A53] px-6 py-4 bg-white border-b border-[#E6F2EC]"
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
                <!-- Código de Pulsera Column -->
                <ng-container matColumnDef="codigoPulsera">
                  <th
                    mat-header-cell
                    *matHeaderCellDef
                    class="font-semibold text-[#007A53] px-6 py-4 bg-white border-b border-[#E6F2EC]"
                  >
                    <div class="flex items-center">
                      <mat-icon class="mr-2 text-sm"
                        >confirmation_number</mat-icon
                      >
                      Código de Pulsera
                    </div>
                  </th>
                  <td
                    mat-cell
                    *matCellDef="let u"
                    class="px-6 py-4 border-t border-gray-100"
                  >
                    <div class="text-gray-900 font-medium">
                      {{ u.codigoPulsera || '—' }}
                    </div>
                  </td>
                </ng-container>

                <!-- Teléfono Column -->
                <ng-container matColumnDef="telefono">
                  <th
                    mat-header-cell
                    *matHeaderCellDef
                    class="font-semibold text-[#007A53] px-6 py-4 bg-white border-b border-[#E6F2EC]"
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
                    class="font-semibold text-[#007A53] px-6 py-4 bg-white border-b border-[#E6F2EC] text-right"
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
                      class="!text-[#007A53] hover:!bg-[#F3FAF6]"
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
                  class="bg-white"
                ></tr>
                <tr
                  mat-row
                  *matRowDef="let row; columns: columns; let even = even"
                  [ngClass]="even ? 'bg-[#F9FDFC]' : ''"
                  class="hover:bg-[#F3FAF6] transition-colors duration-150"
                ></tr>
              </table>
            </div>

            <!-- Paginación (similar al otro componente) -->
            <div
              *ngIf="previewUsers.length > pageSize"
              class="flex justify-center items-center gap-4 mt-4 p-4 border-t border-gray-200"
            >
              <button
                (click)="currentPage = currentPage - 1; updatePagination()"
                [disabled]="currentPage === 1"
                class="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Anterior
              </button>

              <span class="text-sm font-medium">
                Página {{ currentPage }} de {{ totalPages }}
              </span>

              <button
                (click)="currentPage = currentPage + 1; updatePagination()"
                [disabled]="currentPage === totalPages"
                class="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Siguiente
              </button>
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
              importando un archivo XLSX.
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                mat-stroked-button
                class="!border-[#007A53] !text-[#007A53] hover:!bg-[#F3FAF6] !rounded-lg"
                (click)="fileInput.click()"
              >
                <mat-icon class="mr-2">upload_file</mat-icon>
                Subir archivo
              </button>
              <button
                mat-raised-button
                class="!bg-[#007A53] !text-white !rounded-lg hover:!bg-[#006B49]"
                (click)="showManualForm = true"
              >
                <mat-icon class="mr-2">person_add</mat-icon>
                Registro manual
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ng-container *ngIf="isSubmitting">
      <div class="submit-overlay" role="dialog" aria-live="polite">
        <div class="submit-modal">
          <div class="submit-header">
            <div class="submit-icon">
              <mat-icon>cloud_upload</mat-icon>
            </div>
            <div>
              <p class="submit-title">Enviando solicitudes</p>
              <p class="submit-subtitle">{{ submitStatus }}</p>
            </div>
          </div>
          <mat-progress-bar
            color="primary"
            mode="determinate"
            [value]="submitProgress"
            class="submit-progress"
          ></mat-progress-bar>
          <div class="submit-meta">
            <span>{{ submitCompleted }} / {{ submitTotal }}</span>
            <span>{{ submitProgress }}%</span>
          </div>
        </div>
      </div>
    </ng-container>
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

      .step-card {
        background: rgba(255, 255, 255, 0.18);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 14px;
        padding: 12px 14px;
        color: #ecfdf3;
      }

      .step-title {
        font-size: 0.75rem;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        margin-bottom: 0.25rem;
      }

      .step-label {
        font-weight: 700;
        font-size: 1rem;
        margin: 0;
      }

      .step-help {
        margin-top: 0.25rem;
        font-size: 0.85rem;
        color: rgba(236, 253, 243, 0.85);
      }

      .action-tile {
        border: 1px solid #e5efe9;
        border-radius: 16px;
        padding: 20px;
        background: #f9fdfb;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .action-title {
        font-weight: 700;
        color: #0f172a;
        margin: 0;
      }

      .action-help {
        font-size: 0.85rem;
        color: #64748b;
        margin: 0;
      }

      .manual-toggle {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        background: #ffffff;
        border: 1px solid #e5efe9;
        border-radius: 16px;
        padding: 16px 20px;
        box-shadow: 0 14px 30px -24px rgba(15, 23, 42, 0.35);
      }

      @media (max-width: 640px) {
        .manual-toggle {
          flex-direction: column;
          align-items: flex-start;
        }
      }


      ::ng-deep
        .mat-form-field-appearance-outline
        .mat-form-field-outline-start,
      ::ng-deep .mat-form-field-appearance-outline .mat-form-field-outline-end {
        border-color: #e5e7eb;
      }

      ::ng-deep
        .mat-form-field-appearance-outline.mat-focused
        .mat-form-field-outline-start,
      ::ng-deep
        .mat-form-field-appearance-outline.mat-focused
        .mat-form-field-outline-end,
      ::ng-deep
        .mat-form-field-appearance-outline.mat-focused
        .mat-form-field-outline-gap {
        border-color: #007a53 !important;
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

      .submit-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
        z-index: 60;
      }

      .submit-modal {
        width: min(520px, 92vw);
        background: #ffffff;
        border-radius: 18px;
        padding: 24px;
        box-shadow: 0 24px 60px -30px rgba(15, 23, 42, 0.55);
        border: 1px solid rgba(15, 23, 42, 0.06);
      }

      .submit-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
      }

      .submit-icon {
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f3faf6;
        color: #007a53;
        border-radius: 12px;
      }

      .submit-title {
        font-weight: 700;
        color: #0f172a;
        margin: 0;
      }

      .submit-subtitle {
        margin: 0;
        color: #64748b;
        font-size: 0.9rem;
      }

      .submit-progress {
        height: 8px;
        border-radius: 999px;
      }

      .submit-meta {
        display: flex;
        justify-content: space-between;
        margin-top: 0.75rem;
        color: #64748b;
        font-size: 0.85rem;
        font-weight: 600;
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
  private usersService = inject(UsersService);
  isHamcoUser = false;
  private jornadaService = inject(JornadaActivaService);
  readonly EMPRESA_OTRA_ID = '05mwfxhSyFDrGd72tuzO';


  selectedFileName: string | null = null;
  showManualForm = false;
  canSelectEmpresa = false;
  currentUserRoleName: string | null = null;
  isParsing = false;
  isSubmitting = false;
  submitProgress = 0;
  submitTotal = 0;
  submitCompleted = 0;
  submitStatus = 'Preparando envio...';
  notifications: Array<{
    id: number;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
    icon: string;
  }> = [];
  private notificationId = 0;
  jornadaActiva?: JornadaActiva;
  showEmpresaOtra = false;


  // 🔹 Paginación (similar al otro componente)
  pageSize = 10;
  currentPage = 1;
  totalPages = 1;
  pagedUsers: any[] = []; // Usuarios que se muestran en la página actual

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

  resolveEmpresaPayload(): {
    tipo: 'NORMAL' | 'OTRA';
    empresaId: string;
    nombre: string;
  } {
    const empresaIdSeleccionada = this.empresaForm.value.empresaId;

    // 🟢 Empresa normal
    if (empresaIdSeleccionada && empresaIdSeleccionada !== 'OTRA') {
      const empresaSeleccionada = this.empresas.find(
        e => e.id === empresaIdSeleccionada
      );

      return {
        tipo: 'NORMAL',
        empresaId: empresaIdSeleccionada,
        nombre: empresaSeleccionada?.nombre ?? '',
      };
    }

    // 🟡 Empresa OTRA
    return {
      tipo: 'OTRA',
      empresaId: this.EMPRESA_OTRA_ID, // ✅ string garantizado
      nombre: this.empresaForm.value.empresaOtra ?? '',
    };
  }




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
    // Calcular el índice real en el array completo considerando la paginación
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const realIndex = startIndex + index;

    this.previewUsers.splice(realIndex, 1);
    this.previewUsers = [...this.previewUsers];

    // Actualizar la paginación después de eliminar
    this.updatePagination();

    this.pushNotification(
      'info',
      'Usuario eliminado',
      'Se retiró el usuario de la lista.'
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
        Validators.minLength(10), // opcional (teléfono típico MX)
        Validators.maxLength(10), // opcional
      ],
    ],
    email: ['', [Validators.required, Validators.email]],
  });

  empresas: Empresa[] = [];
  empresaForm = this.fb.group({
    empresaId: [''],
    empresaOtra: [''],
  });

  async loadEmpresas() {
    try {
      const empresasBD =
        await this.empresasService.getEmpresasPorUsuarioLogueado();


      this.empresas = empresasBD.filter(
        e =>
          e.id !== this.EMPRESA_OTRA_ID &&
          e.nombre?.toUpperCase() !== 'OTRA'
      );

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
      this.manualForm
        .get('codigoPulsera')
        ?.setValidators([Validators.required]);
      this.manualForm.get('email')?.clearValidators();
    } else {
      this.manualForm
        .get('email')
        ?.setValidators([Validators.required, Validators.email]);
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
    this.empresaForm.get('empresaId')?.valueChanges.subscribe(value => {
      if (value === 'OTRA') {
        this.showEmpresaOtra = true;
        this.empresaForm
          .get('empresaOtra')
          ?.setValidators([Validators.required]);
      } else {
        this.showEmpresaOtra = false;
        this.empresaForm.get('empresaOtra')?.clearValidators();
        this.empresaForm.get('empresaOtra')?.reset();
      }

      this.empresaForm.get('empresaOtra')?.updateValueAndValidity();
    });
  }

  onlyNumbers(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;

    // Permite solo números (0–9)
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
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
            errors.push(`Línea ${index + 2}: la función "${value}" no existe`);
          } else {
            user.funcion = funcionEncontrada.id;
          }
        } else {
          user[key] = value;
        }
      });

      // ✅ AÑADE LA JORNADA ACTIVA A CADA USUARIO PROCESADO
      if (this.jornadaActiva) {
        user.jornada = this.jornadaActiva.jornada;
      }

      parsedUsers.push(user);
    });

    if (errors.length) {
      this.isParsing = false;
      this.pushNotification('error', 'Archivo con errores', errors[0]);
      return;
    }

    this.previewUsers = [...this.previewUsers, ...parsedUsers];
    this.isParsing = false;

    // Actualizar paginación después de agregar usuarios
    this.updatePagination();

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
    try {
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convertir a JSON manteniendo los tipos correctos
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

      // Normalizar encabezados (quitar espacios, convertir a minúsculas)
      const normalizedRows = rows.map((row: any) => {
        const newRow: any = {};

        // Mapear nombres de columnas esperados
        const columnMapping: { [key: string]: string } = {
          nombre: 'nombre',
          'nombre completo': 'nombre',
          nombres: 'nombre',
          apellidopaterno: 'apellidoPaterno',
          'apellido paterno': 'apellidoPaterno',
          apellido_paterno: 'apellidoPaterno',
          paterno: 'apellidoPaterno',
          apellidomaterno: 'apellidoMaterno',
          'apellido materno': 'apellidoMaterno',
          apellido_materno: 'apellidoMaterno',
          materno: 'apellidoMaterno',
          funcion: 'funcion',
          cargo: 'funcion',
          puesto: 'funcion',
          telefono: 'telefono',
          teléfono: 'telefono',
          celular: 'telefono',
          email: 'email',
          correo: 'email',
          'correo electrónico': 'email',
          mail: 'email',
        };

        Object.keys(row).forEach((originalKey) => {
          const normalizedKey = originalKey
            .toLowerCase()
            .trim()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // quitar acentos
            .replace(/\s+/g, ''); // quitar espacios

          const mappedKey = columnMapping[normalizedKey] || normalizedKey;

          if (mappedKey && row[originalKey] !== undefined) {
            // Limpiar valores de email si vienen con fórmulas HYPERLINK
            if (['email', 'correo', 'mail'].includes(mappedKey)) {
              let emailValue = String(row[originalKey]).trim();
              emailValue = emailValue
                .replace(/^=HYPERLINK\("mailto:/i, '')
                .replace(/".*$/, '')
                .replace(/"/g, '')
                .replace(/'/g, '');
              newRow[mappedKey] = emailValue;
            } else {
              newRow[mappedKey] = String(row[originalKey]).trim();
            }
          }
        });

        return newRow;
      });

      console.log('Filas normalizadas desde XLSX:', normalizedRows);
      this.processParsedUsers(normalizedRows);
    } catch (error) {
      console.error('Error procesando XLSX:', error);
      this.isParsing = false;
      this.pushNotification(
        'error',
        'Error en archivo XLSX',
        'El archivo tiene un formato no válido.'
      );
    }
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
    } else if (extension === 'xlsx') {
      const reader = new FileReader();
      reader.onload = (e: any) => this.parseXLSX(e.target.result);
      reader.onerror = () => this.fileReadError();
      reader.readAsArrayBuffer(file);
    } else {
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

    // Actualizar paginación después de agregar usuarios
    this.updatePagination();

    this.pushNotification(
      'success',
      'Archivo cargado',
      `Se agregaron ${parsedUsers.length} usuarios a la lista.`
    );
  }

  addManualUser() {
    if (this.manualForm.invalid || !this.jornadaActiva) {
      this.manualForm.markAllAsTouched();
      this.pushNotification(
        'error',
        'No se pudo agregar',
        !this.jornadaActiva
          ? 'No existe una jornada activa.'
          : 'Verifique los datos requeridos antes de continuar.'
      );
      return;
    }

    const formValue = this.manualForm.value;

    const user = {
      nombre: formValue.nombre,
      apellidoPaterno: formValue.apellidoPaterno,
      apellidoMaterno: formValue.apellidoMaterno,
      funcion: formValue.funcion,
      telefono: formValue.telefono,
      email: formValue.email,

      // ✅ AÑADE LA JORNADA ACTIVA
      jornada: this.jornadaActiva.jornada,
    };

    this.previewUsers.push(user);
    this.previewUsers = [...this.previewUsers];

    // Actualizar paginación después de agregar usuario
    this.updatePagination();

    this.manualForm.reset();
    this.pushNotification(
      'success',
      'Usuario agregado',
      `Usuario agregado a la jornada ${this.jornadaActiva.jornada}`
    );
  }

  async submitAll() {

    // ⛔ No permitir doble envío
    if (this.isSubmitting) return;

    if (this.areaForm.invalid) {
      this.pushNotification(
        'error',
        'Area requerida',
        'Seleccione un area para continuar.'
      );
      return;
    }
    // 🔴 Validar empresa (solo si puede seleccionarla)
    if (this.canSelectEmpresa) {
      const empresaId = this.empresaForm.value.empresaId;
      const empresaOtra = this.empresaForm.value.empresaOtra;

      if (!empresaId) {
        this.pushNotification(
          'error',
          'Empresa requerida',
          'Debes seleccionar una empresa.'
        );
        return;
      }

      if (empresaId === 'OTRA' && !empresaOtra?.trim()) {
        this.pushNotification(
          'error',
          'Empresa requerida',
          'Debes escribir el nombre de la nueva empresa.'
        );
        return; // ⛔ AQUÍ SE DETIENE TODO
      }
    }

    // 🔴 Validar que TODOS los usuarios tengan función
    const usuariosSinFuncion = this.previewUsers.some(
      u => !u.funcion || u.funcion.trim() === ''
    );

    if (usuariosSinFuncion) {
      this.pushNotification(
        'error',
        'Función requerida',
        'Todos los usuarios deben tener una función asignada.'
      );
      return;
    }
    // ✅ VALIDA QUE EXISTA JORNADA ACTIVA
    if (!this.jornadaActiva) {
      this.pushNotification(
        'error',
        'Sin jornada activa',
        'No existe una jornada activa para registrar usuarios.'
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
    this.submitTotal = this.previewUsers.length;
    this.submitCompleted = 0;
    this.submitProgress = 0;
    this.submitStatus = 'Validando informacion...';
    const leaderData = await this.usersService.getUserByEmail(authUser.email);

    const empresaPayload = this.resolveEmpresaPayload();

    if (
      empresaPayload.tipo === 'OTRA' &&
      !empresaPayload.nombre?.trim()
    ) {
      this.pushNotification(
        'error',
        'Empresa requerida',
        'Debe ingresar el nombre de la empresa.'
      );
      return;
    }

    let empresaIdFinal: string | undefined;

    if (this.canSelectEmpresa) {
      empresaIdFinal = empresaPayload.empresaId;
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
          empresaId: empresaPayload.empresaId,
          empresa: empresaPayload,
          jornada: this.jornadaActiva.jornada,
          estatus: 'aprobado',
        };

        // Solo si es AdminEspecial
        if (this.canSelectEmpresa) {
          userData.reviewedBy = authUser.email;
          userData.reviewedAt = new Date();
        }

        await this.usersAccessService.createUser(userData, authUser.email);
        this.submitCompleted += 1;
        this.submitProgress = Math.round(
          (this.submitCompleted / this.submitTotal) * 100
        );
        this.submitStatus = `Enviando ${this.submitCompleted} de ${this.submitTotal}`;
      }

      this.submitProgress = 100;
      this.submitStatus = 'Solicitudes enviadas';
      this.previewUsers = [];

      // Actualizar paginación después de limpiar usuarios
      this.updatePagination();

      this.pushNotification(
        'success',
        'Solicitudes enviadas',
        'Las solicitudes fueron enviadas correctamente.'
      );

      // Esperar un momento adicional para que se procese el PDF
      this.submitStatus = 'Procesando archivos...';
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Redirigir con un parámetro de query para forzar recarga
      await this.router.navigate(['/user'], {
        queryParams: { refresh: Date.now() },
      });
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

  // 🔹 Método para actualizar la paginación (similar al otro componente)
  updatePagination(): void {
    this.totalPages = Math.ceil(this.previewUsers.length / this.pageSize);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.pagedUsers = this.previewUsers.slice(start, end);
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