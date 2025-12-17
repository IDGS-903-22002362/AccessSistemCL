# Sistema de Roles y Autenticación

## 🔐 Resumen de Implementación

Se ha implementado un sistema completo de autenticación basado en roles con detección automática y protección de rutas.

## 👤 Roles Disponibles

### 1. Super Admin

- **Email:** `luisrosasbocanegra@gmail.com`
- **Ruta:** `/super-admin/users`
- **Permisos:** Acceso total al sistema, gestión de usuarios, roles, empresas y áreas
- **Restricción:** NO puede acceder a `/user` ni `/admin-area`

### 2. Registrante

- **Ruta:** `/user`
- **Permisos:** Registro de personas en áreas asignadas
- **Campo requerido en Firestore:**
  - `role`: ID del rol "Registrante"
  - `empresaId`: ID de la empresa
  - `areaIds`: Array de IDs de áreas donde puede registrar
- **Restricción:** NO puede acceder a `/admin-area` ni `/super-admin`

### 3. AdminArea

- **Ruta:** `/admin-area`
- **Permisos:** Revisar y aprobar/rechazar solicitudes en áreas asignadas
- **Campo requerido en Firestore:**
  - `role`: ID del rol "AdminArea"
  - `empresaId`: ID de la empresa
  - `areaIds`: Array de IDs de áreas donde tiene permisos
- **Restricción:** NO puede acceder a `/user` ni `/super-admin`

## 🛡️ Guards Implementados

### 1. authGuard

**Ubicación:** `src/app/core/guards/auth.guard.ts`

- Valida que el usuario esté autenticado
- Redirige a `/login` si no está autenticado
- Guarda la URL intentada en queryParams para redirección post-login

### 2. superAdminGuard

**Ubicación:** `src/app/core/guards/super-admin.guard.ts`

- Valida que el email sea exactamente `luisrosasbocanegra@gmail.com`
- Redirige a `/` si el usuario no es super admin
- Se ejecuta solo en rutas `/super-admin/*`

### 3. registranteGuard

**Ubicación:** `src/app/core/guards/registrante.guard.ts`

- Consulta el rol del usuario en Firestore
- Permite acceso solo si el rol es "Registrante"
- Redirige según el rol real del usuario:
  - AdminArea → `/admin-area`
  - Otros → `/login`

### 4. adminGuard (actualizado)

**Ubicación:** `src/app/core/guards/role.guard.ts`

- Consulta el rol del usuario en Firestore
- Permite acceso solo si el rol es "AdminArea"
- Redirige según el rol real del usuario:
  - Registrante → `/user`
  - Otros → `/login`

### 5. roleGuard (genérico)

**Ubicación:** `src/app/core/guards/role.guard.ts`

- Guard genérico que acepta roles permitidos desde `route.data['allowedRoles']`
- Consulta el rol del usuario en Firestore
- Redirige según el rol del usuario si no tiene permiso

## 🔄 Flujo de Autenticación

### Login

1. Usuario ingresa email y password
2. Se autentica con Firebase Auth
3. **Si es super admin:** Redirige a `/super-admin/users`
4. **Si NO es super admin:**
   - Consulta Firestore para obtener el documento del usuario
   - Obtiene el `roleId` del usuario
   - Consulta la colección `roles` para obtener el nombre del rol
   - Valida que el rol exista
   - **Redirige según rol:**
     - `Registrante` → `/user`
     - `AdminArea` → `/admin-area`
   - Si no tiene rol o rol inválido:
     - Muestra error
     - Hace logout
     - Mantiene en login

### Navegación Manual (URL directa)

1. Usuario intenta acceder a una ruta protegida
2. `authGuard` verifica autenticación
3. Guard específico (registranteGuard/adminGuard) consulta Firestore
4. Obtiene el rol del usuario
5. Valida si tiene permiso
6. **Si tiene permiso:** Permite acceso
7. **Si NO tiene permiso:** Redirige a su ruta correspondiente

## 🗺️ Configuración de Rutas

```typescript
{
  path: 'user',
  canActivate: [authGuard, registranteGuard],
  // Solo Registrante
}

{
  path: 'admin-area',
  canActivate: [authGuard, adminGuard],
  // Solo AdminArea
}

{
  path: 'super-admin',
  canActivate: [superAdminGuard],
  // Solo luisrosasbocanegra@gmail.com
}
```

## 🔒 Seguridad Implementada

### 1. Validación en cada petición

- Los guards ejecutan consultas a Firestore en CADA navegación
- No se almacena el rol en localStorage
- No se confía en variables del frontend

### 2. Protección contra acceso manual

- Intentar acceder directamente por URL activa los guards
- El usuario es redirigido automáticamente a su ruta correspondiente
- No hay forma de bypassear los guards desde el frontend

### 3. Validación de existencia de rol

- Se valida que el usuario tenga un rol asignado
- Se valida que el rol exista en la colección `roles`
- Se valida que el nombre del rol sea válido

### 4. Feedback al usuario

- Loading spinner mientras se carga el perfil
- Mensajes de error específicos:
  - "Usuario sin rol asignado"
  - "Rol no válido"
  - "Rol no reconocido"

## 📊 Estructura de Datos en Firestore

### Colección: users

```typescript
{
  email: "usuario@ejemplo.com",
  role: "roleId123",           // ID del documento en 'roles'
  empresaId: "empresaId456",   // Opcional
  areaIds: ["areaId1", "areaId2"], // Opcional
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Colección: roles

```typescript
{
  name: "Registrante" | "AdminArea",
  description: "Descripción del rol",
  permissions: [],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## 🚀 Cómo Crear Usuarios con Roles

1. Login como super admin (`luisrosasbocanegra@gmail.com`)
2. Ir a `/super-admin/users`
3. **Primero crear roles:**
   - Tab "Roles" → Crear rol con nombre exacto: `Registrante` o `AdminArea`
4. **Crear empresas** (opcional pero recomendado)
5. **Crear áreas** (opcional pero recomendado)
6. **Crear usuario:**
   - Email y password
   - Seleccionar rol creado
   - Asignar empresa (opcional)
   - Asignar áreas (opcional)

## ⚠️ Restricciones y Notas

1. **NO se usan custom claims** - Todo se valida desde Firestore
2. **NO se usa serviceAccountKey.json** - Solo cliente Firebase
3. **NO se usan Cloud Functions** - Validación en guards del frontend
4. **Nombres de roles sensibles a mayúsculas:** Debe ser exactamente `Registrante` o `AdminArea`
5. **Super admin hardcodeado:** El email `luisrosasbocanegra@gmail.com` está hardcodeado en los guards

## 🎨 UX Implementada

- ✅ Loading spinner durante autenticación y carga de rol
- ✅ Mensajes de error específicos y claros
- ✅ Redirección automática según rol
- ✅ Sin parpadeos ni navegación incorrecta
- ✅ Feedback visual en cada paso del proceso
- ✅ Botones de logout en cada dashboard

## 🧪 Casos de Prueba

1. **Super admin:**

   - Login → Redirige a `/super-admin/users`
   - Intentar ir a `/user` → Redirige a `/super-admin/users`

2. **Registrante:**

   - Login → Redirige a `/user`
   - Intentar ir a `/admin-area` → Redirige a `/user`
   - Intentar ir a `/super-admin` → Redirige a `/user`

3. **AdminArea:**

   - Login → Redirige a `/admin-area`
   - Intentar ir a `/user` → Redirige a `/admin-area`
   - Intentar ir a `/super-admin` → Redirige a `/admin-area`

4. **Usuario sin rol:**

   - Login → Error "Usuario sin rol asignado"
   - Hace logout automático

5. **Usuario no autenticado:**
   - Intentar acceder cualquier ruta protegida → Redirige a `/login`
