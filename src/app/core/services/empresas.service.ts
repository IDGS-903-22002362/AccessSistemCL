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

export interface Empresa {
  id?: string;
  nombre: string;
  descripcion?: string;
  createdAt?: any;
  updatedAt?: any;
}

@Injectable({
  providedIn: 'root',
})
export class EmpresasService {
  private firestore = inject(Firestore);
  private collectionName = 'empresas';

  /**
   * Crear empresa
   */
  async createEmpresa(empresaData: Omit<Empresa, 'id'>): Promise<string> {
    try {
      const empresasCollection = collection(
        this.firestore,
        this.collectionName
      );
      const docRef = await addDoc(empresasCollection, {
        ...empresaData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creando empresa:', error);
      throw error;
    }
  }

  /**
   * Obtener todas las empresas
   */
  async getEmpresas(): Promise<Empresa[]> {
    try {
      const empresasCollection = collection(
        this.firestore,
        this.collectionName
      );
      const snapshot = await getDocs(empresasCollection);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Empresa[];
    } catch (error) {
      console.error('Error obteniendo empresas:', error);
      throw error;
    }
  }

  /**
   * Actualizar empresa
   */
  async updateEmpresa(
    empresaId: string,
    empresaData: Partial<Empresa>
  ): Promise<void> {
    try {
      const empresaDoc = doc(this.firestore, this.collectionName, empresaId);
      await updateDoc(empresaDoc, {
        ...empresaData,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error actualizando empresa:', error);
      throw error;
    }
  }

  /**
   * Eliminar empresa
   */
  async deleteEmpresa(empresaId: string): Promise<void> {
    try {
      const empresaDoc = doc(this.firestore, this.collectionName, empresaId);
      await deleteDoc(empresaDoc);
    } catch (error) {
      console.error('Error eliminando empresa:', error);
      throw error;
    }
  }
}
