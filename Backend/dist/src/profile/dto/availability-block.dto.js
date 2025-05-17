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
exports.AvailabilityBlockDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class AvailabilityBlockDto {
    id;
    day_of_week;
    start_time;
    end_time;
}
exports.AvailabilityBlockDto = AvailabilityBlockDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID del bloque de disponibilidad (solo para actualizaciones)',
        example: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], AvailabilityBlockDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: client_1.DayOfWeek,
        description: 'Día de la semana para la disponibilidad',
        example: client_1.DayOfWeek.LUNES,
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEnum)(client_1.DayOfWeek),
    __metadata("design:type", String)
], AvailabilityBlockDto.prototype, "day_of_week", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Hora de inicio en formato HH:MM (24h)',
        example: '09:00',
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^([01]\d|2[0-3]):([0-5]\d)$/, {
        message: 'start_time debe estar en formato HH:MM',
    }),
    __metadata("design:type", String)
], AvailabilityBlockDto.prototype, "start_time", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Hora de fin en formato HH:MM (24h)',
        example: '11:00',
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^([01]\d|2[0-3]):([0-5]\d)$/, {
        message: 'end_time debe estar en formato HH:MM',
    }),
    __metadata("design:type", String)
], AvailabilityBlockDto.prototype, "end_time", void 0);
//# sourceMappingURL=availability-block.dto.js.map