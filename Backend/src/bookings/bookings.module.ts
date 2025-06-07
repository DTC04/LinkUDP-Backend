import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AvailabilityModule } from '../availability/availability.module';

@Module({
  imports: [PrismaModule, AuthModule, AvailabilityModule],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}