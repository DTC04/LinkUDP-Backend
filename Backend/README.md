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
2. Instala las dependencias
bash
Copiar
Editar
npm install
3. Levanta PostgreSQL con Docker
bash
Copiar
Editar
docker run --name linkudp-postgres \
  -e POSTGRES_PASSWORD=admin \
  -e POSTGRES_DB=linkudp \
  -p 5432:5432 \
  -d postgres
Si ya tienes PostgreSQL instalado localmente, puedes usarlo y ajustar la conexión en .env.

4. Crea el archivo .env basado en .env.example
bash
Copiar
Editar
cp .env.example .env
Ejemplo de contenido:

env
Copiar
Editar
DATABASE_URL="postgresql://postgres:admin@localhost:5432/linkudp"
🧩 Configurar Prisma
1. Inicializa Prisma (solo una vez)
bash
Copiar
Editar
npx prisma init
2. Aplica migraciones
bash
Copiar
Editar
npx prisma migrate dev --name init
3. Visualiza con Prisma Studio (opcional)
bash
Copiar
Editar
npx prisma studio
📂 Scripts útiles
bash
Copiar
Editar
# Modo desarrollo (hot reload)
npm run start:dev

# Producción
npm run start:prod

# Test unitarios
npm run test

# Prisma Studio (DB visual)
npx prisma studio
