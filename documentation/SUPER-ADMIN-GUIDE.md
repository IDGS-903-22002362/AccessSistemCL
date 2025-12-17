# Super Admin - Estructura de Roles

## Acceso Super Admin

- **Email único:** `luisrosasbocanegra@gmail.com`
- **Ruta:** `/super-admin/users`

## Tipos de Roles

### 1. super_admin

- **Descripción:** Acceso total al sistema
- **Email:** luisrosasbocanegra@gmail.com
- **Permisos:** Gestión completa de usuarios, roles, empresas y áreas

### 2. admin_area

- **Descripción:** Administrador de área
- **Permisos:**
  - Aceptar o rechazar registros en áreas asignadas
  - Ver reportes de su área
- **Campos requeridos:**
  - empresaId: ID de la empresa
  - areaIds: Array de IDs de áreas donde tiene permisos

### 3. registrante

- **Descripción:** Usuario que registra personas
- **Permisos:**
  - Registrar personas en áreas asignadas
- **Campos requeridos:**
  - empresaId: ID de la empresa
  - areaIds: Array de IDs de áreas donde puede registrar

## Estructura de Datos

### User (Firestore - colección "users")

```typescript
{
  email: string;
  role: string; // ID del rol
  empresaId?: string; // ID de la empresa
  areaIds?: string[]; // Array de IDs de áreas
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Role (Firestore - colección "roles")

```typescript
{
  name: string; // super_admin, admin_area, registrante
  description?: string;
  permissions?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Empresa (Firestore - colección "empresas")

```typescript
{
  nombre: string;
  descripcion?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Area (Firestore - colección "areas")

```typescript
{
  nombre: string;
  descripcion?: string;
  empresaId?: string; // Relación con empresa
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Flujo de Trabajo

### Crear Usuario

1. Super admin accede a `/super-admin/users`
2. Completa formulario con email, password, rol, empresa y áreas
3. Sistema valida que el email no exista
4. Crea usuario en Firebase Auth
5. Guarda metadata en Firestore (colección "users")

### Crear Rol

1. Super admin va a tab "Roles"
2. Completa nombre y descripción
3. Se crea automáticamente en Firestore

### Crear Empresa

1. Super admin va a tab "Empresas"
2. Completa nombre y descripción
3. Se crea automáticamente en Firestore

### Crear Área

1. Super admin va a tab "Áreas"
2. Completa nombre, descripción y empresa
3. Se crea automáticamente en Firestore

## Servicios Disponibles

- **AuthAdminService:** Gestión de usuarios en Firebase Auth
- **UsersService:** CRUD de usuarios en Firestore
- **RolesService:** CRUD de roles en Firestore
- **EmpresasService:** CRUD de empresas en Firestore
- **AreasService:** CRUD de áreas en Firestore

## Guards

- **superAdminGuard:** Valida que el usuario sea luisrosasbocanegra@gmail.com
- **authGuard:** Valida que el usuario esté autenticado
- **adminGuard:** Valida roles de administrador (existente)

## Notas Importantes

1. Las colecciones en Firestore se crean automáticamente al escribir el primer documento
2. NO se implementan custom claims en esta versión
3. NO se implementan reglas avanzadas de Firestore
4. NO se implementan Cloud Functions
5. La eliminación de usuarios solo elimina metadata en Firestore, no en Firebase Auth
