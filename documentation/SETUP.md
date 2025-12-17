# Sistema de Accesos - Angular 20 + Firebase

Proyecto Angular moderno configurado con todas las tecnologías y librerías requeridas para desarrollo empresarial.

## ✅ Stack Tecnológico Implementado

### Core

- **Angular 20** con Standalone Components
- **TypeScript 5.8.2**
- **Router** con Lazy Loading y Guards

### Firebase

- **@angular/fire 20.0.1**
- **firebase 11.10.0**
- Firebase Authentication
- Cloud Firestore
- Cloud Storage

### UI/UX

- **Angular Material 20.2.14** (Indigo/Pink theme, animations habilitadas)
- **Tailwind CSS 3.4.x** (configurado con PostCSS)
- Responsive design con Tailwind utilities

### Librerías para Funcionalidades Futuras

- **xlsx** - Lectura y generación de archivos Excel
- **pdfmake** - Generación de documentos PDF
- **angularx-qrcode 18** - Generación de códigos QR
- **@angular/forms** - Reactive Forms

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── core/
│   │   ├── guards/
│   │   │   ├── auth.guard.ts          # Protección de rutas autenticadas
│   │   │   └── role.guard.ts          # Protección de rutas por rol (admin)
│   │   └── services/
│   │       ├── auth.service.ts        # Login, logout, gestión de sesión
│   │       └── firestore.service.ts   # Operaciones CRUD en Firestore
│   ├── features/
│   │   ├── auth/
│   │   │   └── login.component.ts     # Página de login con Material
│   │   ├── user/
│   │   │   └── user-dashboard.component.ts  # Dashboard de usuario
│   │   └── admin/
│   │       ├── admin-dashboard.component.ts # Dashboard de administrador
│   │       └── solicitudes.component.ts     # Gestión de solicitudes
│   ├── app.config.ts                  # Configuración de providers
│   ├── app.routes.ts                  # Definición de rutas
│   ├── app.ts                         # Componente principal
│   └── app.html                       # Template principal
├── environments/
│   ├── environment.ts                 # Configuración desarrollo
│   └── environment.prod.ts            # Configuración producción
└── styles.css                         # Estilos globales + Tailwind + Material

Archivos de configuración:
├── tailwind.config.js                 # Configuración de Tailwind CSS
├── postcss.config.js                  # PostCSS con Tailwind y Autoprefixer
├── angular.json                       # Configuración de Angular CLI
├── tsconfig.json                      # Configuración de TypeScript
└── package.json                       # Dependencias del proyecto
```

## 🚀 Instalación y Configuración

### 1. Instalación de dependencias

```bash
npm install --legacy-peer-deps
```

### 2. Configurar Firebase

Edita los archivos de environment con tus credenciales de Firebase:

**src/environments/environment.ts:**

```typescript
export const environment = {
  production: false,
  firebaseConfig: {
    apiKey: "TU_API_KEY",
    authDomain: "TU_AUTH_DOMAIN",
    projectId: "TU_PROJECT_ID",
    storageBucket: "TU_STORAGE_BUCKET",
    messagingSenderId: "TU_MESSAGING_SENDER_ID",
    appId: "TU_APP_ID",
  },
};
```

### 3. Ejecutar el proyecto

```bash
# Desarrollo
ng serve

# Producción
ng build --configuration production
```

## 🛡️ Sistema de Rutas y Guards

### Rutas Configuradas

| Ruta                 | Componente              | Guard                 | Descripción                      |
| -------------------- | ----------------------- | --------------------- | -------------------------------- |
| `/`                  | Redirect                | -                     | Redirige a `/login`              |
| `/login`             | LoginComponent          | -                     | Página de inicio de sesión       |
| `/user`              | UserDashboardComponent  | authGuard             | Dashboard de usuario autenticado |
| `/admin`             | AdminDashboardComponent | authGuard, adminGuard | Dashboard de administrador       |
| `/admin/solicitudes` | SolicitudesComponent    | authGuard, adminGuard | Gestión de solicitudes           |

### Guards Implementados

- **authGuard**: Verifica si el usuario está autenticado
- **adminGuard/roleGuard**: Verifica roles (placeholder, pendiente implementación completa)

## 🔥 Servicios Firebase

### AuthService

```typescript
// Login
await authService.login(email, password);

// Registro
await authService.register(email, password);

// Logout
await authService.logout();

// Observable del usuario actual
authService.user$.subscribe((user) => console.log(user));
```

### FirestoreService

```typescript
// Agregar documento
firestoreService.addDocument("coleccion", data);

// Obtener documento
firestoreService.getDocument("coleccion", "docId");

// Actualizar documento
firestoreService.updateDocument("coleccion", "docId", data);

// Eliminar documento
firestoreService.deleteDocument("coleccion", "docId");

// Query con filtros
firestoreService.queryDocuments("coleccion", "campo", "==", "valor");
```

## 🎨 Componentes UI Implementados

### Login Component

- Formulario reactivo con validación
- Material Design (mat-form-field, mat-input, mat-button)
- Estilos con Tailwind CSS
- Manejo de errores

### Dashboards

- **User Dashboard**: Cards con estadísticas, tabla de solicitudes
- **Admin Dashboard**: Sidebar navigation, múltiples vistas, gestión completa

### Características UI

- ✅ Responsive design
- ✅ Material Icons
- ✅ Tailwind utilities
- ✅ Animaciones de Material
- ✅ Theme Indigo/Pink

## 📦 Dependencias Instaladas

### Dependencias de Producción

```json
{
  "@angular/core": "^20.0.0",
  "@angular/fire": "^20.0.1",
  "@angular/material": "^20.2.14",
  "firebase": "^11.10.0",
  "xlsx": "latest",
  "pdfmake": "latest",
  "angularx-qrcode": "^18.0.2"
}
```

### Dependencias de Desarrollo

```json
{
  "@angular/cli": "^20.0.3",
  "tailwindcss": "^3.4.0",
  "postcss": "^8.5.6",
  "autoprefixer": "^10.4.23",
  "typescript": "~5.8.2"
}
```

## 🔧 Comandos Utilizados

```bash
# Creación del proyecto (ya ejecutado)
ng new accesos --routing --standalone

# Instalación de Angular Material (ya ejecutado)
ng add @angular/material

# Instalación de librerías obligatorias
npm install xlsx pdfmake angularx-qrcode@18 @types/pdfmake --save --legacy-peer-deps

# Instalación de Tailwind CSS
npm install -D tailwindcss@^3.4.0 postcss autoprefixer --legacy-peer-deps
```

## ⚠️ Notas Importantes

### Node.js Version Warning

Si ves advertencias sobre Node.js v25.2.1 (versión impar), considera usar una versión LTS (v20.x o v22.x) para producción.

### Tailwind CSS Version

- Instalamos **Tailwind CSS 3.4.x** (no 4.x) por compatibilidad con Angular
- Tailwind CSS 4.x requiere `@tailwindcss/postcss` y tiene una arquitectura diferente

### Angular Material Import Warning

El warning sobre `@import` rules es normal y no afecta la funcionalidad. Es causado por cómo Tailwind genera el CSS.

### Legacy Peer Dependencies

Usamos `--legacy-peer-deps` debido a incompatibilidades de versión en `angularx-qrcode@18` con Angular 20.

## 📝 TODOs / Pendientes

### Implementación de Lógica de Negocio

- [ ] Implementar sistema de roles completo en Firestore
- [ ] Conectar guards con roles reales
- [ ] Implementar funcionalidad de Excel (lectura/escritura)
- [ ] Implementar generación de PDF con pdfmake
- [ ] Implementar generación de códigos QR
- [ ] Crear sistema de correo electrónico
- [ ] Integración con WhatsApp (si aplica)

### Firebase Functions

- [ ] Configurar Firebase Functions para backend
- [ ] Implementar Cloud Functions para procesos del servidor

### Testing

- [ ] Escribir tests unitarios
- [ ] Configurar tests e2e

## 🌐 URLs del Proyecto

- **Desarrollo**: http://localhost:4200
- **Firebase Console**: https://console.firebase.google.com

## 📚 Recursos

- [Angular Documentation](https://angular.dev)
- [Angular Material](https://material.angular.io)
- [Tailwind CSS](https://tailwindcss.com)
- [Firebase Documentation](https://firebase.google.com/docs)
- [AngularFire](https://github.com/angular/angularfire)

## ✅ Checklist de Setup Completado

- [x] Angular 20 con Standalone Components
- [x] Routing con Lazy Loading
- [x] Firebase (Auth + Firestore + Storage) configurado
- [x] Environments creados (dev y prod)
- [x] Angular Material instalado y configurado
- [x] Tailwind CSS instalado y funcionando
- [x] Guards (auth y role) implementados
- [x] Servicios base (AuthService, FirestoreService)
- [x] Componentes placeholder (Login, User Dashboard, Admin Dashboard)
- [x] Librerías futuras instaladas (xlsx, pdfmake, angularx-qrcode)
- [x] Reactive Forms habilitados
- [x] Proyecto compila sin errores

---

**Estado del Proyecto**: ✅ **LISTO PARA DESARROLLO**

El proyecto está completamente configurado y listo para comenzar a implementar la lógica de negocio específica de tu sistema de accesos.
