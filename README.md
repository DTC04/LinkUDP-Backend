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
git clone https://github.com/DTC04/LinkUDP.git
cd linkUDP/Backend
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
## Revisión puerto 5432
### Revisar si hay una Bases de datos en el puerto 5432
```bash
sudo lsof -i :5432
```
### Detener proceso en el puerto
```bash
sudo systemctl stop postgresql

```
## 🧩 Configurar Prisma
### 1. Aplica migraciones
```bash
npx prisma migrate dev --name init
```
### 2. Visualiza con Prisma Studio (opcional)
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
