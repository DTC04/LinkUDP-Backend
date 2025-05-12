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
