import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TutoriasModule } from './tutorias/tutorias.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [TutoriasModule, PrismaModule], // Agrega TutoriasModule y PrismaModule aquí
  controllers: [AppController],
  providers: [AppService], // PrismaService ya es global gracias a @Global() en PrismaModule
})
export class AppModule {}
