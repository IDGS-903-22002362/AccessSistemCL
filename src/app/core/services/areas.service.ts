import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from '@angular/fire/firestore';

export interface Area {
  id?: string;
  nombre: string;
  descripcion?: string;
  empresaId?: string;
  createdAt?: any;
  updatedAt?: any;
}

@Injectable({
  providedIn: 'root',
})
export class AreasService {
  private firestore = inject(Firestore);
  private collectionName = 'areas';

  /**
   * Crear área
   */
  async createArea(areaData: Omit<Area, 'id'>): Promise<string> {
    try {
      const areasCollection = collection(this.firestore, this.collectionName);
      const docRef = await addDoc(areasCollection, {
        ...areaData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creando área:', error);
      throw error;
    }
  }

  /**
   * Obtener todas las áreas
   */
  async getAreas(): Promise<Area[]> {
    try {
      const areasCollection = collection(this.firestore, this.collectionName);
      const snapshot = await getDocs(areasCollection);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Area[];
    } catch (error) {
      console.error('Error obteniendo áreas:', error);
      throw error;
    }
  }

  /**
   * Actualizar área
   */
  async updateArea(areaId: string, areaData: Partial<Area>): Promise<void> {
    try {
      const areaDoc = doc(this.firestore, this.collectionName, areaId);
      await updateDoc(areaDoc, {
        ...areaData,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error actualizando área:', error);
      throw error;
    }
  }

  /**
   * Eliminar área
   */
  async deleteArea(areaId: string): Promise<void> {
    try {
      const areaDoc = doc(this.firestore, this.collectionName, areaId);
      await deleteDoc(areaDoc);
    } catch (error) {
      console.error('Error eliminando área:', error);
      throw error;
    }
  }
}
