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
import { Subject } from 'rxjs';

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
  codigoPulsera?: string; // Código de la pulsera que se asignará al usuario
  estatus: 'pendiente' | 'aprobado' | 'canjeado';
  reviewedBy?: string; // Email de quien aprobó/rechazó
  reviewedAt?: any; // Timestamp de cuándo se aprobó/rechazó
  createdAt?: any; // Timestamp de cuándo se creó
  updatedAt?: any; // Timestamp de última actualización
  pdfUrl?: string; // URL del PDF de acreditación generado
  emailSent?: boolean; // Indica si el email fue enviado
  emailSentAt?: any; // Timestamp de cuándo se envió el email

}

@Injectable({
  providedIn: 'root',
})
export class UsersAccesService {
  private firestore = inject(Firestore);
  private collectionName = 'usersAccess';
  private userCreatedSource = new Subject<void>();
  userCreated$ = this.userCreatedSource.asObservable();


  //Este me permite escuchar cuando haya un usuario insertado para que se actualice la tabla de dashboard
  notifyUserCreated() {
    this.userCreatedSource.next();
  }

  /**
   * Crear usuario en Firestore
   */
  async createUser(
    userData: Omit<UserAccess, 'id' | 'registrantEmail'>,
    registrantEmail: string
  ): Promise<string> {
    try {
      const usersCollection = collection(this.firestore, this.collectionName);
      const docRef = await addDoc(usersCollection, {
        ...userData,
        registrantEmail,
        codigoPulsera: userData.codigoPulsera || 'SIN_PULSERA_ASIGNADA', // Valor por defecto si no se proporciona
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      this.notifyUserCreated();
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

  async getUsersByRegistrant(email: string): Promise<UserAccess[]> {
    const usersCollection = collection(this.firestore, this.collectionName);
    const q = query(usersCollection, where('registrantEmail', '==', email));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as UserAccess[];
  }

  async getUsersByRegistrantAndStatus(
    email: string,
    estatus: 'pendiente' | 'aprobado' | 'rechazado'
  ): Promise<UserAccess[]> {
    const usersCollection = collection(this.firestore, this.collectionName);
    const q = query(
      usersCollection,
      where('registrantEmail', '==', email),
      where('estatus', '==', estatus)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as UserAccess[];
  }
}
