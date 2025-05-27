import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module'; 
import { AuthModule } from './auth/auth.module'; 
import { TutoriasModule } from './tutorias/tutorias.module';
import { ProfileModule } from './profile/profile.module';
import { BookingsModule } from './bookings/bookings.module';
import { CoursesModule } from './courses/courses.module'; 
import { AvailabilityModule } from './availability/availability.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, 
    }),
    PrismaModule,
    AuthModule,
    TutoriasModule,
    ProfileModule,
    BookingsModule,
    CoursesModule, 
    AvailabilityModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
