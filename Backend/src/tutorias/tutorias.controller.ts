import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, NotFoundException, UseGuards } from '@nestjs/common';
import { TutoriasService } from './tutorias.service';
import { CreateTutoriaDto } from './dto/create-tutoria.dto';
import { UpdateTutoriaDto } from './dto/update-tutoria.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { TutoringSession } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Import JwtAuthGuard

@ApiTags('tutorias')
@Controller('tutorias')
export class TutoriasController {
  constructor(private readonly tutoriasService: TutoriasService) {}

  @Post()
  @UseGuards(JwtAuthGuard) // Protect endpoint
  @ApiBearerAuth() // Indicate Swagger UI that this endpoint needs Bearer token
  @ApiOperation({ summary: 'Crear una nueva tutoría' })
  @ApiResponse({ status: 201, description: 'La tutoría ha sido creada exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  async create(@Body() createTutoriaDto: CreateTutoriaDto): Promise<TutoringSession> {
    try {
      return await this.tutoriasService.create(createTutoriaDto);
    } catch (error) {
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las tutorías, con filtros opcionales' })
  @ApiQuery({ name: 'ramo', required: false, description: 'Filtrar tutorías por el nombre del ramo (curso)' })
  @ApiQuery({ name: 'horario', required: false, description: 'Filtrar tutorías por horario (funcionalidad pendiente de detalle)' })
  @ApiQuery({ name: 'tutorId', required: false, type: Number, description: 'Filtrar tutorías por ID de tutor' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar tutorías por estado (e.g., AVAILABLE, CONFIRMED, PENDING). Puede ser un string o un array de strings.' })
  @ApiQuery({ name: 'upcoming', required: false, type: Boolean, description: 'Filtrar solo tutorías futuras (start_time > ahora)'})
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limitar el número de resultados devueltos.'})
  @ApiResponse({ status: 200, description: 'Lista de tutorías obtenida exitosamente.' })
  async findAll(
    @Query('ramo') ramo?: string,
    @Query('horario') horario?: string,
    @Query('tutorId', new ParseIntPipe({ optional: true })) tutorId?: number,
    @Query('status') status?: string | string[],
    @Query('upcoming') upcoming?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<TutoringSession[]> {
    const isUpcoming = upcoming === 'true';
    const tutorias = await this.tutoriasService.findAll(ramo, horario, tutorId, status, isUpcoming, limit);
    // Removed the empty check as it doesn't do anything
    return tutorias;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener los detalles de una tutoría específica' })
  @ApiResponse({ status: 200, description: 'Detalles de la tutoría obtenidos exitosamente.' })
  @ApiResponse({ status: 404, description: 'Tutoría no encontrada.' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<TutoringSession> {
    const tutoria = await this.tutoriasService.findOne(id);
    if (!tutoria) {
      throw new NotFoundException(`Tutoría con ID "${id}" no encontrada.`);
    }
    return tutoria;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard) // Protect endpoint
  @ApiBearerAuth() // Indicate Swagger UI that this endpoint needs Bearer token
  @ApiOperation({ summary: 'Actualizar una tutoría existente' })
  @ApiResponse({ status: 200, description: 'Tutoría actualizada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Tutoría no encontrada.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateTutoriaDto: UpdateTutoriaDto): Promise<TutoringSession> {
    return this.tutoriasService.update(id, updateTutoriaDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard) // Protect endpoint
  @ApiBearerAuth() // Indicate Swagger UI that this endpoint needs Bearer token
  @ApiOperation({ summary: 'Eliminar una tutoría existente' })
  @ApiResponse({ status: 200, description: 'Tutoría eliminada exitosamente.' }) // Should be 204 for No Content on successful delete
  @ApiResponse({ status: 404, description: 'Tutoría no encontrada.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<TutoringSession> { // Should return void or the deleted entity
    return this.tutoriasService.remove(id);
  }
}
