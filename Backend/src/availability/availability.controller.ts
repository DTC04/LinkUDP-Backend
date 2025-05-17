import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { AvailabilityService } from './availability.service';

@Controller('disponibilidad')
export class AvailabilityController {
  constructor(private availabilityService: AvailabilityService) {}

  @Get(':tutorId')
  async getAvailability(@Param('tutorId', ParseIntPipe) tutorId: number) {
    return this.availabilityService.getTutorAvailability(tutorId);
  }
}
