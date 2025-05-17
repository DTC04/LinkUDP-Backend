// src/profile/profile.controller.ts
import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  ValidationPipe,
  ForbiddenException,
  UnauthorizedException,
  NotFoundException, // <--- Importar si no está
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
import { User as UserModel, Role } from '@prisma/client'; // Prisma User model

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@ApiTags('profile')
@ApiBearerAuth()
@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  // ... getMyProfile y updateUserProfile sin cambios ...

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
      'Crear o actualizar la información específica del perfil de tutor del usuario autenticado', // Descripción actualizada
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil de tutor creado/actualizado.', // Descripción actualizada
    type: ViewUserProfileDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({
    status: 403,
    description:
      'Acción no permitida (por ejemplo, si el rol no es STUDENT, TUTOR, o BOTH).', // Actualizado
  })
  async updateTutorSpecificProfile(
    @GetUser() user: UserModel, // user viene del token, con su rol actual
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: UpdateTutorSpecificProfileDto,
  ): Promise<ViewUserProfileDto> {
    if (!user?.id) {
      throw new UnauthorizedException(
        'ID de usuario no encontrado en el token',
      );
    }

    // Lógica de permisos actualizada:
    // Un STUDENT puede llamar a este endpoint para convertirse en tutor.
    // Un TUTOR o BOTH puede llamar para actualizar su perfil de tutor.
    if (
      user.role !== Role.STUDENT &&
      user.role !== Role.TUTOR &&
      user.role !== Role.BOTH
    ) {
      // Esto es una verificación extra, si el rol es algo inesperado
      throw new ForbiddenException(
        'El rol del usuario no permite esta acción.',
      );
    }

    // El servicio `profileService.updateTutorSpecificProfile` ahora debe manejar:
    // 1. Si el usuario es STUDENT: crear TutorProfile, actualizar User.role a BOTH.
    // 2. Si el usuario ya es TUTOR o BOTH: actualizar TutorProfile existente.
    // La versión de profile.service.ts que te proporcioné anteriormente ya hacía esto.
    await this.profileService.updateTutorSpecificProfile(user.id, dto);

    // Devolver el perfil completo actualizado (que ahora debería tener rol BOTH si era STUDENT)
    return this.profileService.getMyProfile(user.id);
  }
}
