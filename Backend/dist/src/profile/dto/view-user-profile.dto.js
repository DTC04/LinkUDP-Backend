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
exports.ViewUserProfileDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class UserBaseDto {
    id;
    full_name;
    email;
    role;
    photo_url;
    email_verified;
}
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], UserBaseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], UserBaseDto.prototype, "full_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], UserBaseDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.Role }),
    __metadata("design:type", String)
], UserBaseDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: String, nullable: true }),
    __metadata("design:type", Object)
], UserBaseDto.prototype, "photo_url", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], UserBaseDto.prototype, "email_verified", void 0);
class CourseInterestViewDto {
    courseId;
    courseName;
}
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CourseInterestViewDto.prototype, "courseId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CourseInterestViewDto.prototype, "courseName", void 0);
class StudentProfileViewDto {
    id;
    university;
    career;
    study_year;
    bio;
    interests;
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], StudentProfileViewDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StudentProfileViewDto.prototype, "university", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], StudentProfileViewDto.prototype, "career", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], StudentProfileViewDto.prototype, "study_year", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: String, nullable: true }),
    __metadata("design:type", Object)
], StudentProfileViewDto.prototype, "bio", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: () => [CourseInterestViewDto] }),
    __metadata("design:type", Array)
], StudentProfileViewDto.prototype, "interests", void 0);
class TutorCourseViewDto {
    courseId;
    courseName;
    level;
    grade;
}
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TutorCourseViewDto.prototype, "courseId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TutorCourseViewDto.prototype, "courseName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TutorCourseViewDto.prototype, "level", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: Number, nullable: true }),
    __metadata("design:type", Object)
], TutorCourseViewDto.prototype, "grade", void 0);
class AvailabilityBlockViewDto {
    day_of_week;
    start_time;
    end_time;
}
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.DayOfWeek }),
    __metadata("design:type", String)
], AvailabilityBlockViewDto.prototype, "day_of_week", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '09:00', type: String }),
    __metadata("design:type", String)
], AvailabilityBlockViewDto.prototype, "start_time", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '11:00', type: String }),
    __metadata("design:type", String)
], AvailabilityBlockViewDto.prototype, "end_time", void 0);
class TutorProfileViewDto {
    id;
    bio;
    average_rating;
    cv_url;
    experience_details;
    tutoring_contact_email;
    tutoring_phone;
    university;
    degree;
    academic_year;
    courses;
    availability;
}
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TutorProfileViewDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: String, nullable: true }),
    __metadata("design:type", Object)
], TutorProfileViewDto.prototype, "bio", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TutorProfileViewDto.prototype, "average_rating", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: String, nullable: true }),
    __metadata("design:type", Object)
], TutorProfileViewDto.prototype, "cv_url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: String, nullable: true }),
    __metadata("design:type", Object)
], TutorProfileViewDto.prototype, "experience_details", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: String, nullable: true }),
    __metadata("design:type", Object)
], TutorProfileViewDto.prototype, "tutoring_contact_email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: String, nullable: true }),
    __metadata("design:type", Object)
], TutorProfileViewDto.prototype, "tutoring_phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Universidad del tutor',
        type: String,
        nullable: true,
    }),
    __metadata("design:type", Object)
], TutorProfileViewDto.prototype, "university", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Carrera/Título del tutor',
        type: String,
        nullable: true,
    }),
    __metadata("design:type", Object)
], TutorProfileViewDto.prototype, "degree", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Año de estudio o situación académica del tutor',
        type: String,
        nullable: true,
    }),
    __metadata("design:type", Object)
], TutorProfileViewDto.prototype, "academic_year", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: () => [TutorCourseViewDto] }),
    __metadata("design:type", Array)
], TutorProfileViewDto.prototype, "courses", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: () => [AvailabilityBlockViewDto] }),
    __metadata("design:type", Array)
], TutorProfileViewDto.prototype, "availability", void 0);
class ViewUserProfileDto {
    user;
    studentProfile;
    tutorProfile;
}
exports.ViewUserProfileDto = ViewUserProfileDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: UserBaseDto }),
    __metadata("design:type", UserBaseDto)
], ViewUserProfileDto.prototype, "user", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: StudentProfileViewDto }),
    __metadata("design:type", StudentProfileViewDto)
], ViewUserProfileDto.prototype, "studentProfile", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: TutorProfileViewDto }),
    __metadata("design:type", TutorProfileViewDto)
], ViewUserProfileDto.prototype, "tutorProfile", void 0);
//# sourceMappingURL=view-user-profile.dto.js.map