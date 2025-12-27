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

export interface User {
  id?: string;
  email: string;
  apodo?: string;
  role: string;
  empresaId?: string;
  areaIds?: string[];
  funcionIds?: string[];
  createdAt?: any;
  updatedAt?: any;
}

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private firestore = inject(Firestore);
  private collectionName = 'users';

  /**
   * Crear usuario en Firestore
   */
  async createUser(userData: Omit<User, 'id'>): Promise<string> {
    try {
      const usersCollection = collection(this.firestore, this.collectionName);
      // Normalizar email a minúsculas
      const normalizedData = {
        ...userData,
        email: userData.email.toLowerCase().trim(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      const docRef = await addDoc(usersCollection, normalizedData);
      return docRef.id;
    } catch (error) {
      console.error('Error creando usuario:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los usuarios
   */
  async getUsers(): Promise<User[]> {
    try {
      const usersCollection = collection(this.firestore, this.collectionName);
      const snapshot = await getDocs(usersCollection);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      throw error;
    }
  }

  /**
   * Obtener usuario por email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const usersCollection = collection(this.firestore, this.collectionName);
      // Normalizar email a minúsculas para búsqueda case-insensitive
      const normalizedEmail = email.toLowerCase().trim();
      const q = query(usersCollection, where('email', '==', normalizedEmail));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.log('⚠️ No se encontró usuario con email:', normalizedEmail);
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      } as User;
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      throw error;
    }
  }

  /**
   * Obtener rol del usuario actual por email
   */
  async getUserRole(email: string): Promise<string | null> {
    try {
      const user = await this.getUserByEmail(email);
      return user?.role || null;
    } catch (error) {
      console.error('Error obteniendo rol:', error);
      return null;
    }
  }

  /**
   * Obtener datos completos del usuario por email
   */
  async getUserData(email: string): Promise<User | null> {
    return this.getUserByEmail(email);
  }

  /**
   * Actualizar usuario
   */
  async updateUser(userId: string, userData: Partial<User>): Promise<void> {
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
