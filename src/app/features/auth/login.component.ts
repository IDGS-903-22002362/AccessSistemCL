import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { UsersService } from '../../core/services/users.service';
import { RolesService } from '../../core/services/roles.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div
      class="login-container min-h-screen flex items-center justify-center p-4"
    >
      <mat-card class="w-full max-w-md shadow-lg glass-card">
        <mat-card-header class="pb-4">
          <div class="w-full text-center flex flex-col items-center">
            <img
              src="images/leon.png"
              alt="Logo"
              class="w-24 h-24 mb-4 object-contain"
            />
            <mat-card-title class="text-3xl font-bold text-gray-800 mb-2">
              Iniciar Sesión
            </mat-card-title>
            <mat-card-subtitle class="text-base">
              Sistema de Accesos
            </mat-card-subtitle>
          </div>
        </mat-card-header>

        <mat-card-content class="pt-4">
          <form
            [formGroup]="loginForm"
            (ngSubmit)="onSubmit()"
            class="flex flex-col gap-4"
          >
            <mat-form-field appearance="fill" class="w-full">
              <mat-label>Correo electrónico</mat-label>
              <mat-icon matIconPrefix>email</mat-icon>
              <input
                matInput
                type="email"
                formControlName="email"
                placeholder="ejemplo@correo.com"
              />
              @if (loginForm.get('email')?.hasError('required') &&
              loginForm.get('email')?.touched) {
              <mat-error>El correo es requerido</mat-error>
              } @if (loginForm.get('email')?.hasError('email')) {
              <mat-error>Correo inválido</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="fill" class="w-full">
              <mat-label>Contraseña</mat-label>
              <mat-icon matIconPrefix>lock</mat-icon>
              <input
                matInput
                [type]="hidePassword ? 'password' : 'text'"
                formControlName="password"
              />
              <button
                mat-icon-button
                matIconSuffix
                type="button"
                (click)="hidePassword = !hidePassword"
                [attr.aria-label]="'Hide password'"
                [attr.aria-pressed]="hidePassword"
              >
                <mat-icon>{{
                  hidePassword ? 'visibility_off' : 'visibility'
                }}</mat-icon>
              </button>
              @if (loginForm.get('password')?.hasError('required') &&
              loginForm.get('password')?.touched) {
              <mat-error>La contraseña es requerida</mat-error>
              }
            </mat-form-field>

            @if (errorMessage) {
            <div
              class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg"
            >
              {{ errorMessage }}
            </div>
            } @if (loadingRole) {
            <div
              class="flex items-center justify-center gap-3 text-blue-600 py-2"
            >
              <mat-spinner diameter="24"></mat-spinner>
              <span>Cargando perfil...</span>
            </div>
            }

            <button
              mat-raised-button
              color="primary"
              type="submit"
              class="w-full h-12 text-base"
              [disabled]="loginForm.invalid || loading || loadingRole"
            >
              {{ loading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100vh;
        position: relative;
      }

      .login-container {
        width: 100%;
        height: 100%;
        min-height: 100vh;
        position: relative;
        z-index: 1;
        background-image: url('/images/_NCS4410.jpg');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .glass-card {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.3);
      }

      mat-card {
        padding: 2rem;
        width: 100%;
        max-width: 28rem;
      }

      mat-card-content {
        padding: 0 1rem !important;
      }

      form {
        width: 100%;
      }

      mat-form-field {
        width: 100%;
      }

      mat-card-header {
        display: flex !important;
        justify-content: center;
        align-items: center;
        margin-bottom: 1.5rem;
        padding: 1rem !important;
        width: 100%;
      }

      mat-card-header > div {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      mat-card-header .mat-mdc-card-header-text {
        display: none;
      }

      mat-card-header img {
        max-width: 96px !important;
        max-height: 96px !important;
        width: 96px !important;
        height: 96px !important;
        object-fit: contain;
        margin: 0 auto;
      }

      mat-card-title,
      mat-card-subtitle {
        text-align: center;
        width: 100%;
      }
    `,
  ],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private usersService = inject(UsersService);
  private rolesService = inject(RolesService);

  loginForm: FormGroup;
  hidePassword = true;
  loading = false;
  loadingRole = false;
  errorMessage = '';

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.valid) {
      this.loading = true;
      this.loadingRole = false;
      this.errorMessage = '';

      try {
        const { email, password } = this.loginForm.value;
        console.log('🔐 Intentando login con:', email);
        await this.authService.login(email, password);
        console.log('✅ Login exitoso en Firebase Auth');

        // Redirección especial para super admin
        if (email === 'luisrosasbocanegra@gmail.com') {
          this.router.navigate(['/super-admin/users']);
          return;
        }

        // Cargar rol del usuario
        this.loading = false;
        this.loadingRole = true;

        console.log('📋 Consultando datos del usuario en Firestore...');
        const userData = await this.usersService.getUserByEmail(email);
        console.log('📋 Datos del usuario obtenidos:', userData);

        if (!userData || !userData.role) {
          console.error('❌ Usuario sin rol asignado');
          this.errorMessage =
            'Usuario sin rol asignado. Contacte al administrador.';
          this.loadingRole = false;
          await this.authService.logout();
          return;
        }

        console.log('📚 Consultando roles disponibles...');
        const roles = await this.rolesService.getRoles();
        console.log('📚 Roles obtenidos:', roles);
        const userRole = roles.find((r) => r.id === userData.role);
        console.log('👤 Rol del usuario:', userRole);

        if (!userRole) {
          console.error('❌ Rol no encontrado');
          this.errorMessage = 'Rol no válido. Contacte al administrador.';
          this.loadingRole = false;
          await this.authService.logout();
          return;
        }

        // Redirigir según el rol
        this.loadingRole = false;
        console.log('🚀 Redirigiendo a:', userRole.name);

        try {
          switch (userRole.name) {
            case 'Registrante':
              console.log('➡️ Navegando a /user');
              await this.router.navigate(['/user']);
              console.log('✅ Navegación completada a /user');
              break;
            case 'AdminArea':
              console.log('➡️ Navegando a /admin-area');
              await this.router.navigate(['/admin-area']);
              console.log('✅ Navegación completada a /admin-area');
              break;
            case 'AdminEspecial':
              console.log('➡️ Navegando a /user (AdminEspecial)');
              const result = await this.router.navigate(['/user']);
              console.log('✅ Navegación completada:', result);
              break;
            default:
              this.errorMessage =
                'Rol no reconocido. Contacte al administrador.';
              this.loadingRole = false;
              await this.authService.logout();
          }
        } catch (navError) {
          console.error('❌ Error en navegación:', navError);
          this.errorMessage =
            'Error al redirigir. Por favor recarga la página.';
        }
      } catch (error: any) {
        console.error('❌ Error en login:', error);
        console.error('❌ Error code:', error.code);
        console.error('❌ Error message:', error.message);

        // Mensajes de error más específicos
        let errorMsg = 'Error al iniciar sesión. Verifica tus credenciales.';

        if (
          error.code === 'permission-denied' ||
          error.message?.includes('permission')
        ) {
          errorMsg = 'Error de permisos. Verifica las reglas de Firestore.';
        } else if (
          error.code === 'unavailable' ||
          error.message?.includes('Failed to get document')
        ) {
          errorMsg =
            'Error de conexión con Firestore. Verifica tu conexión a internet.';
        } else if (error.message) {
          errorMsg = error.message;
        }

        this.errorMessage = errorMsg;
        this.loading = false;
        this.loadingRole = false;
      }
    }
  }
}

// Particle Class
class Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  color: string;
  opacity: number;
  density: number;
  angle: number;

  constructor(
    x: number,
    y: number,
    size: number,
    color: string,
    opacity: number
  ) {
    this.x = x;
    this.y = y;
    this.baseX = x;
    this.baseY = y;
    this.size = size;
    this.color = color;
    this.opacity = opacity;
    this.density = Math.random() * 20 + 1;
    this.angle = Math.random() * 360;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }

  update(mouse: { x: number; y: number; radius: number }) {
    let dx = mouse.x - this.x;
    let dy = mouse.y - this.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    let forceDirectionX = dx / distance;
    let forceDirectionY = dy / distance;

    const maxDistance = mouse.radius;
    let force = (maxDistance - distance) / maxDistance;

    if (force < 0) force = 0;

    let directionX = forceDirectionX * force * this.density;
    let directionY = forceDirectionY * force * this.density;

    if (distance < mouse.radius) {
      this.x -= directionX * 3;
      this.y -= directionY * 3;
    } else {
      const homeX = this.baseX + Math.cos(this.angle) * 10;
      const homeY = this.baseY + Math.sin(this.angle) * 10;

      let dx = this.x - homeX;
      let dy = this.y - homeY;
      this.x -= dx / 20;
      this.y -= dy / 20;
    }

    this.angle += 0.05;
  }
}
