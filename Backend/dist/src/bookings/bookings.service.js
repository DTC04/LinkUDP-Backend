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
exports.BookingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let BookingsService = class BookingsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findStudentBookings(studentProfileId, statuses, upcoming, past) {
        const where = {
            studentProfileId: studentProfileId,
        };
        if (statuses) {
            if (Array.isArray(statuses)) {
                where.status = { in: statuses };
            }
            else {
                where.status = statuses;
            }
        }
        const sessionDateFilter = {};
        if (upcoming) {
            sessionDateFilter.start_time = { gt: new Date() };
        }
        if (past) {
            sessionDateFilter.start_time = { lt: new Date() };
        }
        if (upcoming || past) {
            where.session = sessionDateFilter;
        }
        return this.prisma.booking.findMany({
            where,
            include: {
                session: {
                    include: {
                        course: true,
                        tutor: {
                            include: {
                                user: {
                                    select: {
                                        full_name: true,
                                        photo_url: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                session: {
                    start_time: upcoming ? 'asc' : 'desc',
                },
            },
        });
    }
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BookingsService);
//# sourceMappingURL=bookings.service.js.map