import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
} from '@angular/fire/firestore';

export interface UserAccess {
  id?: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  funcion: string;
  telefono: string;
  email: string;
  empresaId: string;
  areaId: string;
  registrantEmail?: string;
  estatus: 'pendiente' | 'aprobado' | 'rechazado';
  createdAt?: any;
}

@Injectable({
  providedIn: 'root',
})
export class UsersAccesService {
  private firestore = inject(Firestore);
  private collectionName = 'usersAccess';

  /**
   * Crear usuario en Firestore
   */
  async createUser(userData: Omit<UserAccess, 'id'>): Promise<string> {
    try {
      const usersCollection = collection(this.firestore, this.collectionName);
      const docRef = await addDoc(usersCollection, {
        ...userData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los usuarios
   */
  async getUsers(): Promise<UserAccess[]> {
    try {
      const usersCollection = collection(this.firestore, this.collectionName);
      const snapshot = await getDocs(usersCollection);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as UserAccess[];
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      throw error;
    }
  }

  /**
   * Obtener usuario por email
   */
  async getUserByEmail(email: string): Promise<UserAccess | null> {
    try {
      const usersCollection = collection(this.firestore, this.collectionName);
      const q = query(usersCollection, where('email', '==', email));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      } as UserAccess;
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      throw error;
    }
  }

  /**
   * Obtener rol del usuario actual por email
   */

  /**
   * Obtener datos completos del usuario por email
   */
  async getUserData(email: string): Promise<UserAccess | null> {
    return this.getUserByEmail(email);
  }

  /**
   * Actualizar usuario
   */
  async updateUser(
    userId: string,
    userData: Partial<UserAccess>
  ): Promise<void> {
    try {
      const userDoc = doc(this.firestore, this.collectionName, userId);
      await updateDoc(userDoc, {
        ...userData,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      throw error;
    }
  }

  /**
   * Eliminar usuario
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      const userDoc = doc(this.firestore, this.collectionName, userId);
      await deleteDoc(userDoc);
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      throw error;
    }
  }
}
