"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutoriasModule = void 0;
const common_1 = require("@nestjs/common");
const tutorias_service_1 = require("./tutorias.service");
const tutorias_controller_1 = require("./tutorias.controller");
const prisma_service_1 = require("../prisma/prisma.service");
let TutoriasModule = class TutoriasModule {
};
exports.TutoriasModule = TutoriasModule;
exports.TutoriasModule = TutoriasModule = __decorate([
    (0, common_1.Module)({
        controllers: [tutorias_controller_1.TutoriasController],
        providers: [tutorias_service_1.TutoriasService, prisma_service_1.PrismaService],
    })
], TutoriasModule);
//# sourceMappingURL=tutorias.module.js.map