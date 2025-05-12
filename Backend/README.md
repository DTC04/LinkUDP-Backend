````markdown

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
````

### 2. Instala las dependencias

```bash
npm install
```

### 3. Levanta PostgreSQL con Docker

```bash
docker run --name linkudp-postgres \
  -e POSTGRES_PASSWORD=admin \
  -e POSTGRES_DB=linkudp \
  -p 5432:5432 \
  -d postgres
```

> Si ya tienes PostgreSQL instalado localmente, puedes usarlo y ajustar la conexión en `.env`.

### 4. Crea el archivo `.env` basado en `.env.example`

```bash
cp .env.example .env
```

Ejemplo de contenido:

```env
DATABASE_URL="postgresql://postgres:admin@localhost:5432/linkudp"
```

---

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

---

## 📂 Scripts útiles

```bash
# Modo desarrollo (hot reload)
npm run start:dev

# Producción
npm run start:prod

# Test unitarios
npm run test

# Prisma Studio (DB visual)
npx prisma studio
```

---

## 📁 Estructura del proyecto

```
src/
├── auth/           → Módulo de autenticación y JWT
├── users/          → Lógica de usuarios
├── students/       → Perfiles y preferencias de estudiantes
├── tutors/         → Gestión de tutores y sesiones
├── courses/        → Catálogo de cursos y asignaturas
├── prisma/         → PrismaService y configuración ORM
└── common/         → DTOs, enums, validaciones compartidas
```

---

## 👥 Colaboración en equipo

* **NO subas `.env`**: agrega un archivo `.env.example` y usa `.gitignore`.
* Usa ramas por funcionalidad (`feature/auth`, `feature/profile`, etc.).
* Tras actualizar modelos Prisma, corre `npx prisma migrate dev`.

