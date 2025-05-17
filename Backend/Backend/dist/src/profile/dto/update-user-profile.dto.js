"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateUserProfileDto = exports.StudentInterestDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class StudentInterestDto {
    id;
    courseId;
}
exports.StudentInterestDto = StudentInterestDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID del interés (para eliminar o actualizar, no usado en creación directa aquí)',
        example: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], StudentInterestDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID del curso de interés', example: 5 }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], StudentInterestDto.prototype, "courseId", void 0);
class UpdateUserProfileDto {
    full_name;
    photo_url;
    bio;
    university;
    career;
    study_year;
    interestCourseIds;
}
exports.UpdateUserProfileDto = UpdateUserProfileDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Nombre completo del usuario',
        example: 'Juan Alberto Pérez González',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], UpdateUserProfileDto.prototype, "full_name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'URL de la foto de perfil del usuario',
        example: 'https://example.com/profile.jpg',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], UpdateUserProfileDto.prototype, "photo_url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Biografía o descripción personal del usuario. Para tutores, esta es su bio principal.',
        example: 'Estudiante de Ingeniería Civil Industrial apasionado por la optimización.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateUserProfileDto.prototype, "bio", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Universidad del estudiante (si aplica)',
        example: 'Universidad Diego Portales',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateUserProfileDto.prototype, "university", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Carrera del estudiante (si aplica)',
        example: 'Ingeniería Civil Informática',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateUserProfileDto.prototype, "career", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Año de estudio del estudiante (si aplica)',
        example: 3,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpdateUserProfileDto.prototype, "study_year", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Lista de IDs de cursos de interés para el estudiante. Enviar la lista completa para reemplazar la existente.',
        example: [1, 5, 10],
        type: [Number],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsInt)({ each: true }),
    (0, class_validator_1.ArrayMinSize)(0),
    __metadata("design:type", Array)
], UpdateUserProfileDto.prototype, "interestCourseIds", void 0);
//# sourceMappingURL=update-user-profile.dto.js.map