import { Injectable, inject } from '@angular/core';
import { Storage, ref, getDownloadURL } from '@angular/fire/storage';

@Injectable({ providedIn: 'root' })
export class EscudosService {
  private storage = inject(Storage);

  // Mapa de equipos a archivos de escudos
  private readonly escudos: Record<string, string> = {
    america: 'america.png',
    atlas: 'atlas.png',
    chivas: 'chivas.png',
    cruzazul: 'cruzazul.png',
    juarez: 'juarez.png',
    leon: 'leon.png',
    mazatlan: 'mazatlan.png',
    monterrey: 'monterrey.png',
    necaxa: 'necaxa.png',
    pachuca: 'pachuca.png',
    puebla: 'puebla.png',
    pumas: 'pumas.png',
    queretaro: 'queretaro.png',
    santos: 'santos.png',
    tigres: 'tigres.png',
    toluca: 'toluca.png',
    tijuana: 'tijuana.png',
  };

  // Normaliza el nombre del equipo
  private normalizar(equipo: string): string {
    return equipo
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Elimina acentos
      .replace(/[^a-z ]/g, '')
      .trim();
  }

  // Encuentra el archivo de escudo para un equipo
  private archivoEscudo(equipo: string): string | null {
    const key = this.normalizar(equipo);

    // Match exacto
    if (this.escudos[key]) {
      return this.escudos[key];
    }

    // Match por palabras (ej: "pumas unam" -> "pumas")
    const palabras = key.split(' ');
    for (const palabra of palabras) {
      if (this.escudos[palabra]) {
        return this.escudos[palabra];
      }
    }

    return null;
  }

  // Obtiene la URL del escudo desde Firebase Storage
  async getEscudoUrl(equipo: string): Promise<string | null> {
    const archivo = this.archivoEscudo(equipo);

    if (!archivo) {
      console.log(`No se encontró archivo para el equipo: ${equipo}`);
      return null;
    }

    try {
      // Intentar primero en la raíz del bucket (como en el ejemplo de Flutter)
      const escudoRef = ref(this.storage, archivo);
      const url = await getDownloadURL(escudoRef);
      console.log(`Escudo encontrado para ${equipo}: ${url}`);
      return url;
    } catch (error) {
      console.warn(
        `Escudo no encontrado en raíz para ${equipo}, intentando en /images/`
      );

      // Si falla, intentar en la carpeta /images/
      try {
        const escudoRef = ref(this.storage, `images/${archivo}`);
        const url = await getDownloadURL(escudoRef);
        console.log(`Escudo encontrado en /images/ para ${equipo}: ${url}`);
        return url;
      } catch (error2) {
        console.error(`Error obteniendo escudo para ${equipo}:`, error2);
        return null;
      }
    }
  }

  // Obtiene URLs de ambos escudos para un partido
  async getEscudosPartido(
    equipoLocal: string,
    equipoVisitante: string
  ): Promise<{
    local: string | null;
    visitante: string | null;
  }> {
    const [local, visitante] = await Promise.all([
      this.getEscudoUrl(equipoLocal),
      this.getEscudoUrl(equipoVisitante),
    ]);

    return { local, visitante };
  }
}
