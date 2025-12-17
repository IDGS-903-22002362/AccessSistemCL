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

export interface Role {
  id?: string;
  name: string;
  description?: string;
  permissions?: string[];
  createdAt?: any;
  updatedAt?: any;
}

@Injectable({
  providedIn: 'root',
})
export class RolesService {
  private firestore = inject(Firestore);
  private collectionName = 'roles';

  /**
   * Crear rol
   */
  async createRole(roleData: Omit<Role, 'id'>): Promise<string> {
    try {
      const rolesCollection = collection(this.firestore, this.collectionName);
      const docRef = await addDoc(rolesCollection, {
        ...roleData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creando rol:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los roles
   */
  async getRoles(): Promise<Role[]> {
    try {
      const rolesCollection = collection(this.firestore, this.collectionName);
      const snapshot = await getDocs(rolesCollection);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Role[];
    } catch (error) {
      console.error('Error obteniendo roles:', error);
      throw error;
    }
  }

  /**
   * Actualizar rol
   */
  async updateRole(roleId: string, roleData: Partial<Role>): Promise<void> {
    try {
      const roleDoc = doc(this.firestore, this.collectionName, roleId);
      await updateDoc(roleDoc, {
        ...roleData,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error actualizando rol:', error);
      throw error;
    }
  }

  /**
   * Eliminar rol
   */
  async deleteRole(roleId: string): Promise<void> {
    try {
      const roleDoc = doc(this.firestore, this.collectionName, roleId);
      await deleteDoc(roleDoc);
    } catch (error) {
      console.error('Error eliminando rol:', error);
      throw error;
    }
  }
}
