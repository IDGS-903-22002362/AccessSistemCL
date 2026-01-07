import { Injectable, inject } from '@angular/core';
import {
    Database,
    ref,
    query,
    orderByChild,
    equalTo,
    listVal
} from '@angular/fire/database';
import { Observable, map } from 'rxjs';

export interface Partido {
    equipo_local: string;
    equipo_visitante: string;
    estadio: string;
    fecha: string;
    hora: string;
    jornada: number;
    activo?: boolean;
}

@Injectable({ providedIn: 'root' })
export class PartidosService {

    private db = inject(Database);

    /**
     * Obtiene TODOS los partidos del Clausura 2026
     */
    getPartidos$(): Observable<Partido[]> {
        const partidosRef = ref(
            this.db,
            'torneo/liga mx/2026/clausura/partidos'
        );

        return listVal(partidosRef).pipe(
            map(partidos => partidos as Partido[])
        );
    }

    /**
     * Obtiene SOLO partidos activos (si manejas el campo activo)
     */
    getPartidosActivos$(): Observable<Partido[]> {
        const partidosRef = ref(
            this.db,
            'torneo/liga mx/2026/clausura/partidos'
        );

        const partidosQuery = query(
            partidosRef,
            orderByChild('activo'),
            equalTo(true)
        );

        return listVal(partidosQuery).pipe(
            map(partidos => partidos as Partido[])
        );
    }
}
