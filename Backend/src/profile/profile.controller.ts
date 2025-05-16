import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  ValidationPipe,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UpdateTutorSpecificProfileDto } from './dto/update-tutor-specific-profile.dto';
import { ViewUserProfileDto } from './dto/view-user-profile.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { User as UserModel, Role } from '@prisma/client';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@ApiTags('profile')
@ApiBearerAuth()
@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obtener el perfil del usuario autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil del usuario obtenido exitosamente.',
    type: ViewUserProfileDto,
  })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  async getMyProfile(
    @GetUser() user: { id: number },
  ): Promise<ViewUserProfileDto> {
    if (!user?.id)
      throw new UnauthorizedException(
        'ID de usuario no encontrado en el token',
      );
    return this.profileService.getMyProfile(user.id);
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Actualizar el perfil básico del usuario autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil básico actualizado.',
    type: ViewUserProfileDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  async updateUserProfile(
    @GetUser() user: { id: number },
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: UpdateUserProfileDto,
  ): Promise<ViewUserProfileDto> {
    if (!user?.id)
      throw new UnauthorizedException(
        'ID de usuario no encontrado en el token',
      );
    await this.profileService.updateUserProfile(user.id, dto);
    return this.profileService.getMyProfile(user.id);
  }

  @Patch('me/tutor')
  @ApiOperation({
    summary:
      'Actualizar la información específica del perfil de tutor del usuario autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil de tutor actualizado.',
    type: ViewUserProfileDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({
    status: 403,
    description: 'Acción no permitida (usuario no es tutor).',
  })
  @ApiResponse({ status: 404, description: 'Perfil de tutor no encontrado.' })
  async updateTutorSpecificProfile(
    @GetUser() user: UserModel,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: UpdateTutorSpecificProfileDto,
  ): Promise<ViewUserProfileDto> {
    if (!user?.id)
      throw new UnauthorizedException(
        'ID de usuario no encontrado en el token',
      );

    if (user.role !== Role.TUTOR && user.role !== Role.BOTH) {
      throw new ForbiddenException(
        'Solo los tutores pueden actualizar esta información.',
      );
    }

    await this.profileService.updateTutorSpecificProfile(user.id, dto);
    return this.profileService.getMyProfile(user.id);
  }
}
