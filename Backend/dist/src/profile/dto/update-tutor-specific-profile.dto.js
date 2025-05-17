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
exports.UpdateTutorSpecificProfileDto = exports.TutorCourseDto = exports.AvailabilityBlockDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
class AvailabilityBlockDto {
    day_of_week;
    start_time;
    end_time;
}
exports.AvailabilityBlockDto = AvailabilityBlockDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El día de la semana no puede estar vacío.' }),
    (0, class_validator_1.IsEnum)(client_1.DayOfWeek, { message: 'El día de la semana no es válido.' }),
    __metadata("design:type", String)
], AvailabilityBlockDto.prototype, "day_of_week", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'La hora de inicio no puede estar vacía.' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AvailabilityBlockDto.prototype, "start_time", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'La hora de término no puede estar vacía.' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AvailabilityBlockDto.prototype, "end_time", void 0);
class TutorCourseDto {
    courseId;
    level;
    grade;
}
exports.TutorCourseDto = TutorCourseDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El ID del curso no puede estar vacío.' }),
    (0, class_validator_1.IsNumber)({}, { message: 'El ID del curso debe ser un número.' }),
    __metadata("design:type", Number)
], TutorCourseDto.prototype, "courseId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El nivel del curso no puede estar vacío.' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TutorCourseDto.prototype, "level", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'La nota debe ser un número.' }),
    (0, class_validator_1.Min)(1.0, { message: 'La nota mínima es 1.0.' }),
    (0, class_validator_1.Max)(7.0, { message: 'La nota máxima es 7.0.' }),
    __metadata("design:type", Number)
], TutorCourseDto.prototype, "grade", void 0);
class UpdateTutorSpecificProfileDto {
    bio;
    cv_url;
    experience_details;
    tutoring_contact_email;
    tutoring_phone;
    availability;
    courses;
}
exports.UpdateTutorSpecificProfileDto = UpdateTutorSpecificProfileDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTutorSpecificProfileDto.prototype, "bio", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({}, { message: 'CV URL debe ser una URL válida.' }),
    __metadata("design:type", String)
], UpdateTutorSpecificProfileDto.prototype, "cv_url", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTutorSpecificProfileDto.prototype, "experience_details", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, { message: 'El email de contacto para tutorías debe ser válido.' }),
    __metadata("design:type", String)
], UpdateTutorSpecificProfileDto.prototype, "tutoring_contact_email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsPhoneNumber)(undefined, {
        message: 'El teléfono de contacto para tutorías debe ser un número válido.',
    }),
    __metadata("design:type", String)
], UpdateTutorSpecificProfileDto.prototype, "tutoring_phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => AvailabilityBlockDto),
    __metadata("design:type", Array)
], UpdateTutorSpecificProfileDto.prototype, "availability", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => TutorCourseDto),
    __metadata("design:type", Array)
], UpdateTutorSpecificProfileDto.prototype, "courses", void 0);
//# sourceMappingURL=update-tutor-specific-profile.dto.js.map