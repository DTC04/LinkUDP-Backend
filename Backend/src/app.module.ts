import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TutoriasModule } from './tutorias/tutorias.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { AvailabilityModule } from './availability/availability.module';//a

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TutoriasModule,
    PrismaModule,
    AuthModule,
    AvailabilityModule,//a
    ProfileModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
