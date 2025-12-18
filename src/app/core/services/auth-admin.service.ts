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
   * Si el email ya existe, lanza el error original de Firebase para ser manejado
   */
  async createUser(email: string, password: string): Promise<any> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      return userCredential.user;
    } catch (error: any) {
      // Mantener el error original con su código para manejo posterior
      throw error;
    }
  }
}
