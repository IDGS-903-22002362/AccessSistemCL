import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable';


import { AuthService } from '../../core/services/auth.service';
import {
  UsersAccesService,
  UserAccess,
} from '../../core/services/usersSolicitud.service';
import { AreasService, Area } from '../../core/services/areas.service';
import {
  FuncionesService,
  Funcion,
} from '../../core/services/funciones.service';
import {
  PartidosService,
  Partido,
  TorneoTipo,
} from '../../core/services/partidos.service';
import {
  JornadaActivaService,
  JornadaActiva,
} from '../../core/services/jornadas.service';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';
/** Margen en días alrededor del rango de fechas del torneo para filtrar createdAt */
const TORNEO_FECHA_MARGEN_DIAS = 14;

interface AreaConConteo {
  id: string;
  nombre: string;
  conteoUsuarios: number;
  aprobados: number;
  canjeados: number;
}

@Component({
  selector: 'app-reportes-analytics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    BaseChartDirective,
  ],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <div class="bg-[#007A53] text-white p-4 shadow-lg">
        <div class="max-w-7xl mx-auto flex justify-between items-center">
          <div class="flex items-center gap-3">
            <mat-icon class="text-3xl">analytics</mat-icon>
            <h1 class="text-2xl font-bold">Panel de Reportes Analíticos</h1>
          </div>
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
      </div>

      <div class="max-w-7xl mx-auto p-6">
        <!-- Loading State -->
        <div *ngIf="loading" class="text-center py-12">
          <mat-spinner class="mx-auto"></mat-spinner>
          <p class="mt-4 text-gray-600">Cargando datos...</p>
        </div>

        <!-- Content -->
        <div *ngIf="!loading">
          <!-- ========== SECCIÓN 1: CARDS DE ESTADÍSTICAS ========== -->
          <div
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
          >
            <!-- Total Solicitudes -->
            <div
              class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm opacity-90">Total Solicitudes</p>
                  <p class="text-4xl font-bold mt-2">{{ totalSolicitudes }}</p>
                </div>
                <mat-icon
                  class="text-5xl opacity-80 w-12 h-12 leading-none"
                  style="font-size: 48px; width: 48px; height: 48px; line-height: 48px"
                  >description</mat-icon
                >
              </div>
            </div>

            <!-- Aprobados -->
            <div
              class="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm opacity-90">Aprobados</p>
                  <p class="text-4xl font-bold mt-2">{{ totalAprobados }}</p>
                </div>
                <mat-icon
                  class="text-5xl opacity-80 w-12 h-12 leading-none"
                  style="font-size: 48px; width: 48px; height: 48px; line-height: 48px"
                  >check_circle</mat-icon
                >
              </div>
            </div>

            <!-- Pendientes -->
            <div
              class="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-lg p-6 text-white"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm opacity-90">Pendientes</p>
                  <p class="text-4xl font-bold mt-2">{{ totalPendientes }}</p>
                </div>
                <mat-icon
                  class="text-5xl opacity-80 w-12 h-12 leading-none"
                  style="font-size: 48px; width: 48px; height: 48px; line-height: 48px"
                  >schedule</mat-icon
                >
              </div>
            </div>

            <!-- Canjeados -->
            <div
              class="bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg shadow-lg p-6 text-white"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm opacity-90">Canjeados</p>
                  <p class="text-4xl font-bold mt-2">{{ totalCanjeados }}</p>
                </div>
                <mat-icon
                  class="text-5xl opacity-80 w-12 h-12 leading-none"
                  style="font-size: 48px; width: 48px; height: 48px; line-height: 48px"
                  >done_all</mat-icon
                >
              </div>
            </div>
          </div>

          <!-- ========== SECCIÓN 2: REPORTES - JORNADA ACTIVA Y USUARIOS POR ÁREA ========== -->
          <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-4">Reportes</h2>

            <!-- Filtros de historial: Año + Torneo + Jornada -->
            <div *ngIf="aniosDisponibles.length > 0" class="mb-4">
              <div
                class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3"
              >
                <div>
                  <label class="block text-sm font-medium text-[#007A53] mb-2">
                    <mat-icon class="align-middle mr-1">calendar_today</mat-icon>
                    Año
                  </label>
                  <select
                    [(ngModel)]="anioSeleccionado"
                    (ngModelChange)="onAnioChange()"
                    class="w-full p-3 border-2 border-[#007A53] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007A53] bg-white"
                  >
                    <option *ngFor="let anio of aniosDisponibles" [ngValue]="anio">
                      {{ anio }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-[#007A53] mb-2">
                    <mat-icon class="align-middle mr-1">emoji_events</mat-icon>
                    Torneo
                  </label>
                  <select
                    [(ngModel)]="torneoSeleccionado"
                    (ngModelChange)="onTorneoChange()"
                    class="w-full p-3 border-2 border-[#007A53] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007A53] bg-white"
                  >
                    <option
                      *ngFor="let torneo of torneosDisponibles"
                      [ngValue]="torneo"
                    >
                      {{ torneo === 'apertura' ? 'Apertura' : 'Clausura' }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-[#007A53] mb-2">
                    <mat-icon class="align-middle mr-1">event</mat-icon>
                    Jornada
                  </label>
                  <select
                    [(ngModel)]="jornadaSeleccionada"
                    (change)="onJornadaChange()"
                    [disabled]="todasLasJornadas.length === 0 && !jornadaActiva"
                    class="w-full p-3 border-2 border-[#007A53] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007A53] bg-white disabled:opacity-50"
                  >
                    <option [ngValue]="null" *ngIf="jornadaActiva">
                      🟢 Jornada Activa {{ jornadaActiva.jornada }} -
                      {{ jornadaActiva.equipo_local }} vs
                      {{ jornadaActiva.equipo_visitante }}
                    </option>
                    <option
                      *ngFor="let jornada of todasLasJornadas"
                      [ngValue]="jornada"
                    >
                      {{ jornada.activo ? '🟢' : '⚪' }} Jornada
                      {{ jornada.jornada }} - {{ jornada.equipo_local }} vs
                      {{ jornada.equipo_visitante }} ({{ jornada.fecha }})
                    </option>
                  </select>
                </div>
              </div>
              <p class="text-xs text-gray-500 mt-1">
                Historial por año y torneo · 🟢 = Activa | ⚪ = Histórica
              </p>
            </div>

            <!-- Mensaje cuando no hay jornadas en el torneo seleccionado -->
            <div
              *ngIf="
                aniosDisponibles.length > 0 &&
                todasLasJornadas.length === 0 &&
                !jornadaActiva &&
                !loading &&
                !loadingPartidos
              "
              class="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 text-center mb-4"
            >
              <mat-icon class="text-yellow-600 text-5xl mb-2">warning</mat-icon>
              <h3 class="text-xl font-semibold text-yellow-800 mb-2">
                No hay jornadas en este torneo
              </h3>
              <p class="text-yellow-700">
                No hay partidos registrados para
                {{ torneoSeleccionado === 'apertura' ? 'Apertura' : 'Clausura' }}
                {{ anioSeleccionado }}.
              </p>
            </div>

            <div
              *ngIf="aniosDisponibles.length === 0 && !loading"
              class="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 text-center mb-4"
            >
              <mat-icon class="text-yellow-600 text-5xl mb-2">warning</mat-icon>
              <h3 class="text-xl font-semibold text-yellow-800 mb-2">
                No hay torneos disponibles
              </h3>
              <p class="text-yellow-700">
                No se encontraron años en el calendario de partidos.
              </p>
            </div>

            <!-- Contenido cuando hay jornada seleccionada -->
            <div *ngIf="jornadaSeleccionada || jornadaActiva">
              <!-- Lista de Reportes -->
              <div class="mb-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-3">
                  {{
                    (jornadaSeleccionada || jornadaActiva)?.activo
                      ? 'Jornada Activa'
                      : 'Jornada Histórica'
                  }}
                </h3>
                <div
                  class="bg-white border-2 border-[#007A53] rounded-lg p-4"
                  [class.border-green-500]="
                    (jornadaSeleccionada || jornadaActiva)?.activo
                  "
                  [class.border-gray-400]="
                    !(jornadaSeleccionada || jornadaActiva)?.activo
                  "
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <h4
                        class="text-base font-semibold mb-1"
                        [class.text-[#007A53]]="
                          (jornadaSeleccionada || jornadaActiva)?.activo
                        "
                        [class.text-gray-600]="
                          !(jornadaSeleccionada || jornadaActiva)?.activo
                        "
                      >
                        Jornada
                        {{ (jornadaSeleccionada || jornadaActiva)?.jornada }}
                        <span
                          *ngIf="(jornadaSeleccionada || jornadaActiva)?.activo"
                          class="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                          >ACTIVA</span
                        >
                        <span
                          *ngIf="
                            !(jornadaSeleccionada || jornadaActiva)?.activo
                          "
                          class="ml-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                          >HISTÓRICA</span
                        >
                      </h4>
                      <p class="text-sm text-gray-700">
                        {{
                          (jornadaSeleccionada || jornadaActiva)?.equipo_local
                        }}
                        vs
                        {{
                          (jornadaSeleccionada || jornadaActiva)
                            ?.equipo_visitante
                        }}
                      </p>
                      <p class="text-xs text-gray-500 mt-1">
                        {{ (jornadaSeleccionada || jornadaActiva)?.fecha }} -
                        {{ (jornadaSeleccionada || jornadaActiva)?.hora }}
                      </p>
                    </div>
                    <div class="text-right">
                      <div class="text-sm text-gray-600">Total de usuarios</div>
                      <div class="text-3xl font-bold text-[#007A53]">
                        {{ getTotalUsuariosJornadaSeleccionada() }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Usuarios por Área -->
              <div>
                <h3 class="text-lg font-semibold text-gray-800 mb-3">
                  Usuarios por Área
                </h3>
                <div
                  class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  <div
                    *ngFor="let area of areasConConteo"
                    class="bg-white border-2 border-[#007A53] rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow"
                  >
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <h4 class="text-sm font-medium text-gray-600 mb-1">
                          {{ area.nombre }}
                        </h4>
                        <div class="text-3xl font-bold text-[#007A53]">
                          {{ area.conteoUsuarios }}
                        </div>
                        <p class="text-xs text-gray-500 mt-1">
                          {{
                            area.conteoUsuarios === 1
                              ? 'usuario asignado'
                              : 'usuarios asignados'
                          }}
                        </p>
                        <div class="flex gap-3 mt-2 text-xs">
                          <div class="flex items-center gap-1">
                            <span
                              class="w-2 h-2 bg-blue-500 rounded-full"
                            ></span>
                            <span class="text-gray-600"
                              >Aprobados:
                              <strong class="text-blue-600">{{
                                area.aprobados
                              }}</strong></span
                            >
                          </div>
                          <div class="flex items-center gap-1">
                            <span
                              class="w-2 h-2 bg-green-500 rounded-full"
                            ></span>
                            <span class="text-gray-600"
                              >Canjeados:
                              <strong class="text-green-600">{{
                                area.canjeados
                              }}</strong></span
                            >
                          </div>
                        </div>
                      </div>
                      <mat-icon class="text-[#007A53] opacity-50"
                        >people</mat-icon
                      >
                    </div>
                  </div>
                </div>

                <div
                  *ngIf="areasConConteo.length === 0"
                  class="text-center py-8 text-gray-500"
                >
                  <mat-icon class="text-gray-400 text-5xl">inbox</mat-icon>
                  <p class="mt-2">
                    No hay usuarios asignados en ninguna área para esta jornada.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Botón para Mostrar/Ocultar Filtros -->
          <div class="mb-4" *ngIf="jornadaSeleccionada || jornadaActiva">
            <button
              (click)="toggleFilters()"
              class="flex items-center gap-2 px-4 py-2 bg-[#007A53] text-white rounded-lg hover:bg-[#005a3d] transition-colors"
            >
              <mat-icon>{{
                showFilters ? 'filter_list_off' : 'filter_list'
              }}</mat-icon>
              {{ showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros' }}
            </button>
          </div>

          <!-- Buscador -->
          <div class="mb-4" *ngIf="jornadaSeleccionada || jornadaActiva">
            <div class="relative">
              <mat-icon class="absolute left-3 top-3 text-gray-400"
                >search</mat-icon
              >
              <input
                type="text"
                [(ngModel)]="searchTerm"
                (input)="applyFilters()"
                placeholder="Buscar por ID, nombre, correo..."
                class="w-full pl-10 pr-4 py-2 border-2 border-[#007A53] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007A53]"
              />
            </div>
          </div>

          <div
            *ngIf="showFilters && (jornadaSeleccionada || jornadaActiva)"
            class="bg-[#007A53] bg-opacity-5 border border-[#007A53] p-4 rounded-lg mb-4 grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <!-- Panel de Filtros -->
            <div>
              <label class="block text-sm font-medium text-[#007A53] mb-1"
                >Área</label
              >
              <select
                [(ngModel)]="filters.area"
                (change)="applyFilters()"
                class="w-full p-2 border-2 border-[#007A53] rounded focus:outline-none focus:ring-2 focus:ring-[#007A53]"
              >
                <option value="">Todas</option>
                <option *ngFor="let area of uniqueAreas" [value]="area">
                  {{ areasMap.get(area) || area }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-[#007A53] mb-1"
                >Estado</label
              >
              <select
                [(ngModel)]="filters.estado"
                (change)="applyFilters()"
                class="w-full p-2 border-2 border-[#007A53] rounded focus:outline-none focus:ring-2 focus:ring-[#007A53]"
              >
                <option value="">Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="aprobado">Aprobado</option>
                <option value="canjeado">Canjeado</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-[#007A53] mb-1"
                >Función</label
              >
              <select
                [(ngModel)]="filters.funcion"
                (change)="applyFilters()"
                class="w-full p-2 border-2 border-[#007A53] rounded focus:outline-none focus:ring-2 focus:ring-[#007A53]"
              >
                <option value="">Todas</option>
                <option *ngFor="let func of uniqueFunciones" [value]="func">
                  {{ funcionesMap.get(func) || func }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-[#007A53] mb-1"
                >Registrante</label
              >
              <select
                [(ngModel)]="filters.registrante"
                (change)="applyFilters()"
                class="w-full p-2 border-2 border-[#007A53] rounded focus:outline-none focus:ring-2 focus:ring-[#007A53]"
              >
                <option value="">Todos</option>
                <option *ngFor="let reg of uniqueRegistrantes" [value]="reg">
                  {{ reg }}
                </option>
              </select>
            </div>
          </div>

          <div *ngIf="loading" class="text-center py-8">
            <p class="text-gray-600">Cargando solicitudes...</p>
          </div>

          <div
            *ngIf="!loading && filteredSolicitudes.length === 0"
            class="text-center py-8"
          >
            <mat-icon class="text-gray-400 text-5xl">inbox</mat-icon>
            <p class="text-gray-600 mt-4">No hay solicitudes disponibles.</p>
          </div>

          <!-- Botón para exportar PDF (agregar cerca de los filtros) -->
          <div class="flex justify-between items-center mb-4">
            <button
              *ngIf="filteredSolicitudes.length > 0"
              (click)="exportToPDF()"
              [disabled]="exportingPDF"
              class="bg-[#007A53] text-white px-4 py-2 rounded hover:bg-[#006747] flex items-center disabled:opacity-50"
            >
              <mat-icon class="mr-2">picture_as_pdf</mat-icon>
              {{ exportingPDF ? 'Generando PDF...' : 'Exportar a PDF' }}
            </button>
          </div>

          <div
            *ngIf="!loading && filteredSolicitudes.length > 0"
            id="pdfTable"
            class="overflow-x-auto"
          >
            <table class="w-full">
              <thead class="bg-[#007A53] text-white">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase">
                    Nombre
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase">
                    Email
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase">
                    Área
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase">
                    Función
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase">
                    Teléfono
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase">
                    Estado
                  </th>
                  <th>Jornada</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr
                  *ngFor="let solicitud of pagedSolicitudes"
                  class="hover:bg-[#007A53] hover:bg-opacity-5"
                  [class.bg-[#007A53]]="selectedSolicitudes.has(solicitud.id!)"
                  [class.bg-opacity-10]="selectedSolicitudes.has(solicitud.id!)"
                >
                  <td class="px-4 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">
                      {{ solicitud.nombre }} {{ solicitud.apellidoPaterno }}
                    </div>
                    <div class="text-sm text-gray-500">
                      {{ solicitud.apellidoMaterno }}
                    </div>
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ solicitud.email }}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ areasMap.get(solicitud.areaId) || solicitud.areaId }}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{
                      funcionesMap.get(solicitud.funcion) || solicitud.funcion
                    }}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ solicitud.telefono }}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap">
                    <span
                      class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                      [ngClass]="{
                        'bg-yellow-100 text-yellow-800':
                          solicitud.estatus === 'pendiente',
                        'bg-green-100 text-green-800':
                          solicitud.estatus === 'aprobado',
                        'bg-red-100 text-red-800':
                          solicitud.estatus === 'canjeado'
                      }"
                    >
                      {{ solicitud.estatus }}
                    </span>
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ solicitud.jornada || 'No asignada' }}
                  </td>
                </tr>
              </tbody>
            </table>
            <div
              *ngIf="filteredSolicitudes.length > pageSize"
              class="flex justify-center items-center gap-4 mt-4"
            >
              <button
                (click)="currentPage = currentPage - 1; updatePagination()"
                [disabled]="currentPage === 1"
                class="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              >
                Anterior
              </button>

              <span class="text-sm font-medium">
                Página {{ currentPage }} de {{ totalPages }}
              </span>

              <button
                (click)="currentPage = currentPage + 1; updatePagination()"
                [disabled]="currentPage === totalPages"
                class="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>

          <!-- ========== SECCIÓN 4: GRÁFICAS ANALÍTICAS ========== -->
          <div
            class="bg-white rounded-lg shadow-md p-6 mb-6"
            *ngIf="jornadaSeleccionada || jornadaActiva"
          >
            <h2
              class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2"
            >
              <mat-icon class="text-[#007A53]">insert_chart</mat-icon>
              Análisis Gráfico
            </h2>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Gráfica 1: Estado de Solicitudes (Pie) -->
              <mat-card class="shadow-lg">
                <mat-card-content>
                  <h3 class="text-lg font-semibold mb-4 text-center">
                    Estado de Solicitudes
                  </h3>
                  <canvas
                    baseChart
                    [data]="pieChartData"
                    [type]="pieChartType"
                    [options]="pieChartOptions"
                  ></canvas>
                </mat-card-content>
              </mat-card>

              <!-- Gráfica 2: Solicitudes por Área (Bar) -->
              <mat-card class="shadow-lg">
                <mat-card-content>
                  <h3 class="text-lg font-semibold mb-4 text-center">
                    Solicitudes por Área
                  </h3>
                  <canvas
                    baseChart
                    [data]="barChartDataAreas"
                    [type]="barChartType"
                    [options]="barChartOptions"
                  ></canvas>
                </mat-card-content>
              </mat-card>

              <!-- Gráfica 3: Solicitudes por Jornada (Line) -->
              <mat-card class="shadow-lg">
                <mat-card-content>
                  <h3 class="text-lg font-semibold mb-4 text-center">
                    Tendencia por Jornada
                  </h3>
                  <canvas
                    baseChart
                    [data]="lineChartData"
                    [type]="lineChartType"
                    [options]="lineChartOptions"
                  ></canvas>
                </mat-card-content>
              </mat-card>

              <!-- Gráfica 4: Distribución por Función (Doughnut) -->
              <mat-card class="shadow-lg">
                <mat-card-content>
                  <h3 class="text-lg font-semibold mb-4 text-center">
                    Distribución por Función
                  </h3>
                  <canvas
                    baseChart
                    [data]="doughnutChartData"
                    [type]="doughnutChartType"
                    [options]="doughnutChartOptions"
                  ></canvas>
                </mat-card-content>
              </mat-card>
            </div>

            <!-- Botón Exportar Gráficas a PDF -->
            <div class="mt-6 text-center">
              <button
                mat-raised-button
                color="primary"
                (click)="exportChartsToPDF()"
                [disabled]="exportingChartsPDF"
                class="bg-[#007A53]"
              >
                <mat-icon>download</mat-icon>
                {{
                  exportingChartsPDF
                    ? 'Generando PDF...'
                    : 'Exportar Gráficas a PDF'
                }}
              </button>
            </div>
          </div>
        </div>
      </div>
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
export class ReportesAnalyticsComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private usersAccesService = inject(UsersAccesService);
  private areasService = inject(AreasService);
  private funcionesService = inject(FuncionesService);
  private partidosService = inject(PartidosService);
  private jornadaActivaService = inject(JornadaActivaService);

  loading = true;
  exportingPDF = false;
  exportingChartsPDF = false;

  // Datos principales
  solicitudes: UserAccess[] = [];
  filteredSolicitudes: UserAccess[] = [];
  areas: Area[] = [];
  funciones: Funcion[] = [];
  partidos: Partido[] = [];
  jornadaActiva: JornadaActiva | null = null;
  areasConConteo: AreaConConteo[] = [];

  // Historial: año + torneo + jornadas del calendario RTDB
  aniosDisponibles: string[] = [];
  torneosDisponibles: TorneoTipo[] = [];
  anioSeleccionado = '';
  torneoSeleccionado: TorneoTipo | '' = '';
  loadingPartidos = false;
  torneoFechaInicio: Date | null = null;
  torneoFechaFin: Date | null = null;

  // Jornadas del torneo seleccionado
  todasLasJornadas: JornadaActiva[] = [];
  jornadaSeleccionada: JornadaActiva | null = null;
  private filtrosCalendarioListos = false;

  // Maps para nombres
  areasMap = new Map<string, string>();
  funcionesMap = new Map<string, string>();

  // Filtros
  searchTerm = '';
  selectedJornada: number | '' = '';
  // Filtros
  filters = {
    area: '',
    estado: '',
    funcion: '',
    registrante: '',
  };
  showFilters = false; // Comienza oculto

  // Para filtros únicos
  uniqueAreas: string[] = [];
  uniqueFunciones: string[] = [];
  uniqueRegistrantes: string[] = [];

  // Estadísticas
  totalSolicitudes = 0;
  totalAprobados = 0;
  totalPendientes = 0;
  totalCanjeados = 0;

  // Charts
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  // Pie Chart - Estado de solicitudes
  pieChartType: ChartType = 'pie';
  pieChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [{ data: [] }],
  };
  pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: { enabled: true },
    },
  };

  // 🔹 Paginación
  pageSize = 10;
  currentPage = 1;
  totalPages = 1;

  // Selección múltiple
  selectedSolicitudes: Set<string> = new Set();
  selectAll = false;

  // 🔹 Datos SOLO para la tabla
  pagedSolicitudes: UserAccess[] = [];

  updatePagination(): void {
    this.totalPages = Math.ceil(
      this.filteredSolicitudes.length / this.pageSize
    );
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.pagedSolicitudes = this.filteredSolicitudes.slice(start, end);
  }

  /**
   * Exportar tabla filtrada a PDF
   */
  async exportToPDF(): Promise<void> {
    this.exportingPDF = true;

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');

      /* =========================
         TÍTULO
      ========================= */
      const title = 'Reporte de Solicitudes';
      pdf.setFontSize(16);
      pdf.setTextColor(0, 122, 83);
      pdf.text(title, 14, 15);

      /* =========================
         SUBTÍTULO / METADATA
      ========================= */
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);

      const fecha = new Date().toLocaleDateString('es-MX');
      pdf.text(`Fecha: ${fecha}`, 14, 22);

      const registrante =
        this.filters.registrante ||
        this.filteredSolicitudes[0]?.registrantEmail ||
        'No especificado';

      pdf.text(`Registrante: ${registrante}`, 14, 27);

      let y = 32;

      if (this.filters.area) {
        pdf.text(
          `Área: ${this.areasMap.get(this.filters.area) || this.filters.area}`,
          14,
          y
        );
        y += 5;
      }

      if (this.filters.estado) {
        pdf.text(`Estado: ${this.filters.estado}`, 14, y);
        y += 5;
      }

      if (this.filters.funcion) {
        pdf.text(
          `Función: ${this.funcionesMap.get(this.filters.funcion) || this.filters.funcion
          }`,
          14,
          y
        );
        y += 5;
      }

      if (this.getJornadaActual()) {
        pdf.text(
          `Jornada: ${this.getJornadaActual()!.jornada}`,
          14,
          y
        );
        y += 5;
      }

      pdf.text(
        `Total de registros: ${this.filteredSolicitudes.length}`,
        14,
        y + 5
      );

      /* =========================
         TABLA
      ========================= */
      autoTable(pdf, {
        startY: y + 10,
        head: [[
          'Nombre',
          'Email',
          'Área',
          'Función',
          'Teléfono',
          'Estado',
          'Jornada'
        ]],
        body: this.filteredSolicitudes.map(s => [
          `${s.nombre} ${s.apellidoPaterno} ${s.apellidoMaterno || ''}`,
          s.email || '',
          this.areasMap.get(s.areaId) || s.areaId || '',
          this.funcionesMap.get(s.funcion) || s.funcion || '',
          s.telefono || '',
          s.estatus || '',
          s.jornada ?? 'No asignada'
        ]),
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [0, 122, 83],
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          const pageCount = pdf.getNumberOfPages();
          pdf.setFontSize(9);
          pdf.text(
            `Página ${pageCount}`,
            pdf.internal.pageSize.getWidth() - 20,
            pdf.internal.pageSize.getHeight() - 10
          );
        },
      });

      /* =========================
         GUARDAR
      ========================= */
      const fileName = `reporte_solicitudes_${new Date()
        .toISOString()
        .replace(/[:.]/g, '-')}.pdf`;

      pdf.save(fileName);

      console.log('✅ PDF generado con autoTable correctamente');
    } catch (error) {
      console.error('❌ Error al generar PDF:', error);
      alert('Error al generar el PDF.');
    } finally {
      this.exportingPDF = false;
    }
  }


  // Bar Chart - Solicitudes por área
  barChartType: ChartType = 'bar';
  barChartDataAreas: ChartData<'bar'> = {
    labels: [],
    datasets: [{ data: [], label: 'Solicitudes por Área' }],
  };
  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { display: true },
    },
  };

  // Line Chart - Solicitudes por jornada
  lineChartType: ChartType = 'line';
  lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: [{ data: [], label: 'Solicitudes por Jornada' }],
  };
  lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { display: true },
    },
  };

  // Doughnut Chart - Distribución por función
  doughnutChartType: ChartType = 'doughnut';
  doughnutChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [{ data: [] }],
  };
  doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
    },
  };

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    try {
      this.loading = true;

      const [solicitudes, areas, funciones] = await Promise.all([
        this.usersAccesService.getUsers(),
        this.areasService.getAreas(),
        this.funcionesService.getFunciones(),
      ]);

      this.solicitudes = solicitudes;
      this.areas = areas;
      this.funciones = funciones;

      this.areasMap = new Map(areas.map((a: Area) => [a.id!, a.nombre]));
      this.funcionesMap = new Map(
        funciones.map((f: Funcion) => [f.id!, f.nombre])
      );

      this.uniqueAreas = [
        ...new Set(
          solicitudes.map((s: UserAccess) => s.areaId).filter(Boolean)
        ),
      ] as string[];
      this.uniqueFunciones = [
        ...new Set(
          solicitudes.map((s: UserAccess) => s.funcion).filter(Boolean)
        ),
      ] as string[];
      this.uniqueRegistrantes = [
        ...new Set(
          solicitudes.map((s: UserAccess) => s.registrantEmail).filter(Boolean)
        ),
      ] as string[];

      // Primero jornada activa, luego defaults año/torneo desde el calendario
      this.jornadaActivaService
        .getJornadasActivas$()
        .subscribe(async (jornadasActivas) => {
          const previousKey = this.getJornadaActivaKey();
          if (jornadasActivas.length > 0) {
            this.jornadaActiva = jornadasActivas[0];
          } else {
            this.jornadaActiva = null;
          }
          const nextKey = this.getJornadaActivaKey();

          if (!this.filtrosCalendarioListos || previousKey !== nextKey) {
            await this.inicializarFiltrosPorDefecto();
            this.filtrosCalendarioListos = true;
          } else {
            this.syncJornadaSeleccionadaConActiva();
            this.calculateAreasConteo();
            this.applyFilters();
          }
        });
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      this.loading = false;
    }
  }

  private getJornadaActivaKey(): string {
    if (!this.jornadaActiva) return '';
    return [
      this.jornadaActiva.jornada,
      this.jornadaActiva.fecha,
      this.jornadaActiva.equipo_local,
      this.jornadaActiva.equipo_visitante,
    ].join('|');
  }

  /**
   * Defaults al entrar: año/torneo del partido activo (o año reciente + apertura).
   * jornadaSeleccionada = null → opción "Jornada Activa".
   */
  private async inicializarFiltrosPorDefecto(): Promise<void> {
    try {
      const anios = await firstValueFrom(
        this.partidosService.getAniosDisponibles$().pipe(take(1))
      );
      this.aniosDisponibles = anios;

      if (anios.length === 0) {
        this.anioSeleccionado = '';
        this.torneoSeleccionado = '';
        this.todasLasJornadas = [];
        this.partidos = [];
        this.calculateAreasConteo();
        this.applyFilters();
        return;
      }

      if (this.jornadaActiva) {
        const resolved =
          await this.partidosService.resolveTorneoDeJornadaActiva(
            this.jornadaActiva
          );

        if (resolved) {
          this.anioSeleccionado = resolved.year;
          this.torneoSeleccionado = resolved.torneo;
          this.torneosDisponibles = await firstValueFrom(
            this.partidosService
              .getTorneosDisponibles$(resolved.year)
              .pipe(take(1))
          );
          this.partidos = resolved.partidos;
          this.actualizarRangoFechasTorneo();
          this.construirJornadasDesdePartidos();
          return;
        }
      }

      // Sin activa o sin match: año más reciente + preferir apertura
      this.anioSeleccionado = anios[0];
      this.cargarTorneosDelAnio(true);
    } catch (error) {
      console.error('Error inicializando filtros por defecto:', error);
      this.calculateAreasConteo();
      this.applyFilters();
    }
  }

  /**
   * Carga apertura/clausura del año seleccionado.
   * @param preferDefaultTorneo si true, elige apertura (o el primero disponible)
   */
  cargarTorneosDelAnio(preferDefaultTorneo = false): void {
    if (!this.anioSeleccionado) return;

    this.partidosService
      .getTorneosDisponibles$(this.anioSeleccionado)
      .subscribe((torneos) => {
        this.torneosDisponibles = torneos;
        if (torneos.length === 0) {
          this.torneoSeleccionado = '';
          this.partidos = [];
          this.todasLasJornadas = [];
          this.jornadaSeleccionada = null;
          this.calculateAreasConteo();
          this.applyFilters();
          return;
        }

        if (
          preferDefaultTorneo ||
          !this.torneoSeleccionado ||
          !torneos.includes(this.torneoSeleccionado as TorneoTipo)
        ) {
          this.torneoSeleccionado = torneos.includes('apertura')
            ? 'apertura'
            : torneos[0];
        }

        this.cargarPartidosDelTorneo();
      });
  }

  cargarPartidosDelTorneo(): void {
    if (!this.anioSeleccionado || !this.torneoSeleccionado) return;

    this.loadingPartidos = true;
    this.partidosService
      .getPartidos$(this.anioSeleccionado, this.torneoSeleccionado)
      .subscribe({
        next: (partidos) => {
          this.partidos = partidos ?? [];
          this.actualizarRangoFechasTorneo();
          this.construirJornadasDesdePartidos();
          this.loadingPartidos = false;
        },
        error: (err) => {
          console.error('Error cargando partidos:', err);
          this.partidos = [];
          this.todasLasJornadas = [];
          this.loadingPartidos = false;
          this.calculateAreasConteo();
          this.applyFilters();
        },
      });
  }

  onAnioChange(): void {
    this.jornadaSeleccionada = null;
    this.cargarTorneosDelAnio(true);
  }

  onTorneoChange(): void {
    this.jornadaSeleccionada = null;
    this.cargarPartidosDelTorneo();
  }

  /**
   * Parsea fechas de partido (DD/MM/YYYY o YYYY-MM-DD).
   */
  private parseFechaPartido(fecha: string | undefined | null): Date | null {
    if (!fecha || typeof fecha !== 'string') return null;
    const trimmed = fecha.trim();
    const dmy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmy) {
      const day = Number(dmy[1]);
      const month = Number(dmy[2]) - 1;
      const year = Number(dmy[3]);
      const date = new Date(year, month, day);
      return isNaN(date.getTime()) ? null : date;
    }
    const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) {
      const date = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
      return isNaN(date.getTime()) ? null : date;
    }
    const fallback = new Date(trimmed);
    return isNaN(fallback.getTime()) ? null : fallback;
  }

  private timestampToDate(value: unknown): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'object' && value !== null && 'toDate' in value) {
      try {
        return (value as { toDate: () => Date }).toDate();
      } catch {
        return null;
      }
    }
    if (typeof value === 'object' && value !== null && 'seconds' in value) {
      const seconds = (value as { seconds: number }).seconds;
      return new Date(seconds * 1000);
    }
    if (typeof value === 'number') return new Date(value);
    if (typeof value === 'string') {
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  }

  actualizarRangoFechasTorneo(): void {
    const fechas = this.partidos
      .map((p) => this.partidosService.parseFechaPartido(p.fecha))
      .filter((d): d is Date => d !== null);

    if (fechas.length === 0) {
      this.torneoFechaInicio = null;
      this.torneoFechaFin = null;
      return;
    }

    const min = new Date(Math.min(...fechas.map((d) => d.getTime())));
    const max = new Date(Math.max(...fechas.map((d) => d.getTime())));
    min.setDate(min.getDate() - TORNEO_FECHA_MARGEN_DIAS);
    max.setDate(max.getDate() + TORNEO_FECHA_MARGEN_DIAS);
    min.setHours(0, 0, 0, 0);
    max.setHours(23, 59, 59, 999);
    this.torneoFechaInicio = min;
    this.torneoFechaFin = max;
  }

  /**
   * Evita mezclar jornadas homónimas de otras temporadas usando createdAt.
   * Se aplica siempre, también con la opción "Jornada Activa".
   */
  perteneceAlTorneoSeleccionado(solicitud: UserAccess): boolean {
    if (!this.torneoFechaInicio || !this.torneoFechaFin) {
      return false;
    }
    const created = this.timestampToDate(solicitud.createdAt);
    if (!created) {
      return false;
    }
    return (
      created >= this.torneoFechaInicio && created <= this.torneoFechaFin
    );
  }

  private syncJornadaSeleccionadaConActiva(): void {
    if (this.jornadaActiva) {
      this.todasLasJornadas.forEach((j) => {
        j.activo = this.partidosService.partidoCoincideConJornada(j, this.jornadaActiva!);
      });
      if (this.jornadaSeleccionada === null) {
        return;
      }
    }
  }

  calculateAreasConteo() {
    const jornadaActual = this.getJornadaActual();

    if (!jornadaActual) {
      this.areasConConteo = [];
      return;
    }

    const jornadaId = jornadaActual.jornada;
    const usuariosPorArea = new Map<
      string,
      { aprobados: number; canjeados: number }
    >();

    const solicitudesFiltradas = this.solicitudes.filter(
      (s) =>
        s.jornada === jornadaId &&
        this.perteneceAlTorneoSeleccionado(s) &&
        s.areaId &&
        (s.estatus === 'aprobado' || s.estatus === 'canjeado')
    );

    solicitudesFiltradas.forEach((s) => {
      const conteo = usuariosPorArea.get(s.areaId!) || {
        aprobados: 0,
        canjeados: 0,
      };
      if (s.estatus === 'aprobado') {
        conteo.aprobados++;
      } else if (s.estatus === 'canjeado') {
        conteo.canjeados++;
      }
      usuariosPorArea.set(s.areaId!, conteo);
    });

    const todasAreas = this.areas.map((area) => {
      const conteo = usuariosPorArea.get(area.id!) || {
        aprobados: 0,
        canjeados: 0,
      };
      return {
        id: area.id!,
        nombre: area.nombre,
        aprobados: conteo.aprobados,
        canjeados: conteo.canjeados,
        conteoUsuarios: conteo.aprobados + conteo.canjeados,
      };
    });

    this.areasConConteo = todasAreas
      .filter((area) => area.conteoUsuarios > 0)
      .sort((a, b) => b.conteoUsuarios - a.conteoUsuarios);
  }

  /**
   * Construye la lista de jornadas desde el calendario RTDB del torneo.
   */
  construirJornadasDesdePartidos(): void {
    const porJornada = new Map<number, Partido>();
    for (const partido of this.partidos) {
      if (partido?.jornada == null) continue;
      if (!porJornada.has(partido.jornada)) {
        porJornada.set(partido.jornada, partido);
      }
    }

    this.todasLasJornadas = Array.from(porJornada.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([numJornada, partido]) => {
        const activa =
          !!this.jornadaActiva &&
          this.partidosService.partidoCoincideConJornada(
            partido,
            this.jornadaActiva
          );
        return {
          jornada: numJornada,
          equipo_local: partido.equipo_local || 'Desconocido',
          equipo_visitante: partido.equipo_visitante || 'Desconocido',
          estadio: partido.estadio || '',
          fecha: partido.fecha || '',
          hora: partido.hora || '',
          activo: activa,
        } as JornadaActiva;
      });

    if (this.jornadaActiva) {
      this.jornadaSeleccionada = null;
    } else if (this.todasLasJornadas.length > 0) {
      const stillValid =
        this.jornadaSeleccionada &&
        this.todasLasJornadas.some(
          (j) => j.jornada === this.jornadaSeleccionada!.jornada
        );
      if (!stillValid) {
        this.jornadaSeleccionada = this.todasLasJornadas[0];
      }
    } else {
      this.jornadaSeleccionada = null;
    }

    this.calculateAreasConteo();
    this.applyFilters();
  }

  /**
   * Obtiene la jornada actual (seleccionada o activa)
   */
  getJornadaActual(): JornadaActiva | null {
    return this.jornadaSeleccionada || this.jornadaActiva;
  }

  /**
   * Maneja el cambio de jornada en el selector
   */
  onJornadaChange(): void {
    this.calculateAreasConteo();
    this.applyFilters();
  }

  getTotalUsuariosJornadaSeleccionada(): number {
    const jornadaActual = this.getJornadaActual();
    if (!jornadaActual) return 0;

    return this.solicitudes.filter(
      (s) =>
        s.jornada === jornadaActual.jornada &&
        this.perteneceAlTorneoSeleccionado(s) &&
        (s.estatus === 'aprobado' || s.estatus === 'canjeado')
    ).length;
  }

  // Mantener compatibilidad con código existente
  getTotalUsuariosJornadaActiva(): number {
    return this.getTotalUsuariosJornadaSeleccionada();
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  applyFilters() {
    let filtered = [...this.solicitudes];

    const jornadaActual = this.getJornadaActual();
    if (jornadaActual) {
      filtered = filtered.filter(
        (s) =>
          s.jornada === jornadaActual.jornada &&
          this.perteneceAlTorneoSeleccionado(s)
      );
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.nombre?.toLowerCase().includes(term) ||
          s.email?.toLowerCase().includes(term) ||
          s.apellidoPaterno?.toLowerCase().includes(term) ||
          s.apellidoMaterno?.toLowerCase().includes(term)
      );
    }

    if (this.filters.area) {
      filtered = filtered.filter((s) => s.areaId === this.filters.area);
    }

    if (this.filters.estado) {
      filtered = filtered.filter((s) => s.estatus === this.filters.estado);
    }

    if (this.filters.funcion) {
      filtered = filtered.filter((s) => s.funcion === this.filters.funcion);
    }
    if (this.filters.registrante) {
      filtered = filtered.filter(
        (s) => s.registrantEmail === this.filters.registrante
      );
    }

    this.filteredSolicitudes = filtered;
    this.currentPage = 1;
    this.updatePagination();

    this.updateStatistics();
    this.updateCharts();
  }

  updateStatistics() {
    this.totalSolicitudes = this.filteredSolicitudes.length;
    this.totalAprobados = this.filteredSolicitudes.filter(
      (s) => s.estatus === 'aprobado'
    ).length;
    this.totalPendientes = this.filteredSolicitudes.filter(
      (s) => s.estatus === 'pendiente'
    ).length;
    this.totalCanjeados = this.filteredSolicitudes.filter(
      (s) => s.estatus === 'canjeado'
    ).length;
  }

  updateCharts() {
    this.updatePieChart();
    this.updateBarChartAreas();
    this.updateLineChart();
    this.updateDoughnutChart();
    this.chart?.update();
  }

  updatePieChart() {
    const estados = ['aprobado', 'pendiente', 'canjeado'];
    const data = estados.map(
      (estado) =>
        this.filteredSolicitudes.filter((s) => s.estatus === estado).length
    );

    this.pieChartData = {
      labels: ['Aprobados', 'Pendientes', 'Canjeados'],
      datasets: [
        {
          data,
          backgroundColor: ['#22c55e', '#f59e0b', '#6b7280'],
        },
      ],
    };
  }

  updateBarChartAreas() {
    const areasCounts = new Map<string, number>();
    this.filteredSolicitudes.forEach((s) => {
      if (s.areaId) {
        areasCounts.set(s.areaId, (areasCounts.get(s.areaId) || 0) + 1);
      }
    });

    const labels = Array.from(areasCounts.keys()).map(
      (id) => this.areasMap.get(id) || id
    );
    const data = Array.from(areasCounts.values());

    this.barChartDataAreas = {
      labels,
      datasets: [
        {
          data,
          label: 'Solicitudes por Área',
          backgroundColor: '#007A53',
        },
      ],
    };
  }

  updateLineChart() {
    const jornadasCounts = new Map<number, number>();
    this.filteredSolicitudes.forEach((s) => {
      if (s.jornada) {
        jornadasCounts.set(s.jornada, (jornadasCounts.get(s.jornada) || 0) + 1);
      }
    });

    const sortedJornadas = Array.from(jornadasCounts.keys()).sort(
      (a, b) => a - b
    );
    const labels = sortedJornadas.map((j) => `J${j}`);
    const data = sortedJornadas.map((j) => jornadasCounts.get(j) || 0);

    this.lineChartData = {
      labels,
      datasets: [
        {
          data,
          label: 'Solicitudes por Jornada',
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
        },
      ],
    };
  }

  updateDoughnutChart() {
    const funcionesCounts = new Map<string, number>();
    this.filteredSolicitudes.forEach((s) => {
      if (s.funcion) {
        funcionesCounts.set(
          s.funcion,
          (funcionesCounts.get(s.funcion) || 0) + 1
        );
      }
    });

    const labels = Array.from(funcionesCounts.keys()).map(
      (id) => this.funcionesMap.get(id) || id
    );
    const data = Array.from(funcionesCounts.values());

    this.doughnutChartData = {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            '#ef4444',
            '#f59e0b',
            '#10b981',
            '#3b82f6',
            '#8b5cf6',
            '#ec4899',
          ],
        },
      ],
    };
  }

  async exportTableToPDF() {
    this.exportingPDF = true;
    try {
      const element = document.getElementById('pdfTable');
      if (!element) return;

      const canvas = await html2canvas(element);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');

      const imgWidth = 280;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`panel-super-admin-${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error('Error exportando PDF:', error);
    } finally {
      this.exportingPDF = false;
    }
  }

  async exportChartsToPDF() {
    this.exportingChartsPDF = true;
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const charts = document.querySelectorAll('canvas');

      for (let i = 0; i < charts.length; i++) {
        if (i > 0) pdf.addPage();

        const canvas = charts[i];
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 190;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      }

      pdf.save(`graficas-analytics-${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error('Error exportando gráficas:', error);
    } finally {
      this.exportingChartsPDF = false;
    }
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
