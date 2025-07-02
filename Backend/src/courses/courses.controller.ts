import { Controller, Get } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { Course } from '@prisma/client';
import { Public } from '../auth/public.decorator';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Public()
  @Get()
  async findAll(): Promise<Course[]> {
    return this.coursesService.findAll();
  }
}
