import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser'; // ✅ Importar cookie-parser

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Habilitar cookie parser para leer cookies en las requests
  app.use(cookieParser());

  // ✅ Habilitar CORS con cookies
  app.enableCors({
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // ✅ Swagger
  const config = new DocumentBuilder()
    .setTitle('API de Tutorías LinkUDP')
    .setDescription('Documentación de la API para la gestión de tutorías.')
    .setVersion('1.0')
    .addTag('tutorias')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // ✅ Pipes de validación
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT || 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger UI is available at: ${await app.getUrl()}/api-docs`);
}
bootstrap();
