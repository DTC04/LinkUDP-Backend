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
exports.TutorCourseDto = exports.AvailabilityBlockDto = exports.UpdateTutorSpecificProfileDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const availability_block_dto_1 = require("./availability-block.dto");
Object.defineProperty(exports, "AvailabilityBlockDto", { enumerable: true, get: function () { return availability_block_dto_1.AvailabilityBlockDto; } });
const tutor_course_dto_1 = require("./tutor-course.dto");
Object.defineProperty(exports, "TutorCourseDto", { enumerable: true, get: function () { return tutor_course_dto_1.TutorCourseDto; } });
class UpdateTutorSpecificProfileDto {
    cv_url;
    experience_details;
    tutoring_contact_email;
    tutoring_phone;
    availability;
    courses;
}
exports.UpdateTutorSpecificProfileDto = UpdateTutorSpecificProfileDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'URL del Currículum Vitae del tutor (ej. LinkedIn, Google Drive)',
        example: 'https://linkedin.com/in/tutorudp',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], UpdateTutorSpecificProfileDto.prototype, "cv_url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Descripción detallada de la experiencia del tutor',
        example: 'Más de 5 años de experiencia en tutorías de cálculo y álgebra.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTutorSpecificProfileDto.prototype, "experience_details", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Email de contacto específico para tutorías',
        example: 'tutor.calculo@example.com',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], UpdateTutorSpecificProfileDto.prototype, "tutoring_contact_email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Número de teléfono para tutorías (opcional, formato chileno)',
        example: '+56912345678',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsPhoneNumber)('CL'),
    __metadata("design:type", String)
], UpdateTutorSpecificProfileDto.prototype, "tutoring_phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: [availability_block_dto_1.AvailabilityBlockDto],
        description: 'Lista de bloques de disponibilidad del tutor. Enviar la lista completa para reemplazar la existente.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => availability_block_dto_1.AvailabilityBlockDto),
    __metadata("design:type", Array)
], UpdateTutorSpecificProfileDto.prototype, "availability", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: [tutor_course_dto_1.TutorCourseDto],
        description: 'Lista de cursos que el tutor imparte. Enviar la lista completa para reemplazar la existente.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => tutor_course_dto_1.TutorCourseDto),
    __metadata("design:type", Array)
], UpdateTutorSpecificProfileDto.prototype, "courses", void 0);
//# sourceMappingURL=update-tutor-specific-profile.dto.js.map