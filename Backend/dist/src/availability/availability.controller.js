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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailabilityController = void 0;
const common_1 = require("@nestjs/common");
const availability_service_1 = require("./availability.service");
const create_availability_dto_1 = require("./dto/create-availability.dto");
const update_availability_dto_1 = require("./dto/update-availability.dto");
let AvailabilityController = class AvailabilityController {
    availabilityService;
    constructor(availabilityService) {
        this.availabilityService = availabilityService;
    }
    getAvailability(tutorId) {
        return this.availabilityService.getTutorAvailability(tutorId);
    }
    createBlock(dto) {
        return this.availabilityService.createAvailabilityBlock({
            tutor: { connect: { id: dto.tutorId } },
            day_of_week: dto.day_of_week,
            start_time: new Date(dto.start_time),
            end_time: new Date(dto.end_time),
        });
    }
    updateBlock(id, dto) {
        const data = {};
        if (dto.day_of_week)
            data.day_of_week = dto.day_of_week;
        if (dto.start_time)
            data.start_time = new Date(dto.start_time);
        if (dto.end_time)
            data.end_time = new Date(dto.end_time);
        return this.availabilityService.updateAvailabilityBlock(id, data);
    }
    deleteBlock(id) {
        return this.availabilityService.deleteAvailabilityBlock(id);
    }
};
exports.AvailabilityController = AvailabilityController;
__decorate([
    (0, common_1.Get)(':tutorId'),
    __param(0, (0, common_1.Param)('tutorId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], AvailabilityController.prototype, "getAvailability", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_availability_dto_1.CreateAvailabilityDto]),
    __metadata("design:returntype", void 0)
], AvailabilityController.prototype, "createBlock", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_availability_dto_1.UpdateAvailabilityDto]),
    __metadata("design:returntype", void 0)
], AvailabilityController.prototype, "updateBlock", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], AvailabilityController.prototype, "deleteBlock", null);
exports.AvailabilityController = AvailabilityController = __decorate([
    (0, common_1.Controller)('disponibilidad'),
    __metadata("design:paramtypes", [availability_service_1.AvailabilityService])
], AvailabilityController);
//# sourceMappingURL=availability.controller.js.map