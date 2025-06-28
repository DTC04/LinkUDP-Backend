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
exports.AvailabilityService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AvailabilityService = class AvailabilityService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getTutorAvailability(tutorId) {
        return this.prisma.availabilityBlock.findMany({
            where: { tutorId },
            orderBy: { start_time: 'asc' },
        });
    }
    async createAvailabilityBlock(data) {
        return this.prisma.availabilityBlock.create({ data });
    }
    async updateAvailabilityBlock(id, data) {
        const exists = await this.prisma.availabilityBlock.findUnique({ where: { id } });
        if (!exists)
            throw new common_1.NotFoundException('Bloque no encontrado');
        return this.prisma.availabilityBlock.update({ where: { id }, data });
    }
    async deleteAvailabilityBlock(id) {
        const exists = await this.prisma.availabilityBlock.findUnique({ where: { id } });
        if (!exists)
            throw new common_1.NotFoundException('Bloque no encontrado');
        return this.prisma.availabilityBlock.delete({ where: { id } });
    }
    async blockAvailabilityForSession(tutorId, start, end) {
        const blocks = await this.prisma.availabilityBlock.findMany({
            where: {
                tutorId,
                start_time: { lt: end },
                end_time: { gt: start },
            },
            orderBy: { start_time: 'asc' },
        });
        for (const block of blocks) {
            const bStart = block.start_time;
            const bEnd = block.end_time;
            if (end <= bStart || start >= bEnd)
                continue;
            if (start <= bStart && end >= bEnd) {
                await this.prisma.availabilityBlock.delete({ where: { id: block.id } });
            }
            else if (start <= bStart && end < bEnd) {
                await this.prisma.availabilityBlock.update({
                    where: { id: block.id },
                    data: { start_time: end },
                });
            }
            else if (start > bStart && end >= bEnd) {
                await this.prisma.availabilityBlock.update({
                    where: { id: block.id },
                    data: { end_time: start },
                });
            }
            else {
                await this.prisma.availabilityBlock.update({
                    where: { id: block.id },
                    data: { end_time: start },
                });
                await this.prisma.availabilityBlock.create({
                    data: {
                        tutorId,
                        day_of_week: block.day_of_week,
                        start_time: end,
                        end_time: bEnd,
                    },
                });
            }
        }
    }
};
exports.AvailabilityService = AvailabilityService;
exports.AvailabilityService = AvailabilityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AvailabilityService);
//# sourceMappingURL=availability.service.js.map