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

export interface Funcion {
  id?: string;
  nombre: string;
  descripcion?: string;
  createdAt?: any;
  updatedAt?: any;
}

@Injectable({
  providedIn: 'root',
})
export class FuncionesService {
  private firestore = inject(Firestore);
  private collectionName = 'funciones';

  /**
   * Crear función
   */
  async createFuncion(funcionData: Omit<Funcion, 'id'>): Promise<string> {
    try {
      const funcionesCollection = collection(
        this.firestore,
        this.collectionName
      );
      const docRef = await addDoc(funcionesCollection, {
        ...funcionData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creando función:', error);
      throw error;
    }
  }

  /**
   * Obtener todas las funciones
   */
  async getFunciones(): Promise<Funcion[]> {
    try {
      const funcionesCollection = collection(
        this.firestore,
        this.collectionName
      );
      const snapshot = await getDocs(funcionesCollection);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Funcion[];
    } catch (error) {
      console.error('Error obteniendo funciones:', error);
      throw error;
    }
  }

  /**
   * Actualizar función
   */
  async updateFuncion(
    funcionId: string,
    funcionData: Partial<Funcion>
  ): Promise<void> {
    try {
      const funcionDoc = doc(this.firestore, this.collectionName, funcionId);
      await updateDoc(funcionDoc, {
        ...funcionData,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error actualizando función:', error);
      throw error;
    }
  }

  /**
   * Eliminar función
   */
  async deleteFuncion(funcionId: string): Promise<void> {
    try {
      const funcionDoc = doc(this.firestore, this.collectionName, funcionId);
      await deleteDoc(funcionDoc);
    } catch (error) {
      console.error('Error eliminando función:', error);
      throw error;
    }
  }
}
