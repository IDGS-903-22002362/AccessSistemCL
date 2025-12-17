import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  CollectionReference,
  DocumentData,
} from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  private firestore = inject(Firestore);

  constructor() {}

  /**
   * Agregar documento a colección (auto-genera ID)
   */
  addDocument(collectionPath: string, data: any): Observable<any> {
    const collectionRef = collection(this.firestore, collectionPath);
    return from(addDoc(collectionRef, data));
  }

  /**
   * Crear o actualizar documento con ID específico
   */
  setDocument(
    collectionPath: string,
    docId: string,
    data: any
  ): Observable<void> {
    const docRef = doc(this.firestore, collectionPath, docId);
    return from(setDoc(docRef, data));
  }

  /**
   * Obtener documento por ID
   */
  getDocument(collectionPath: string, docId: string): Observable<any> {
    const docRef = doc(this.firestore, collectionPath, docId);
    return from(getDoc(docRef));
  }

  /**
   * Obtener todos los documentos de una colección
   */
  getDocuments(collectionPath: string): Observable<any> {
    const collectionRef = collection(this.firestore, collectionPath);
    return from(getDocs(collectionRef));
  }

  /**
   * Actualizar documento
   */
  updateDocument(
    collectionPath: string,
    docId: string,
    data: any
  ): Observable<void> {
    const docRef = doc(this.firestore, collectionPath, docId);
    return from(updateDoc(docRef, data));
  }

  /**
   * Eliminar documento
   */
  deleteDocument(collectionPath: string, docId: string): Observable<void> {
    const docRef = doc(this.firestore, collectionPath, docId);
    return from(deleteDoc(docRef));
  }

  /**
   * Query con condiciones
   */
  queryDocuments(
    collectionPath: string,
    field: string,
    operator: any,
    value: any
  ): Observable<any> {
    const collectionRef = collection(this.firestore, collectionPath);
    const q = query(collectionRef, where(field, operator, value));
    return from(getDocs(q));
  }
}
