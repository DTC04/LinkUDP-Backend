import { Module } from '@nestjs/common';
import { TutoriasService } from './tutorias.service';
import { TutoriasController } from './tutorias.controller';
import { PrismaService } from '../prisma/prisma.service'; // Importa PrismaService

@Module({
  controllers: [TutoriasController],
  providers: [TutoriasService, PrismaService], // Agrega PrismaService a los providers
})
export class TutoriasModule {}
