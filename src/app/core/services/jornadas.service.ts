import { Injectable, inject } from '@angular/core';
import {
  Database,
  ref,
  query,
  orderByChild,
  equalTo,
  onValue,
} from '@angular/fire/database';
import { Observable } from 'rxjs';

export interface JornadaActiva {
  activo: boolean;
  equipo_local: string;
  equipo_visitante: string;
  estadio: string;
  fecha: string;
  hora: string;
  jornada: number;
}

@Injectable({ providedIn: 'root' })
export class JornadaActivaService {
  private db = inject(Database);

  getJornadasActivas$(): Observable<JornadaActiva[]> {
    return new Observable((observer) => {
      const jornadasRef = ref(this.db, 'jornada_activa');

      console.log('🔍 Consultando jornadas activas desde Realtime Database...');

      const unsubscribe = onValue(
        jornadasRef,
        (snapshot) => {
          const data = snapshot.val();
          console.log('📦 Datos recibidos de jornada_activa:', data);

          if (data) {
            const jornadasArray: JornadaActiva[] = Object.values(data);
            console.log('📋 Jornadas como array:', jornadasArray);

            // Filtrar solo las activas
            const jornadasActivas = jornadasArray.filter(
              (j) => j.activo === true
            );
            console.log('✅ Jornadas activas encontradas:', jornadasActivas);

            observer.next(jornadasActivas);
          } else {
            console.warn('⚠️ No hay datos en jornada_activa');
            observer.next([]);
          }
        },
        (error) => {
          console.error('❌ Error obteniendo jornadas activas:', error);
          observer.error(error);
        }
      );

      return () => unsubscribe();
    });
  }

  /**
   * Obtiene todas las jornadas (activas e inactivas) ordenadas por número de jornada
   */
  getAllJornadas$(): Observable<JornadaActiva[]> {
    const jornadasRef = ref(this.db, 'jornada_activa');

    console.log('🔍 Consultando TODAS las jornadas desde Realtime Database...');

    return new Observable((observer) => {
      const unsubscribe = onValue(
        jornadasRef,
        (snapshot) => {
          const data = snapshot.val();
          console.log('📦 Datos recibidos de jornada_activa (todas):', data);

          if (data) {
            // Convertir el objeto a array
            const jornadasArray: JornadaActiva[] = Object.values(data);
            console.log('📋 Todas las jornadas como array:', jornadasArray);

            // Ordenar por número de jornada descendente (más recientes primero)
            const sortedJornadas = jornadasArray.sort(
              (a, b) => b.jornada - a.jornada
            );
            console.log('✅ Jornadas ordenadas:', sortedJornadas);

            observer.next(sortedJornadas);
          } else {
            console.warn('⚠️ No hay datos en jornada_activa (getAllJornadas)');
            observer.next([]);
          }
        },
        (error) => {
          console.error('❌ Error obteniendo todas las jornadas:', error);
          observer.error(error);
        }
      );

      // Cleanup function
      return () => unsubscribe();
    });
  }
}
