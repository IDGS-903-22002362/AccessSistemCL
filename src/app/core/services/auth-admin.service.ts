import { Injectable, inject } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
} from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthAdminService {
  private auth = inject(Auth);

  /**
   * Verifica si un email ya existe en Firebase Auth
   */
  async emailExists(email: string): Promise<boolean> {
    try {
      const methods = await fetchSignInMethodsForEmail(this.auth, email);
      return methods.length > 0;
    } catch (error: any) {
      console.error('Error verificando email:', error);
      throw new Error('Error al verificar el email');
    }
  }

  /**
   * Crea un usuario en Firebase Auth
   */
  async createUser(email: string, password: string): Promise<any> {
    try {
      // Verificar si el email ya existe
      const exists = await this.emailExists(email);
      if (exists) {
        throw new Error('El email ya está registrado');
      }

      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      return userCredential.user;
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('El email ya está registrado');
      }
      throw error;
    }
  }
}
