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
import { documentId } from '@angular/fire/firestore';
import { query, where } from 'firebase/firestore';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';

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
  private authService = inject(AuthService);
  private usersService = inject(UsersService);

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

  async getEmpresasByIds(empresaIds: string[]): Promise<Empresa[]> {
    if (!empresaIds.length) {
      return [];
    }

    const empresasCollection = collection(this.firestore, this.collectionName);

    const q = query(
      empresasCollection,
      where(documentId(), 'in', empresaIds)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Empresa[];
  }
  async getEmpresasPorUsuarioLogueado(): Promise<Empresa[]> {
    const authUser = this.authService.getCurrentUser();

    if (!authUser?.email) {
      throw new Error('Usuario no autenticado');
    }

    const userData =
      await this.usersService.getUserWithRoleNameByEmail(authUser.email);

    if (!userData?.roleName) {
      return [];
    }

    // 🔑 SOLO AdminEspecial puede elegir empresa
    if (userData.roleName === 'AdminEspecial') {
      return this.getEmpresas(); // 👈 TODAS las empresas
    }


    // Otros roles NO ven selector
    return [];
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
