import { Injectable, inject } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  User,
  user,
  authState,
  UserCredential,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
} from '@angular/fire/auth';
import { Observable, from, ReplaySubject } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  private authStateSubject = new ReplaySubject<User | null>(1);
  private authReadyPromise: Promise<void>;

  // Observable del usuario actual
  user$: Observable<User | null> = user(this.auth);

  // Observable del estado de autenticación usando ReplaySubject
  // Esto asegura que siempre obtengamos el último valor conocido
  authState$: Observable<User | null> = this.authStateSubject.asObservable();

  // Observable booleano de autenticación
  isAuthenticated$: Observable<boolean> = this.authState$.pipe(
    map((user) => {
      console.log(
        '🔐 Estado de autenticación:',
        user ? 'Autenticado' : 'No autenticado'
      );
      return !!user;
    })
  );

  constructor() {
    // Log para debugging
    console.log('✅ AuthService inicializado');

    // Crear promesa que se resuelve cuando onAuthStateChanged se ejecuta por primera vez
    this.authReadyPromise = new Promise<void>((resolve) => {
      // Escuchar cambios de autenticación y actualizar el subject
      // onAuthStateChanged se ejecuta inmediatamente con el estado actual
      // incluyendo sesiones persistidas en localStorage
      onAuthStateChanged(this.auth, (user) => {
        if (user) {
          console.log('👤 Usuario detectado:', user.email);
        } else {
          console.log('🚪 No hay usuario autenticado');
        }
        this.authStateSubject.next(user);
        resolve(); // Resolver la promesa la primera vez que se ejecuta
      });
    });
  }

  /**
   * Esperar a que Firebase verifique el estado de autenticación
   * Debe ser llamado antes de verificar el estado del usuario
   */
  async waitForAuthReady(): Promise<void> {
    return this.authReadyPromise;
  }

  /**
   * Login con email y password
   * @param email - Email del usuario
   * @param password - Contraseña del usuario
   * @returns Promise con el usuario autenticado
   * @throws Error con mensaje específico de Firebase
   */
  async login(email: string, password: string): Promise<User> {
    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      return userCredential.user;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Registro de nuevo usuario
   * @param email - Email del usuario
   * @param password - Contraseña del usuario
   * @returns Promise con el usuario registrado
   * @throws Error con mensaje específico de Firebase
   */
  async register(email: string, password: string): Promise<User> {
    try {
      const userCredential: UserCredential =
        await createUserWithEmailAndPassword(this.auth, email, password);
      return userCredential.user;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Logout
   * @returns Promise void
   */
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Enviar email de recuperación de contraseña
   * @param email - Email del usuario
   * @returns Promise void
   */
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Actualizar perfil del usuario
   * @param displayName - Nombre a mostrar
   * @param photoURL - URL de la foto de perfil
   */
  async updateUserProfile(
    displayName?: string,
    photoURL?: string
  ): Promise<void> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      throw new Error('No hay usuario autenticado');
    }

    try {
      await updateProfile(currentUser, {
        displayName: displayName || currentUser.displayName,
        photoURL: photoURL || currentUser.photoURL,
      });
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Obtener usuario actual
   * @returns Usuario actual o null
   */
  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  /**
   * Verificar si hay sesión activa (síncrono)
   * @returns true si hay usuario autenticado
   */
  isAuthenticated(): boolean {
    return this.auth.currentUser !== null;
  }

  /**
   * Obtener el token del usuario actual
   * @returns Promise con el token o null
   */
  async getIdToken(): Promise<string | null> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) return null;

    try {
      return await currentUser.getIdToken();
    } catch (error) {
      console.error('Error al obtener token:', error);
      return null;
    }
  }

  /**
   * Manejo centralizado de errores de Firebase Auth
   * @param error - Error de Firebase
   * @returns Error con mensaje amigable
   */
  private handleAuthError(error: any): Error {
    let message = 'Ha ocurrido un error inesperado';

    switch (error.code) {
      case 'auth/invalid-email':
        message = 'El correo electrónico no es válido';
        break;
      case 'auth/user-disabled':
        message = 'Esta cuenta ha sido deshabilitada';
        break;
      case 'auth/user-not-found':
        message = 'No existe una cuenta con este correo electrónico';
        break;
      case 'auth/wrong-password':
        message = 'La contraseña es incorrecta';
        break;
      case 'auth/email-already-in-use':
        message = 'Ya existe una cuenta con este correo electrónico';
        break;
      case 'auth/weak-password':
        message = 'La contraseña debe tener al menos 6 caracteres';
        break;
      case 'auth/operation-not-allowed':
        message = 'Operación no permitida';
        break;
      case 'auth/invalid-credential':
        message = 'Las credenciales proporcionadas son incorrectas';
        break;
      case 'auth/too-many-requests':
        message = 'Demasiados intentos fallidos. Intenta más tarde';
        break;
      case 'auth/network-request-failed':
        message = 'Error de conexión. Verifica tu internet';
        break;
      default:
        message = error.message || 'Error al procesar la solicitud';
        console.error('Error de Firebase Auth:', error);
    }

    return new Error(message);
  }
}
