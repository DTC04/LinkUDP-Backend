import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Habilitar CORS
  // Opción 1: Configuración básica (permite solicitudes de cualquier origen)
  // Ideal para empezar y para desarrollo local.
  // Considera opciones más restrictivas para producción.
  app.enableCors();

  // Opción 2: Configuración CORS más específica (RECOMENDADO para producción)
  /*
  app.enableCors({
    origin: 'http://localhost:XXXX', // Reemplaza XXXX con el puerto de tu frontend
                                     // o un array de orígenes permitidos: ['http://localhost:3001', 'https://tu-dominio-frontend.com']
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'], // Agrega las cabeceras que tu frontend envía
    credentials: true, // Si necesitas enviar cookies o cabeceras de autorización
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  */
  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('API de Tutorías LinkUDP')
    .setDescription('Documentación de la API para la gestión de tutorías.')
    .setVersion('1.0')
    .addTag('tutorias') // Puedes agregar más tags según tus módulos
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document); // La UI de Swagger estará en /api-docs

  // Habilitar ValidationPipe globalmente para DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no definidas en el DTO
      forbidNonWhitelisted: true, // Lanza error si se envían propiedades no definidas
      transform: true, // Transforma el payload a una instancia del DTO
    }),
  );

  await app.listen(process.env.PORT || 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger UI is available at: ${await app.getUrl()}/api-docs`);
}
bootstrap();
