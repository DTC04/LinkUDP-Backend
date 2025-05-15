import {
  Controller, Post, Body, UseGuards, Req
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateStudentProfileDto } from './dto/create-student-profile.dto';
import { CreateTutorProfileDto } from './dto/create-tutor-profile.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('student-profile')
  createStudent(@Body() dto: CreateStudentProfileDto, @Req() req) {
    return this.usersService.createStudentProfile(req.user.sub, dto);
  }

  @Post('tutor-profile')
  createTutor(@Body() dto: CreateTutorProfileDto, @Req() req) {
    return this.usersService.createTutorProfile(req.user.sub, dto);
  }
}
