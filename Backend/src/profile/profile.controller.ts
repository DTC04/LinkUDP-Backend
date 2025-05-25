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
  NotFoundException,
  Param,
  ParseIntPipe,
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
import { Public } from '../auth/public.decorator'; // Assuming you have a Public decorator

@ApiTags('profile')
@ApiBearerAuth()
@Controller('profile')
@UseGuards(JwtAuthGuard) // Apply guard to the whole controller
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
    @GetUser() user: { id: number }, // Simplificado para obtener solo id si es lo único que se usa aquí
  ): Promise<ViewUserProfileDto> {
    if (!user?.id) {
      throw new UnauthorizedException(
        'ID de usuario no encontrado en el token',
      );
    }
    return this.profileService.getMyProfile(user.id);
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Actualizar el perfil básico del usuario autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil básico actualizado.',
    type: ViewUserProfileDto, // Devolverá la vista completa del perfil
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  async updateUserProfile(
    @GetUser() user: { id: number },
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: UpdateUserProfileDto,
  ): Promise<ViewUserProfileDto> {
    // Cambiado para devolver ViewUserProfileDto
    if (!user?.id) {
      throw new UnauthorizedException(
        'ID de usuario no encontrado en el token',
      );
    }
    await this.profileService.updateUserProfile(user.id, dto);
    return this.profileService.getMyProfile(user.id); // Devolver el perfil actualizado
  }

  @Patch('me/tutor')
  @ApiOperation({
    summary:
      'Crear o actualizar la información específica del perfil de tutor del usuario autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil de tutor creado/actualizado exitosamente.',
    type: ViewUserProfileDto, // Devolverá la vista completa del perfil
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({
    status: 403,
    description: 'El rol actual del usuario no permite esta acción.',
  })
  // No longer need @UseGuards here if applied at controller level
  async updateTutorSpecificProfile(
    @GetUser() user: UserModel, // Aquí necesitamos el UserModel completo para acceder a user.role
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: UpdateTutorSpecificProfileDto,
  ): Promise<ViewUserProfileDto> {
    // Cambiado para devolver ViewUserProfileDto
    if (!user?.id) {
      throw new UnauthorizedException(
        'ID de usuario no encontrado en el token',
      );
    }

    // Un STUDENT puede llamar a este endpoint para convertirse en tutor.
    // Un TUTOR o BOTH puede llamar para actualizar su perfil de tutor.
    // Si el rol es algo distinto, no se permite.
    if (
      user.role !== Role.STUDENT &&
      user.role !== Role.TUTOR &&
      user.role !== Role.BOTH
    ) {
      console.warn(
        `Usuario con ID ${user.id} y rol ${user.role} intentó acceder a updateTutorSpecificProfile.`,
      );
      throw new ForbiddenException(
        'Tu rol actual no permite realizar esta acción.',
      );
    }

    console.log(
      `User ID: ${user.id} con Rol: ${user.role} está actualizando/creando perfil de tutor.`,
    );
    await this.profileService.updateTutorSpecificProfile(user.id, dto);

    // Devolver el perfil completo actualizado, que ahora debería tener rol BOTH si era STUDENT
    // y el token del usuario se refrescará en el frontend la próxima vez que se necesite (o al re-loguear).
    return this.profileService.getMyProfile(user.id);
  }

  @Public() // Mark this route as public
  @Get('tutor/:tutorId')
  @ApiOperation({ summary: 'Obtener el perfil público de un tutor por ID' })
  @ApiResponse({
    status: 200,
    description: 'Perfil público del tutor obtenido exitosamente.',
    type: ViewUserProfileDto, // Or a more specific DTO for public view if needed
  })
  @ApiResponse({ status: 404, description: 'Tutor no encontrado.' })
  async getPublicTutorProfile(
    @Param('tutorId', ParseIntPipe) tutorId: number,
  ): Promise<ViewUserProfileDto> {
    const tutorProfile = await this.profileService.getPublicTutorProfileById(
      tutorId,
    );
    if (!tutorProfile || !tutorProfile.user) { // Added check for tutorProfile.user
      throw new NotFoundException('Perfil de tutor no encontrado o datos de usuario incompletos.');
    }
    // Ensure the user is indeed a tutor or has a tutor profile
    if (tutorProfile.user.role !== Role.TUTOR && tutorProfile.user.role !== Role.BOTH) {
        throw new NotFoundException('Este usuario no es un tutor o no tiene un perfil de tutor público.');
    }
    return tutorProfile;
  }
}
