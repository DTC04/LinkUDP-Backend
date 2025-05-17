import { PartialType } from '@nestjs/swagger';
import { CreateTutoriaDto } from './create-tutoria.dto';

export class UpdateTutoriaDto extends PartialType(CreateTutoriaDto) {}
