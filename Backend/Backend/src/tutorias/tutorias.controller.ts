import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { TutoriasService } from './tutorias.service';
import { CreateTutoriaDto } from './dto/create-tutoria.dto';
import { UpdateTutoriaDto } from './dto/update-tutoria.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { TutoringSession } from '@prisma/client';

@ApiTags('tutorias')
@Controller('tutorias')
export class TutoriasController {
  constructor(private readonly tutoriasService: TutoriasService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva tutoría' })
  @ApiResponse({ status: 201, description: 'La tutoría ha sido creada exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  async create(@Body() createTutoriaDto: CreateTutoriaDto): Promise<TutoringSession> {
    try {
      return await this.tutoriasService.create(createTutoriaDto);
    } catch (error) {
      // Manejo de errores específico si es necesario, por ejemplo, si el tutorId o courseId no existen
      throw error; // Re-lanzar el error para que NestJS lo maneje
    }
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las tutorías disponibles, con filtros opcionales' })
  @ApiQuery({ name: 'ramo', required: false, description: 'Filtrar tutorías por el nombre del ramo (curso)' })
  @ApiQuery({ name: 'horario', required: false, description: 'Filtrar tutorías por horario (funcionalidad pendiente de detalle)' })
  @ApiResponse({ status: 200, description: 'Lista de tutorías obtenida exitosamente.' })
  async findAll(@Query('ramo') ramo?: string, @Query('horario') horario?: string): Promise<TutoringSession[]> {
    const tutorias = await this.tutoriasService.findAll(ramo, horario);
    if (tutorias.length === 0 && ramo) {
      // Considerar si se debe devolver un 404 o un 200 con un array vacío y un mensaje.
      // Por ahora, se devuelve un array vacío, el mensaje informativo se manejaría en el frontend.
    }
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
  @ApiOperation({ summary: 'Actualizar una tutoría existente' })
  @ApiResponse({ status: 200, description: 'Tutoría actualizada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Tutoría no encontrada.' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateTutoriaDto: UpdateTutoriaDto): Promise<TutoringSession> {
    return this.tutoriasService.update(id, updateTutoriaDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una tutoría existente' })
  @ApiResponse({ status: 200, description: 'Tutoría eliminada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Tutoría no encontrada.' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<TutoringSession> {
    return this.tutoriasService.remove(id);
  }
}
