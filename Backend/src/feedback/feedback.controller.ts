import {Controller, Post, Body, UseGuards, Req, Get, Param,} from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreateFeedbackDto, @Req() req: Request) {
    const user = req.user as any;
    const userId = user.id;
    return this.feedbackService.create(dto, userId);
  }

  @Get('/public/tutor/:tutorId')
  async getPublicRatings(@Param('tutorId') tutorId: number) {
    return this.feedbackService.getPublicRatings(Number(tutorId));
  }

  @UseGuards(JwtAuthGuard)
  @Get('/private/tutor/:tutorId')
  async getPrivateComments(
    @Param('tutorId') tutorId: number,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    const userId = user.id;
    return this.feedbackService.getPrivateCommentsForTutor(
      Number(tutorId),
      userId,
    );
  }
}
