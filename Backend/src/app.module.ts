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
import { MailerModule } from '@nestjs-modules/mailer';
import { FeedbackModule } from './feedback/feedback.module'; 

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MailerModule.forRoot({
      transport: {
        service: 'gmail',
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASSWORD,
        },
      },
      defaults: {
        from: `"LinkUDP" <${process.env.MAIL_USER}>`,
      },
    }),

    // 🔌 Módulos del sistema
    PrismaModule,
    AuthModule,
    TutoriasModule,
    ProfileModule,
    BookingsModule,
    CoursesModule,
    AvailabilityModule,
    FeedbackModule, // ✅ IMPORTADO AQUÍ
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
