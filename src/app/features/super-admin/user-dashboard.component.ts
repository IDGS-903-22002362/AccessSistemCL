import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { UsersService, User } from '../../core/services/users.service';
import { RolesService } from '../../core/services/roles.service';
import {
  FuncionesService,
  Funcion,
} from '../../core/services/funciones.service';
import { AreasService, Area } from '../../core/services/areas.service';
import {
  UsersAccesService,
  UserAccess,
} from '../../core/services/usersSolicitud.service';
//import { UserJornadaComponent } from '../user/user-jornada.component';
const SUPER_ADMIN_EMAIL = 'sistemascl@gmail.com';
import { PartidosService } from '../../core/services/partidos.service';
import {
  JornadaActivaService,
  JornadaActiva,
} from '../../core/services/jornadas.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-super-admin-reportes',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatCheckboxModule,
    MatDialogModule,
    MatTooltipModule,
    FormsModule,
    HttpClientModule,
  ],
  template: `
    <!-- Mensaje cuando no hay jornada activa -->
    <div
      *ngIf="!jornadaActiva && !loading"
      class="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 mb-6 text-center"
    >
      <mat-icon class="text-yellow-600 text-5xl mb-2">warning</mat-icon>
      <h3 class="text-xl font-semibold text-yellow-800 mb-2">
        No hay jornada activa
      </h3>
      <p class="text-yellow-700">
        No hay datos para mostrar. Por favor, active una jornada para ver las
        estadísticas.
      </p>
    </div>

    <!-- Cuadros Dinámicos con Conteo de Usuarios por Área (solo si hay jornada activa) -->
    <div *ngIf="jornadaActiva && !loading" class="mb-6">
      <div class="bg-white border-2 border-[#007A53] rounded-lg p-4 mb-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-[#007A53]">
              Jornada Activa: {{ jornadaActiva.jornada }}
            </h3>
            <p class="text-sm text-gray-600">
              {{ jornadaActiva.equipo_local }} vs
              {{ jornadaActiva.equipo_visitante }}
            </p>
            <p class="text-xs text-gray-500">
              {{ jornadaActiva.fecha }} - {{ jornadaActiva.hora }}
            </p>
          </div>
          <div class="text-right">
            <div class="text-sm text-gray-600">Total de usuarios</div>
            <div class="text-3xl font-bold text-[#007A53]">
              {{ getTotalUsuariosJornadaActiva() }}
            </div>
          </div>
        </div>
      </div>

      <h3 class="text-lg font-semibold text-gray-800 mb-3">
        Usuarios por Área
      </h3>
      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
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
            </div>
            <mat-icon class="text-[#007A53] opacity-50">people</mat-icon>
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

    <!-- Botón para Mostrar/Ocultar Filtros -->
    <div class="mb-4" *ngIf="jornadaActiva">
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
    <div class="mb-4" *ngIf="jornadaActiva">
      <div class="relative">
        <mat-icon class="absolute left-3 top-3 text-gray-400">search</mat-icon>
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
      *ngIf="showFilters && jornadaActiva"
      class="bg-[#007A53] bg-opacity-5 border border-[#007A53] p-4 rounded-lg mb-4 grid grid-cols-1 md:grid-cols-4 gap-4"
    >
      <!-- Panel de Filtros -->
      <div>
        <label class="block text-sm font-medium text-[#007A53] mb-1">
          Jornada
        </label>
        <select
          [(ngModel)]="selectedJornada"
          (change)="applyFilters()"
          class="w-full p-2 border-2 border-[#007A53] rounded"
        >
          <option value="">Todas</option>
          <option *ngFor="let partido of partidos" [ngValue]="partido.jornada">
            Jornada {{ partido.jornada }} - {{ partido.equipo_local }} vs
            {{ partido.equipo_visitante }}
          </option>
        </select>
      </div>
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

    <div *ngIf="!loading && !hasPermissions" class="text-center py-8">
      <mat-icon class="text-red-500 text-5xl">block</mat-icon>
      <p class="text-red-600 mt-4 text-lg">
        No tienes permisos para administrar solicitudes.
      </p>
      <p class="text-gray-600 mt-2">
        Contacta con el administrador del sistema.
      </p>
    </div>

    <div
      *ngIf="!loading && hasPermissions && filteredSolicitudes.length === 0"
      class="text-center py-8"
    >
      <mat-icon class="text-gray-400 text-5xl">inbox</mat-icon>
      <p class="text-gray-600 mt-4">No hay solicitudes disponibles.</p>
    </div>

    <!-- Botón para exportar PDF (agregar cerca de los filtros) -->
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold text-[#007A53]">{{ headerTitle }}</h1>
      <button
        *ngIf="hasPermissions && filteredSolicitudes.length > 0"
        (click)="exportToPDF()"
        [disabled]="exportingPDF"
        class="bg-[#007A53] text-white px-4 py-2 rounded hover:bg-[#006747] flex items-center disabled:opacity-50"
      >
        <mat-icon class="mr-2">picture_as_pdf</mat-icon>
        {{ exportingPDF ? 'Generando PDF...' : 'Exportar a PDF' }}
      </button>
    </div>

    <div
      *ngIf="!loading && hasPermissions && filteredSolicitudes.length > 0"
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
              {{ funcionesMap.get(solicitud.funcion) || solicitud.funcion }}
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
                  'bg-red-100 text-red-800': solicitud.estatus === 'canjeado'
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
  `,
  styles: [],
})
export class SuperAdminDashboard implements OnInit {
  private authService = inject(AuthService);
  private usersService = inject(UsersService);
  private rolesService = inject(RolesService);
  private funcionesService = inject(FuncionesService);
  private areasService = inject(AreasService);
  private usersAccessService = inject(UsersAccesService);
  private router = inject(Router);
  private partidosService = inject(PartidosService);
  private jornadaActivaService = inject(JornadaActivaService);
  // Nueva propiedad para controlar estado de exportación
  exportingPDF = false;
  searchTerm: string = ''; // ✅ Agrega esto
  jornadaActiva?: JornadaActiva; // Jornada activa actual
  areasConConteo: Array<{
    id: string;
    nombre: string;
    conteoUsuarios: number;
  }> = [];

  partidos: any[] = [];
  selectedPartido = '';
  jornadas: number[] = [];
  selectedJornada: number | '' = '';

  // 🔹 Paginación
  pageSize = 10;
  currentPage = 1;
  totalPages = 1;

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
      // Crear un título para el PDF
      const title = `Reporte de Solicitudes - ${new Date().toLocaleDateString()}`;

      // Crear un elemento temporal para la tabla completa
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '210mm'; // Ancho A4
      tempDiv.style.backgroundColor = '#ffffff';

      // Crear tabla con TODOS los registros filtrados
      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.fontSize = '12px';

      // Encabezados
      const thead = document.createElement('thead');
      thead.style.backgroundColor = '#007A53';
      thead.style.color = 'white';

      const headerRow = document.createElement('tr');
      [
        'Nombre',
        'Email',
        'Área',
        'Función',
        'Teléfono',
        'Estado',
        'Jornada',
      ].forEach((headerText) => {
        const th = document.createElement('th');
        th.style.padding = '8px';
        th.style.textAlign = 'left';
        th.style.border = '1px solid #ddd';
        th.textContent = headerText;
        headerRow.appendChild(th);
      });

      thead.appendChild(headerRow);
      table.appendChild(thead);

      // Cuerpo de la tabla con TODOS los registros filtrados
      const tbody = document.createElement('tbody');

      this.filteredSolicitudes.forEach((solicitud, index) => {
        const row = document.createElement('tr');
        row.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f9f9f9';

        // Nombre
        const tdNombre = document.createElement('td');
        tdNombre.style.padding = '8px';
        tdNombre.style.border = '1px solid #ddd';
        tdNombre.textContent = `${solicitud.nombre} ${solicitud.apellidoPaterno
          } ${solicitud.apellidoMaterno || ''}`;
        row.appendChild(tdNombre);

        // Email
        const tdEmail = document.createElement('td');
        tdEmail.style.padding = '8px';
        tdEmail.style.border = '1px solid #ddd';
        tdEmail.textContent = solicitud.email || '';
        row.appendChild(tdEmail);

        // Área
        const tdArea = document.createElement('td');
        tdArea.style.padding = '8px';
        tdArea.style.border = '1px solid #ddd';
        tdArea.textContent =
          this.areasMap.get(solicitud.areaId) || solicitud.areaId || '';
        row.appendChild(tdArea);

        // Función
        const tdFuncion = document.createElement('td');
        tdFuncion.style.padding = '8px';
        tdFuncion.style.border = '1px solid #ddd';
        tdFuncion.textContent =
          this.funcionesMap.get(solicitud.funcion) || solicitud.funcion || '';
        row.appendChild(tdFuncion);

        // Teléfono
        const tdTelefono = document.createElement('td');
        tdTelefono.style.padding = '8px';
        tdTelefono.style.border = '1px solid #ddd';
        tdTelefono.textContent = solicitud.telefono || '';
        row.appendChild(tdTelefono);

        // Estado
        const tdEstado = document.createElement('td');
        tdEstado.style.padding = '8px';
        tdEstado.style.border = '1px solid #ddd';
        tdEstado.textContent = solicitud.estatus || '';
        row.appendChild(tdEstado);

        // Jornada
        // En la parte donde creas la celda de Jornada
        const tdJornada = document.createElement('td');
        tdJornada.style.padding = '8px';
        tdJornada.style.border = '1px solid #ddd';
        // Convertir explícitamente a string
        tdJornada.textContent = solicitud.jornada
          ? String(solicitud.jornada)
          : 'No asignada';
        row.appendChild(tdJornada);

        tbody.appendChild(row);
      });

      table.appendChild(tbody);
      tempDiv.appendChild(table);
      document.body.appendChild(tempDiv);

      // Opciones para html2canvas
      const options = {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: tempDiv.offsetWidth,
        windowWidth: 210 * 3.78, // Convertir mm a px (210mm * 3.78px/mm)
      };

      // Convertir a canvas
      const canvas = await html2canvas(tempDiv, options);

      // Calcular dimensiones
      const imgWidth = 210; // A4 en mm
      const pageHeight = 297; // A4 en mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Crear PDF
      const pdf = new jsPDF('p', 'mm', 'a4');

      // Agregar título
      pdf.setFontSize(16);
      pdf.setTextColor(0, 122, 83);
      pdf.text(title, 10, 10);
      // 👉 CORREO DEL REGISTRANTE (debajo del título)
      const registrantEmail =
        this.filters.registrante ||
        this.filteredSolicitudes[0]?.registrantEmail ||
        'No especificado';

      // Agregar información de filtros
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Registrado por: ${registrantEmail}`, 10, 16);

      let yPosition = 20;

      // Agregar detalles de los filtros aplicados
      if (this.selectedJornada) {
        pdf.text(`Jornada: ${this.selectedJornada}`, 10, yPosition);
        yPosition += 5;
      }

      if (this.filters.area) {
        pdf.text(
          `Área: ${this.areasMap.get(this.filters.area) || this.filters.area}`,
          10,
          yPosition
        );
        yPosition += 5;
      }

      if (this.filters.estado) {
        pdf.text(`Estado: ${this.filters.estado}`, 10, yPosition);
        yPosition += 5;
      }

      if (this.filters.funcion) {
        pdf.text(
          `Función: ${this.funcionesMap.get(this.filters.funcion) || this.filters.funcion
          }`,
          10,
          yPosition
        );
        yPosition += 5;
      }

      if (this.filters.registrante) {
        pdf.text(`Registrante: ${this.filters.registrante}`, 10, yPosition);
        yPosition += 5;
      }

      // Agregar información general
      pdf.text(
        `Total de registros: ${this.filteredSolicitudes.length}`,
        10,
        yPosition + 5
      );
      yPosition += 10;

      // Agregar la imagen de la tabla
      const imgData = canvas.toDataURL('image/png');

      // Calcular si la tabla cabe en una página
      if (imgHeight < pageHeight - yPosition) {
        // Cabe en una página
        pdf.addImage(imgData, 'PNG', 10, yPosition, imgWidth - 20, imgHeight);
      } else {
        // Necesita múltiples páginas
        let heightLeft = imgHeight;
        let position = yPosition;
        let pageCount = 1;

        while (heightLeft > 0) {
          pdf.addImage(imgData, 'PNG', 10, position, imgWidth - 20, imgHeight);
          heightLeft -= pageHeight - position;

          if (heightLeft > 0) {
            pdf.addPage();
            position = -((pageHeight - yPosition) * pageCount - yPosition);
            pageCount++;
          }
        }
      }

      // Eliminar el elemento temporal
      document.body.removeChild(tempDiv);

      // Guardar el PDF
      const fecha = new Date().toISOString().split('T')[0];
      const hora = new Date()
        .toLocaleTimeString('es-MX', { hour12: false })
        .replace(/:/g, '-');
      const fileName = `reporte_solicitudes_${fecha}_${hora}.pdf`;
      pdf.save(fileName);

      console.log('✅ PDF exportado exitosamente con todos los registros');
    } catch (error) {
      console.error('❌ Error al exportar PDF:', error);
      alert('Error al generar el PDF. Por favor, intenta nuevamente.');
    } finally {
      this.exportingPDF = false;
    }
  }

  /**
   * Método alternativo: Exportar solo datos (sin captura de pantalla)
   * Útil para tablas muy grandes
   */
  exportToPDFSimple(): void {
    const pdf = new jsPDF('p', 'pt', 'a4');

    // Título
    pdf.setFontSize(18);
    pdf.setTextColor(0, 122, 83);
    pdf.text('Reporte de Solicitudes', 40, 40);

    // Información de filtros
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);

    let y = 80;
    const pageWidth = pdf.internal.pageSize.width;
    const margin = 40;
    const availableWidth = pageWidth - 2 * margin;

    // Encabezados de tabla
    const headers = [
      ['Nombre', 'Email', 'Área', 'Función', 'Teléfono', 'Estado', 'Jornada'],
    ];

    // Datos de la tabla
    const data = this.filteredSolicitudes.map((solicitud) => [
      `${solicitud.nombre} ${solicitud.apellidoPaterno}`,
      solicitud.email || '',
      this.areasMap.get(solicitud.areaId) || solicitud.areaId || '',
      this.funcionesMap.get(solicitud.funcion) || solicitud.funcion || '',
      solicitud.telefono || '',
      solicitud.estatus || '',
      solicitud.jornada || 'No asignada',
    ]);

    // Configurar tabla
    (pdf as any).autoTable({
      startY: y,
      head: headers,
      body: data,
      margin: { top: y, left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [0, 122, 83] }, // Color verde
      alternateRowStyles: { fillColor: [240, 240, 240] },
      columnStyles: {
        0: { cellWidth: availableWidth * 0.15 }, // Nombre
        1: { cellWidth: availableWidth * 0.2 }, // Email
        2: { cellWidth: availableWidth * 0.15 }, // Área
        3: { cellWidth: availableWidth * 0.15 }, // Función
        4: { cellWidth: availableWidth * 0.1 }, // Teléfono
        5: { cellWidth: availableWidth * 0.1 }, // Estado
        6: { cellWidth: availableWidth * 0.1 }, // Jornada
      },
    });

    // Pie de página
    const pageCount = (pdf as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.text(
        `Página ${i} de ${pageCount} - Generado el ${new Date().toLocaleDateString()}`,
        margin,
        pdf.internal.pageSize.height - 20
      );
    }

    // Guardar
    pdf.save(
      `reporte_solicitudes_${new Date().toISOString().split('T')[0]}.pdf`
    );
  }

  // Estado del componente
  loading = false;
  hasPermissions = false;
  processing = false;
  headerTitle = 'Dashboard Admin de Área';

  // Datos del AdminArea
  currentAdminData: User | null = null;
  adminAreas: string[] = [];
  adminFunciones: string[] = [];
  isAdminEspecial = false;

  // Solicitudes
  allSolicitudes: UserAccess[] = [];
  filteredSolicitudes: UserAccess[] = [];
  funcionesMap: Map<string, string> = new Map();
  areasMap: Map<string, string> = new Map();

  // Selección múltiple
  selectedSolicitudes: Set<string> = new Set();
  selectAll = false;

  // Filtros
  filters = {
    area: '',
    estado: '',
    funcion: '',
    registrante: '',
  };
  showFilters = false; // Comienza oculto

  // Opciones para filtros
  uniqueAreas: string[] = [];
  uniqueFunciones: string[] = [];
  uniqueRegistrantes: string[] = [];

  // Contadores
  pendingCount = 0;
  approvedCount = 0;
  rejectedCount = 0;
  loadPartidos() {
    this.partidosService.getPartidos$().subscribe((partidos: any[]) => {
      this.partidos = partidos;

      // 👉 EXTRAER JORNADAS ÚNICAS PARA EL SELECT
      const jornadasSet = new Set<number>();
      partidos.forEach((p) => {
        if (p.jornada !== undefined) {
          jornadasSet.add(p.jornada);
        }
      });

      this.jornadas = Array.from(jornadasSet).sort((a, b) => a - b);
    });
  }

  /**
   * Obtener el partido correspondiente a una jornada
   */
  getPartidoByJornada(jornada: number | ''): string {
    if (jornada === '' || !this.partidos.length) {
      return 'Todas';
    }

    const partido = this.partidos.find((p) => p.jornada === jornada);
    if (partido) {
      return `${partido.equipo_local} vs ${partido.equipo_visitante}`;
    }

    return 'No asignado';
  }

  /**
   * Toggle para mostrar/ocultar filtros
   */
  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  /**
   * Cargar la jornada activa
   */
  loadJornadaActiva(): void {
    this.jornadaActivaService.getJornadasActivas$().subscribe({
      next: (jornadas: JornadaActiva[]) => {
        this.jornadaActiva = jornadas.length ? jornadas[0] : undefined;

        if (!this.jornadaActiva) {
          console.warn('⚠️ No hay jornada activa');
        } else {
          console.log('✅ Jornada activa cargada:', this.jornadaActiva);
          // Recalcular áreas con conteo cuando cambia la jornada
          this.calculateAreasConteo();
        }
      },
      error: (error) => {
        console.error('❌ Error cargando jornada activa:', error);
        this.jornadaActiva = undefined;
      },
    });
  }

  /**
   * Calcular el conteo de usuarios por área para la jornada activa
   */
  calculateAreasConteo(): void {
    if (!this.jornadaActiva) {
      this.areasConConteo = [];
      return;
    }

    // Filtrar usuarios de la jornada activa
    const usuariosJornadaActiva = this.allSolicitudes.filter(
      (s) => s.jornada === this.jornadaActiva?.jornada
    );

    // Crear un mapa para contar usuarios por área
    const conteoMap = new Map<string, number>();

    usuariosJornadaActiva.forEach((solicitud) => {
      if (solicitud.areaId) {
        const count = conteoMap.get(solicitud.areaId) || 0;
        conteoMap.set(solicitud.areaId, count + 1);
      }
    });

    // Crear array con todas las áreas y sus conteos
    const todasLasAreas: Area[] = [];
    this.areasMap.forEach((nombre, id) => {
      todasLasAreas.push({ id, nombre } as Area);
    });

    this.areasConConteo = todasLasAreas
      .map((area) => ({
        id: area.id || '',
        nombre: area.nombre,
        conteoUsuarios: conteoMap.get(area.id || '') || 0,
      }))
      .sort((a, b) => b.conteoUsuarios - a.conteoUsuarios); // Ordenar por mayor conteo

    console.log('📊 Conteo de usuarios por área:', this.areasConConteo);
  }

  /**
   * Obtener el total de usuarios de la jornada activa
   */
  getTotalUsuariosJornadaActiva(): number {
    if (!this.jornadaActiva) return 0;

    return this.allSolicitudes.filter(
      (s) => s.jornada === this.jornadaActiva?.jornada
    ).length;
  }

  async ngOnInit() {
    console.log('🚀 Iniciando AdminArea Dashboard...');
    this.loadPartidos();
    this.loadJornadaActiva(); // Cargar jornada activa
    this.loading = true;
    try {
      await this.loadFunciones();
      await this.loadAreas();
      await this.loadAdminData();
      if (this.hasPermissions) {
        await this.loadSolicitudes();
        this.calculateAreasConteo(); // Calcular conteo de usuarios por área
      } else {
        console.warn('⚠️ No se cargarán solicitudes - sin permisos');
        this.loading = false;
      }
    } catch (error) {
      console.error('❌ Error en ngOnInit:', error);
      this.loading = false;
    }
  }

  async loadFunciones() {
    try {
      console.log('📚 Cargando funciones...');
      const funciones = await this.funcionesService.getFunciones();
      funciones.forEach((func) => {
        if (func.id) {
          this.funcionesMap.set(func.id, func.nombre);
        }
      });
      console.log('✅ Mapa de funciones cargado:', this.funcionesMap);
    } catch (error) {
      console.error('❌ Error cargando funciones:', error);
    }
  }

  async loadAreas() {
    try {
      console.log('🏢 Cargando áreas...');
      const areas = await this.areasService.getAreas();
      areas.forEach((area) => {
        if (area.id) {
          this.areasMap.set(area.id, area.nombre);
        }
      });
      console.log('✅ Mapa de áreas cargado:', this.areasMap);
    } catch (error) {
      console.error('❌ Error cargando áreas:', error);
    }
  }

  /**
   * Cargar datos del AdminArea desde Firestore
   */
  private async loadAdminData() {
    try {
      console.log('🔍 Iniciando carga de datos del AdminArea...');

      const currentUser = this.authService.getCurrentUser();

      // ✅ SUPER ADMIN
      if (currentUser?.email === SUPER_ADMIN_EMAIL) {
        this.hasPermissions = true;
        this.isAdminEspecial = true;
        this.headerTitle = 'Panel Super Admin';
        return;
      }

      // ⬇️ lo demás queda IGUAL
      this.currentAdminData = await this.usersService.getUserByEmail(
        currentUser!.email!
      );
      console.log('🔍 Iniciando carga de datos del AdminArea...');
      console.log('🔍 Usuario actual (getCurrentUser):', currentUser?.email);

      if (!currentUser?.email) {
        console.log('❌ No hay email del usuario');
        this.hasPermissions = false;
        return;
      }

      console.log('📞 Consultando datos del usuario en Firestore...');
      this.currentAdminData = await this.usersService.getUserByEmail(
        currentUser.email
      );

      console.log(
        '📋 Datos del AdminArea desde Firestore:',
        this.currentAdminData
      );

      if (!this.currentAdminData) {
        console.log('❌ No se encontraron datos del usuario');
        this.hasPermissions = false;
        return;
      }

      // Obtener áreas y funciones del AdminArea
      this.adminAreas = this.currentAdminData.areaIds || [];
      this.adminFunciones = this.currentAdminData.funcionIds || [];

      console.log('✅ Áreas del AdminArea:', this.adminAreas);
      console.log('✅ Áreas length:', this.adminAreas.length);
      console.log('✅ Funciones del AdminArea:', this.adminFunciones);
      console.log('✅ Funciones length:', this.adminFunciones.length);

      // Verificar si es AdminEspecial
      const roles = await this.rolesService.getRoles();
      const userRole = roles.find((r) => r.id === this.currentAdminData?.role);
      this.isAdminEspecial = userRole?.name === 'AdminEspecial';

      console.log('👤 Rol del usuario:', userRole?.name);
      console.log('🔑 Es AdminEspecial:', this.isAdminEspecial);

      // AdminEspecial tiene acceso completo sin restricciones
      // Para otros roles, verificar que tengan al menos un área y una función
      if (this.isAdminEspecial) {
        this.hasPermissions = true;
        console.log('✅ AdminEspecial detectado: acceso completo otorgado');
      } else {
        this.hasPermissions =
          this.adminAreas.length > 0 && this.adminFunciones.length > 0;

        console.log('🔍 Evaluación de permisos:', {
          areasLength: this.adminAreas.length,
          funcionesLength: this.adminFunciones.length,
          condition1: this.adminAreas.length > 0,
          condition2: this.adminFunciones.length > 0,
          hasPermissions: this.hasPermissions,
        });
      }

      // ✅ Actualizar título con apodo
      if (this.currentAdminData.apodo) {
        this.headerTitle = `Bienvenido ${this.currentAdminData.apodo}`;
      }

      console.log('🔐 Tiene permisos:', this.hasPermissions);
    } catch (error) {
      console.error('Error cargando datos del AdminArea:', error);
      this.hasPermissions = false;
    }
  }

  /**
   * Cargar todas las solicitudes y filtrarlas según permisos
   */
  async loadSolicitudes() {
    if (!this.hasPermissions) {
      console.log('⚠️ No se cargan solicitudes porque no tiene permisos');
      this.loading = false;
      return;
    }

    this.loading = true;
    try {
      // Obtener todas las solicitudes de usersAccess
      this.allSolicitudes = await this.usersAccessService.getUsers();
      console.log(
        '📥 Total de solicitudes en Firestore:',
        this.allSolicitudes.length
      );

      // Filtrar en memoria según permisos
      this.filteredSolicitudes = this.allSolicitudes.filter((solicitud) => {
        return this.canViewSolicitud(solicitud);
      });

      console.log('✅ Solicitudes filtradas:', this.filteredSolicitudes.length);

      // Actualizar contadores
      this.updateCounts();

      // Extraer opciones únicas para filtros
      this.extractFilterOptions();
      this.currentPage = 1;
      this.updatePagination(); // 🔥 ESTO FALTABA
    } catch (error) {
      console.error('Error cargando solicitudes:', error);
      this.filteredSolicitudes = [];
    } finally {
      this.loading = false;
    }
  }

  /**
   * Extraer opciones únicas para los filtros
   */
  private extractFilterOptions() {
    const areas = new Set<string>();
    const funciones = new Set<string>();
    const registrantes = new Set<string>();

    this.allSolicitudes
      .filter((s) => this.canViewSolicitud(s))
      .forEach((sol) => {
        if (sol.areaId) areas.add(sol.areaId);
        if (sol.funcion) funciones.add(sol.funcion);
        if (sol.registrantEmail) registrantes.add(sol.registrantEmail);
      });

    this.uniqueAreas = Array.from(areas);
    this.uniqueFunciones = Array.from(funciones);
    this.uniqueRegistrantes = Array.from(registrantes);
  }

  /**
   * Aplicar filtros a las solicitudes
   */
  applyFilters() {
    let filtered = this.allSolicitudes.filter((solicitud) =>
      this.canViewSolicitud(solicitud)
    );

    // Filtro de búsqueda por ID, nombre o correo
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter((s) => {
        const id = s.id?.toLowerCase() || '';
        const nombre = `${s.nombre || ''} ${s.apellidoPaterno || ''} ${s.apellidoMaterno || ''
          }`.toLowerCase();
        const email = s.email?.toLowerCase() || '';

        return (
          id.includes(searchLower) ||
          nombre.includes(searchLower) ||
          email.includes(searchLower)
        );
      });
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
    // ✅ FILTRO POR JORNADA - Asegúrate de manejar undefined
    if (this.selectedJornada !== '') {
      filtered = filtered.filter((s) => s.jornada === this.selectedJornada);
    }

    this.filteredSolicitudes = filtered;
    this.updateCounts();
    this.selectedSolicitudes.clear();
    this.selectAll = false;
    this.currentPage = 1;
    this.updatePagination();
    this.calculateAreasConteo(); // Recalcular conteo de áreas después de filtrar
  }

  /**
   * Toggle selección individual
   */
  toggleSelection(id: string) {
    if (this.selectedSolicitudes.has(id)) {
      this.selectedSolicitudes.delete(id);
    } else {
      this.selectedSolicitudes.add(id);
    }
    this.updateSelectAll();
  }

  /**
   * Toggle seleccionar todas
   */
  toggleSelectAll() {
    if (this.selectAll) {
      // Seleccionar solo las pendientes que pueden gestionarse
      this.filteredSolicitudes.forEach((sol) => {
        if (
          sol.id &&
          sol.estatus === 'pendiente' &&
          this.canManageSolicitud(sol)
        ) {
          this.selectedSolicitudes.add(sol.id);
        }
      });
    } else {
      this.selectedSolicitudes.clear();
    }
  }

  /**
   * Actualizar estado de selectAll
   */
  private updateSelectAll() {
    const pendientes = this.filteredSolicitudes.filter(
      (s) => s.estatus === 'pendiente' && this.canManageSolicitud(s)
    );
    this.selectAll =
      pendientes.length > 0 &&
      pendientes.every((s) => s.id && this.selectedSolicitudes.has(s.id));
  }

  /**
   * Obtener cantidad de solicitudes pendientes
   */
  getPendienteCount(): number {
    return this.filteredSolicitudes.filter(
      (s) => s.estatus === 'pendiente' && this.canManageSolicitud(s)
    ).length;
  }

  /**
   * Verificar si el AdminArea puede ver esta solicitud
   * Regla: AdminEspecial puede ver todas las solicitudes
   * Otros roles: areaId debe estar en adminAreas AND funcion debe estar en adminFunciones
   */
  private canViewSolicitud(solicitud: UserAccess): boolean {
    // AdminEspecial puede ver todas las solicitudes
    if (this.isAdminEspecial) {
      return true;
    }

    if (!solicitud.areaId || !solicitud.funcion) {
      console.log('❌ Solicitud sin areaId o funcion:', solicitud);
      return false;
    }

    // Limpiar espacios y normalizar
    const solicitudAreaId = solicitud.areaId.trim();
    const solicitudFuncion = solicitud.funcion.trim();

    const hasArea = this.adminAreas.some(
      (area) => area.trim() === solicitudAreaId
    );
    const hasFuncion = this.adminFunciones.some(
      (func) => func.trim() === solicitudFuncion
    );

    console.log('🔍 Verificando solicitud:', {
      solicitudAreaId: solicitudAreaId,
      solicitudFuncion: solicitudFuncion,
      adminAreas: this.adminAreas,
      adminFunciones: this.adminFunciones,
      hasArea: hasArea,
      hasFuncion: hasFuncion,
      result: hasArea && hasFuncion,
      solicitudNombre: solicitud.nombre,
    });

    return hasArea && hasFuncion;
  }

  /**
   * Verificar si el AdminArea puede gestionar esta solicitud
   */
  canManageSolicitud(solicitud: UserAccess): boolean {
    return this.canViewSolicitud(solicitud);
  }

  /**
   * Aprobar solicitudes seleccionadas
   */
  async aprobarSeleccionadas() {
    if (this.selectedSolicitudes.size === 0) {
      alert('No hay solicitudes seleccionadas');
      return;
    }

    const confirmacion = confirm(
      `¿Está seguro de aprobar ${this.selectedSolicitudes.size} solicitud(es)?`
    );
    if (!confirmacion) return;

    this.processing = true;
    const currentUser = this.authService.getCurrentUser();
    const reviewerEmail = currentUser?.email || 'desconocido';
    let exitosos = 0;
    let fallidos = 0;

    for (const id of this.selectedSolicitudes) {
      const solicitud = this.allSolicitudes.find((s) => s.id === id);
      if (!solicitud || !this.canManageSolicitud(solicitud)) continue;

      try {
        // Actualizar en Firestore
        // ✅ El correo se enviará automáticamente por Cloud Function
        await this.usersAccessService.updateUser(id, {
          estatus: 'aprobado',
          reviewedBy: reviewerEmail,
          reviewedAt: new Date(),
        });

        console.log('✅ Solicitud aprobada:', solicitud.email);
        console.log('📧 Cloud Function enviará el correo automáticamente');

        // Actualizar localmente
        solicitud.estatus = 'aprobado';
        solicitud.reviewedBy = reviewerEmail;
        solicitud.reviewedAt = new Date();
        exitosos++;
      } catch (error) {
        console.error('Error aprobando solicitud:', id, error);
        fallidos++;
      }
    }

    this.selectedSolicitudes.clear();
    this.selectAll = false;
    this.updateCounts();
    this.processing = false;

    if (exitosos > 0) {
      alert(
        `✅ Aprobadas: ${exitosos}\n❌ Fallidas: ${fallidos}\n\n📧 Los correos se enviarán automáticamente por Cloud Functions.`
      );
    } else {
      alert(`❌ No se pudo aprobar ninguna solicitud. Fallidas: ${fallidos}`);
    }
  }

  /**
   * Rechazar solicitudes seleccionadas
   */
  async rechazarSeleccionadas() {
    if (this.selectedSolicitudes.size === 0) {
      alert('No hay solicitudes seleccionadas');
      return;
    }

    const confirmacion = confirm(
      `¿Está seguro de rechazar ${this.selectedSolicitudes.size} solicitud(es)?`
    );
    if (!confirmacion) return;

    this.processing = true;
    const currentUser = this.authService.getCurrentUser();
    const reviewerEmail = currentUser?.email || 'desconocido';
    let exitosos = 0;
    let fallidos = 0;

    for (const id of this.selectedSolicitudes) {
      const solicitud = this.allSolicitudes.find((s) => s.id === id);
      if (!solicitud || !this.canManageSolicitud(solicitud)) continue;

      try {
        // Actualizar en Firestore
        // ✅ El correo se enviará automáticamente por Cloud Function
        await this.usersAccessService.updateUser(id, {
          estatus: 'canjeado',
          reviewedBy: reviewerEmail,
          reviewedAt: new Date(),
        });

        console.log('✅ Solicitud rechazada:', solicitud.email);
        console.log('📧 Cloud Function enviará el correo automáticamente');

        // Actualizar localmente
        solicitud.estatus = 'canjeado';
        solicitud.reviewedBy = reviewerEmail;
        solicitud.reviewedAt = new Date();
        exitosos++;
      } catch (error) {
        console.error('Error rechazando solicitud:', id, error);
        fallidos++;
      }
    }

    this.selectedSolicitudes.clear();
    this.selectAll = false;
    this.updateCounts();
    this.processing = false;

    alert(`✅ Rechazadas: ${exitosos}\n❌ Fallidas: ${fallidos}`);
  }

  /**
   * Actualizar contadores de solicitudes
   */
  private updateCounts() {
    this.pendingCount = this.filteredSolicitudes.filter(
      (s) => s.estatus === 'pendiente'
    ).length;
    this.approvedCount = this.filteredSolicitudes.filter(
      (s) => s.estatus === 'aprobado'
    ).length;
    this.rejectedCount = this.filteredSolicitudes.filter(
      (s) => s.estatus === 'canjeado'
    ).length;
  }

  async logout() {
    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }

  goToRegistro() {
    this.router.navigate(['/user/registro']);
  }

  downloadPDF(pdfUrl: string, userName: string): void {
    if (!pdfUrl) {
      console.error('No hay URL de PDF disponible');
      return;
    }

    // Crear un elemento anchor temporal para descargar
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.target = '_blank';
    link.download = `acreditacion_${userName.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
