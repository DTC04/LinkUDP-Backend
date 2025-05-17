# 📚 LinkUDP Backend

Backend de la plataforma **LinkUDP**, desarrollada con NestJS, Prisma y PostgreSQL para conectar estudiantes con tutores universitarios.

---

## 📦 Requisitos

- Node.js v18+
- Docker
- Git

---

## 🚀 Cómo iniciar el proyecto (modo desarrollo)

### 1. Clona el repositorio
```bash
git clone https://github.com/tu-usuario/linkudp-backend.git
cd linkudp-backend
```
### 2. Instala las dependencias
```bash
npm install
```
### 3. Levanta PostgreSQL con Docker Compose

```bash
docker-compose up -d
```
### 4. Crea el archivo .env basado en .env.example
```bash
cp .env.example .env
Ejemplo de contenido:
env
DATABASE_URL="postgresql://postgres:admin@localhost:5432/linkudp"
```
## 🧩 Configurar Prisma
### 1. Inicializa Prisma (solo una vez)
```bash
npx prisma init
```
### 2. Aplica migraciones
```bash
npx prisma migrate dev --name init
```
### 3. Visualiza con Prisma Studio (opcional)
```bash
npx prisma studio
```
## 📂 Scripts útiles

# Modo desarrollo (hot reload)
```bash
npm run start:dev
```
# Producción
```bash
npm run start:prod
```
# Test unitarios
```bash
npm run test
```
# Prisma Studio (DB visual)
```bash
npx prisma studio
```

### 4. Poblar la base de datos con datos de ejemplo (opcional pero recomendado)
Se ha creado un script de seed para poblar la base de datos con datos ficticios de cursos, tutores y tutorías.
```bash
# Desde el directorio Backend/
npm run prisma:seed
# o
npx prisma db seed
```
Esto ejecutará el script `prisma/seed.ts`.

---

## 🧑‍🤝‍🧑 Gestión de Tutorías

Se ha implementado la funcionalidad completa para la gestión de tutorías, permitiendo a los tutores crear y ofrecer tutorías, y a los usuarios visualizarlas y filtrarlas.

### Cambios en el Esquema de Prisma (`prisma/schema.prisma`)

- **Enum `BookingStatus`**:
  - Se añadió el estado `AVAILABLE` para representar las tutorías que están ofrecidas y disponibles para ser reservadas.
  ```prisma
  enum BookingStatus {
    PENDING
    CONFIRMED
    CANCELLED
    AVAILABLE // Nuevo estado para tutorías ofrecidas
  }
  ```

- **Modelo `TutoringSession` (representa una Tutoría)**:
  - Se modificó para incluir campos esenciales y asegurar que una tutoría nueva tenga por defecto el estado `AVAILABLE`.
  - Campos clave:
    - `tutorId`: ID del `TutorProfile` que ofrece la tutoría.
    - `courseId`: ID del `Course` (ramo) al que pertenece la tutoría.
    - `title`: Título de la tutoría.
    - `description`: Descripción detallada.
    - `date`: Fecha de la tutoría.
    - `start_time`: Hora de inicio.
    - `end_time`: Hora de finalización.
    - `status`: Estado de la tutoría (e.g., `AVAILABLE`, `PENDING`, `CONFIRMED`). Por defecto `AVAILABLE`.
    - `location`: Ubicación (opcional si es online).
    - `notes`: Notas adicionales (opcional).
    - `created_at`, `updated_at`: Timestamps automáticos.
  ```prisma
  model TutoringSession {
    id          Int          @id @default(autoincrement())
    tutor       TutorProfile @relation(fields: [tutorId], references: [id])
    tutorId     Int
    course      Course       @relation(fields: [courseId], references: [id])
    courseId    Int
    title       String
    description String
    date        DateTime // Considerar si esto es necesario o se puede inferir de start_time
    start_time  DateTime
    end_time    DateTime
    status      BookingStatus @default(AVAILABLE) // Estado de la tutoría
    location    String? // Puede ser opcional si es online
    notes       String? // Notas adicionales para la tutoría
    created_at  DateTime     @default(now())
    updated_at  DateTime     @updatedAt

    bookings    Booking[]
    feedbacks   Feedback[]
  }
  ```
- Se generó una nueva migración llamada `gestion_tutorias` para aplicar estos cambios a la base de datos.

### Estructura del Módulo de Tutorías (`src/tutorias`)

Se creó un nuevo módulo NestJS para encapsular toda la lógica relacionada con las tutorías:

- **DTOs (`src/tutorias/dto`)**:
  - `create-tutoria.dto.ts`: Define la estructura de datos para crear una nueva tutoría. Incluye validaciones para asegurar que todos los campos requeridos (descripción, ramo/curso, horarios) estén presentes.
    - Campos: `tutorId`, `courseId`, `title`, `description`, `date`, `start_time`, `end_time`, `location?`, `notes?`.
  - `update-tutoria.dto.ts`: Define la estructura de datos para actualizar una tutoría existente, utilizando `PartialType` de `@nestjs/swagger` para hacer todos los campos opcionales.

- **Servicio (`src/tutorias/tutorias.service.ts`)**:
  - Contiene la lógica de negocio para interactuar con la base de datos a través de `PrismaService`.
  - **Métodos implementados**:
    - `create(createTutoriaDto)`: Crea una nueva tutoría. Valida que todos los campos obligatorios estén completos antes de la creación.
    - `findAll(ramo?: string, horario?: string)`: Obtiene un listado de todas las tutorías con estado `AVAILABLE`. Permite filtrar por `ramo` (nombre del curso, insensible a mayúsculas/minúsculas). El filtro por `horario` está contemplado pero requiere una implementación más detallada según la estructura de horarios.
    - `findOne(id: number)`: Obtiene los detalles de una tutoría específica por su ID. Incluye información del perfil del tutor (nombre, email, foto) y del curso (ramo).
    - `update(id: number, updateTutoriaDto)`: Actualiza una tutoría existente.
    - `remove(id: number)`: Elimina una tutoría.

- **Controlador (`src/tutorias/tutorias.controller.ts`)**:
  - Expone los endpoints de la API para la gestión de tutorías.
  - Utiliza `@nestjs/swagger` para la documentación automática de la API (disponible en `/api-docs`).
  - **Endpoints implementados**:
    - `POST /tutorias`: Crea una nueva tutoría.
      - Request body: `CreateTutoriaDto`.
    - `GET /tutorias`: Lista todas las tutorías disponibles.
      - Query params opcionales: `?ramo=nombreDelRamo` para filtrar por ramo.
    - `GET /tutorias/:id`: Obtiene los detalles de una tutoría específica.
    - `PATCH /tutorias/:id`: Actualiza una tutoría existente.
      - Request body: `UpdateTutoriaDto`.
    - `DELETE /tutorias/:id`: Elimina una tutoría.

- **Módulo (`src/tutorias/tutorias.module.ts`)**:
  - Declara el controlador y el servicio, e importa `PrismaModule` para la inyección de `PrismaService`.

### Módulo de Prisma (`src/prisma`)

- **`prisma.service.ts`**: Servicio que encapsula `PrismaClient` y maneja la conexión/desconexión a la base de datos.
- **`prisma.module.ts`**: Módulo que provee `PrismaService` y lo exporta, marcado como `@Global()` para que `PrismaService` esté disponible en toda la aplicación sin necesidad de importar `PrismaModule` en cada módulo que lo requiera.

### Actualizaciones Globales

- **`src/app.module.ts`**:
  - Se importó `TutoriasModule` y `PrismaModule` en el array `imports` del `AppModule` principal.

- **`src/main.ts`**:
  - Se configuró `SwaggerModule` para generar la documentación de la API.
  - Se habilitó `ValidationPipe` globalmente para la validación automática de DTOs en los controladores, asegurando que los datos de entrada cumplan con las reglas definidas (e.g., campos requeridos, tipos de datos).

### Cumplimiento de Requisitos Específicos

- **Crear, listar, ver detalles de una tutoría**: Implementado a través de los endpoints `POST /tutorias`, `GET /tutorias`, `GET /tutorias/:id` respectivamente.
- **Filtros por área/ramo/horario**:
  - Filtro por `ramo` implementado en `GET /tutorias?ramo=xyz`.
  - Filtro por `horario` está contemplado en la firma del método `findAll` pero su lógica específica de filtrado está pendiente de una definición más clara de cómo se gestionarán los horarios disponibles de las tutorías.
- **Entregables (Endpoints)**:
  - `POST /tutorias`
  - `GET /tutorias`
  - `GET /tutorias/:id`
  - `GET /tutorias?ramo=xyz`
- **Modelo Tutoria vinculado a un tutor**: El modelo `TutoringSession` está directamente vinculado a `TutorProfile` a través de la relación `tutorId`.

- **Historias de Usuario**:
  - **Como tutor quiero poder crear una tutoría con descripción, área, horario**:
    - El endpoint `POST /tutorias` permite ingresar descripción, seleccionar ramo (a través de `courseId`) y definir horarios (a través de `date`, `start_time`, `end_time`).
  - **La tutoría solo podrá ser publicada si todos los campos están completos**:
    - El `TutoriasService` en su método `create` verifica que los campos `tutorId`, `courseId`, `title`, `description`, `date`, `start_time`, `end_time` no estén vacíos. Adicionalmente, `ValidationPipe` en `main.ts` y los decoradores en `CreateTutoriaDto` aseguran la validación a nivel de DTO.
  - **Como usuario quiero ver los detalles de una tutoría antes de tomarla**:
    - El endpoint `GET /tutorias/:id` devuelve la información detallada, incluyendo perfil del tutor (nombre, email, foto), descripción de la tutoría, ramo y horarios disponibles (start_time, end_time).
  - **Como usuario quiero ver el listado por ramo de tutorías disponibles**:
    - El endpoint `GET /tutorias?ramo=xyz` permite filtrar las tutorías por el nombre del ramo.
  - **Si no existen tutorías disponibles para un ramo seleccionado, el sistema debe mostrar un mensaje informativo**:
    - El backend devuelve un array vacío si no se encuentran tutorías. El mensaje informativo específico se debe gestionar en el frontend al recibir una respuesta vacía.

### Script de Seed (`prisma/seed.ts`)

Se implementó un script utilizando `@faker-js/faker` (en español) y un archivo `Backend/output.json` para generar datos de prueba más realistas.

**Funcionalidad del script de seed actualizado:**
1.  **Limpieza de datos**: Antes de poblar, el script elimina todas las entradas existentes en las tablas `BookingHistory`, `Booking`, `Feedback`, `TutoringSession` y `TutorCourse` para evitar conflictos y asegurar un estado limpio para el seeding.
2.  **Lectura de `output.json`**: El script lee el archivo `Backend/output.json`, que se espera que contenga una lista de cursos y los profesores asociados.
3.  **Creación/Actualización de Cursos y Tutores**:
    *   Para cada entrada en `output.json`, se crea o actualiza (upsert) el curso correspondiente. El área temática (`subject_area`) se infiere del nombre del curso.
    *   Se crea o actualiza el profesor como un `User` y su `TutorProfile` asociado. Se genera un email único para cada profesor.
    *   Se crea una entrada en `TutorCourse` para vincular al tutor con el curso.
4.  **Creación de Tutorías**:
    *   Se generan hasta un máximo de **100 tutorías** (`TutoringSession`).
    *   Cada tutoría se asocia a un curso y tutor procesado desde `output.json`.
    *   Los detalles como título, descripción, fecha, hora, ubicación y notas se generan de forma ficticia utilizando `faker-js` en español, asegurando que la información sea lógica.
    *   Todas las tutorías se crean con el estado `AVAILABLE` por defecto.

Para ejecutar el script de seed:
```bash
# Desde el directorio Backend/
npm run prisma:seed
```
o alternativamente:
```bash
# Desde el directorio Backend/
npx prisma db seed
```
Esto requiere que la configuración de `prisma.seed` en `package.json` apunte a `ts-node prisma/seed.ts`.

**Nota importante sobre `output.json`**: Después de que el script de seed procesa `Backend/output.json` por primera vez, lo renombra a `Backend/output.json.processed`. Esto se hace para evitar que los mismos datos de `output.json` se re-procesen en futuras ejecuciones del seed, permitiendo que el script genere datos más aleatorios si `output.json` (el original) no se encuentra. Si necesitas volver a poblar la base de datos utilizando el contenido original de `output.json`, deberás renombrar `output.json.processed` de nuevo a `output.json` antes de ejecutar el comando de seed.

### Nota sobre Migraciones y PostgreSQL Enums

Durante la implementación, se encontró un problema común con PostgreSQL al agregar nuevos valores a un `enum` existente (`BookingStatus`) y usarlo inmediatamente como valor por defecto en una nueva columna (`TutoringSession.status`). PostgreSQL requiere que los nuevos valores de enum se confirmen (committed) antes de que puedan ser usados como default.

La solución implicó un proceso de migración en dos fases:
1.  **Primera migración**:
    -   Modificar `schema.prisma` para que el enum `BookingStatus` incluya el nuevo valor (`AVAILABLE`).
    -   Modificar `schema.prisma` para que la tabla `TutoringSession` incluya la nueva columna `status BookingStatus` **sin** el `@default(AVAILABLE)`.
    -   Ejecutar `npx prisma migrate dev --name nombre_migracion_paso1`. Esto aplica los cambios al enum y crea la columna.
2.  **Segunda migración**:
    -   Modificar `schema.prisma` para agregar `@default(AVAILABLE)` a la columna `status` en `TutoringSession`.
    -   Ejecutar `npx prisma migrate dev --name nombre_migracion_paso2`. Esto aplica el valor por defecto a la columna, lo cual ahora es seguro porque el valor del enum ya existe en la base de datos.

En caso de problemas persistentes con el estado de las migraciones, el comando `npx prisma migrate reset --force` (desde el directorio `Backend/`) fue utilizado para limpiar la base de datos y el historial de migraciones, permitiendo que las migraciones se generen y apliquen desde un estado limpio. **Este comando borra todos los datos de la base de datos de desarrollo.**
