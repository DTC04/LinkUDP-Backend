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
exports.UpdateTutorSpecificProfileDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const availability_block_dto_1 = require("./availability-block.dto");
const tutor_course_dto_1 = require("./tutor-course.dto");
class UpdateTutorSpecificProfileDto {
    bio;
    cv_url;
    experience_details;
    tutoring_contact_email;
    tutoring_phone;
    university;
    degree;
    academic_year;
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
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTutorSpecificProfileDto.prototype, "university", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTutorSpecificProfileDto.prototype, "degree", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTutorSpecificProfileDto.prototype, "academic_year", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => availability_block_dto_1.AvailabilityBlockDto),
    __metadata("design:type", Array)
], UpdateTutorSpecificProfileDto.prototype, "availability", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => tutor_course_dto_1.TutorCourseDto),
    __metadata("design:type", Array)
], UpdateTutorSpecificProfileDto.prototype, "courses", void 0);
//# sourceMappingURL=update-tutor-specific-profile.dto.js.map