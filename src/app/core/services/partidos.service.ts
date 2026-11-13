import { Injectable, inject } from '@angular/core';
import {
  Database,
  ref,
  query,
  orderByChild,
  equalTo,
  listVal,
  objectVal,
} from '@angular/fire/database';
import { Observable, map, of, firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';
import { JornadaActiva } from './jornadas.service';

export type TorneoTipo = 'apertura' | 'clausura';

export interface Partido {
  equipo_local: string;
  equipo_visitante: string;
  estadio: string;
  fecha: string;
  hora: string;
  jornada: number;
  activo?: boolean;
}

/** Resultado al ubicar una jornada activa en el calendario año/torneo. */
export interface TorneoResuelto {
  year: string;
  torneo: TorneoTipo;
  partidos: Partido[];
  partido: Partido;
}

@Injectable({ providedIn: 'root' })
export class PartidosService {
  private db = inject(Database);
  private readonly basePath = 'torneo/liga mx';

  private partidosPath(year: string | number, torneo: string): string {
    return `${this.basePath}/${year}/${torneo}/partidos`;
  }

  /**
   * Años disponibles bajo torneo/liga mx (orden descendente).
   */
  getAniosDisponibles$(): Observable<string[]> {
    const ligaRef = ref(this.db, this.basePath);
    return objectVal<Record<string, unknown>>(ligaRef).pipe(
      map((data) => {
        if (!data) return [];
        return Object.keys(data).sort((a, b) => Number(b) - Number(a));
      })
    );
  }

  /**
   * Torneos disponibles en un año (apertura / clausura).
   */
  getTorneosDisponibles$(year: string | number): Observable<TorneoTipo[]> {
    if (year === null || year === undefined || year === '') {
      return of([]);
    }
    const yearRef = ref(this.db, `${this.basePath}/${year}`);
    return objectVal<Record<string, unknown>>(yearRef).pipe(
      map((data) => {
        if (!data) return [];
        const allowed: TorneoTipo[] = ['apertura', 'clausura'];
        return allowed.filter((t) =>
          Object.prototype.hasOwnProperty.call(data, t)
        );
      })
    );
  }

  /**
   * Partidos de un año/torneo. Por defecto Clausura 2026 (compatibilidad).
   */
  getPartidos$(
    year: string | number = '2026',
    torneo: string = 'clausura'
  ): Observable<Partido[]> {
    const partidosRef = ref(this.db, this.partidosPath(year, torneo));
    return listVal(partidosRef).pipe(
      map((partidos) => (partidos as Partido[]) ?? [])
    );
  }

  /**
   * Solo partidos activos del año/torneo indicado.
   */
  getPartidosActivos$(
    year: string | number = '2026',
    torneo: string = 'clausura'
  ): Observable<Partido[]> {
    const partidosRef = ref(this.db, this.partidosPath(year, torneo));
    const partidosQuery = query(
      partidosRef,
      orderByChild('activo'),
      equalTo(true)
    );
    return listVal(partidosQuery).pipe(
      map((partidos) => (partidos as Partido[]) ?? [])
    );
  }

  /**
   * Ubica en el calendario el (año, torneo) que contiene la jornada activa
   * (match por jornada + equipos + fecha).
   */
  async resolveTorneoDeJornadaActiva(
    jornadaActiva: Pick<
      JornadaActiva,
      'jornada' | 'equipo_local' | 'equipo_visitante' | 'fecha'
    >
  ): Promise<TorneoResuelto | null> {
    const anios = await firstValueFrom(
      this.getAniosDisponibles$().pipe(take(1))
    );

    for (const year of anios) {
      const torneos = await firstValueFrom(
        this.getTorneosDisponibles$(year).pipe(take(1))
      );

      for (const torneo of torneos) {
        const partidos = await firstValueFrom(
          this.getPartidos$(year, torneo).pipe(take(1))
        );

        const partido = partidos.find((p) =>
          this.partidoCoincideConJornada(p, jornadaActiva)
        );

        if (partido) {
          return { year, torneo, partidos, partido };
        }
      }
    }

    return null;
  }

  /** Match completo: jornada + equipos + fecha. */
  partidoCoincideConJornada(
    partido: Partido,
    jornada: Pick<
      JornadaActiva,
      'jornada' | 'equipo_local' | 'equipo_visitante' | 'fecha'
    >
  ): boolean {
    return (
      partido.jornada === jornada.jornada &&
      this.normalizeTeam(partido.equipo_local) ===
        this.normalizeTeam(jornada.equipo_local) &&
      this.normalizeTeam(partido.equipo_visitante) ===
        this.normalizeTeam(jornada.equipo_visitante) &&
      this.normalizeFechaKey(partido.fecha) ===
        this.normalizeFechaKey(jornada.fecha)
    );
  }

  normalizeTeam(value: string | undefined | null): string {
    return (value || '').trim().toLowerCase();
  }

  normalizeFechaKey(fecha: string | undefined | null): string {
    const parsed = this.parseFechaPartido(fecha);
    if (!parsed) return (fecha || '').trim();
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  parseFechaPartido(fecha: string | undefined | null): Date | null {
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
      const date = new Date(
        Number(iso[1]),
        Number(iso[2]) - 1,
        Number(iso[3])
      );
      return isNaN(date.getTime()) ? null : date;
    }
    const fallback = new Date(trimmed);
    return isNaN(fallback.getTime()) ? null : fallback;
  }
}
