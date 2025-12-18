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
        const jornadasRef = ref(this.db, 'jornada_activa');

        const jornadasQuery = query(
            jornadasRef,
            orderByChild('activo'),
            equalTo(true)
        );

        return listVal(jornadasQuery).pipe(
            map(jornadas => jornadas as JornadaActiva[])
        );
    }
}
