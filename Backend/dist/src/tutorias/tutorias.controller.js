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
exports.TutoriasController = void 0;
const common_1 = require("@nestjs/common");
const tutorias_service_1 = require("./tutorias.service");
const create_tutoria_dto_1 = require("./dto/create-tutoria.dto");
const update_tutoria_dto_1 = require("./dto/update-tutoria.dto");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let TutoriasController = class TutoriasController {
    tutoriasService;
    constructor(tutoriasService) {
        this.tutoriasService = tutoriasService;
    }
    async create(createTutoriaDto) {
        try {
            return await this.tutoriasService.create(createTutoriaDto);
        }
        catch (error) {
            throw error;
        }
    }
    async findAll(ramo, horario, tutorId, status, upcoming, limit) {
        const isUpcoming = upcoming === 'true';
        const tutorias = await this.tutoriasService.findAll(ramo, horario, tutorId, status, isUpcoming, limit);
        return tutorias;
    }
    async findOne(id) {
        const tutoria = await this.tutoriasService.findOne(id);
        if (!tutoria) {
            throw new common_1.NotFoundException(`Tutoría con ID "${id}" no encontrada.`);
        }
        return tutoria;
    }
    async update(id, updateTutoriaDto) {
        return this.tutoriasService.update(id, updateTutoriaDto);
    }
    async remove(id) {
        return this.tutoriasService.remove(id);
    }
};
exports.TutoriasController = TutoriasController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Crear una nueva tutoría' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'La tutoría ha sido creada exitosamente.' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Datos de entrada inválidos.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'No autorizado.' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_tutoria_dto_1.CreateTutoriaDto]),
    __metadata("design:returntype", Promise)
], TutoriasController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar todas las tutorías, con filtros opcionales' }),
    (0, swagger_1.ApiQuery)({ name: 'ramo', required: false, description: 'Filtrar tutorías por el nombre del ramo (curso)' }),
    (0, swagger_1.ApiQuery)({ name: 'horario', required: false, description: 'Filtrar tutorías por horario (funcionalidad pendiente de detalle)' }),
    (0, swagger_1.ApiQuery)({ name: 'tutorId', required: false, type: Number, description: 'Filtrar tutorías por ID de tutor' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, description: 'Filtrar tutorías por estado (e.g., AVAILABLE, CONFIRMED, PENDING). Puede ser un string o un array de strings.' }),
    (0, swagger_1.ApiQuery)({ name: 'upcoming', required: false, type: Boolean, description: 'Filtrar solo tutorías futuras (start_time > ahora)' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: 'Limitar el número de resultados devueltos.' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de tutorías obtenida exitosamente.' }),
    __param(0, (0, common_1.Query)('ramo')),
    __param(1, (0, common_1.Query)('horario')),
    __param(2, (0, common_1.Query)('tutorId', new common_1.ParseIntPipe({ optional: true }))),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('upcoming')),
    __param(5, (0, common_1.Query)('limit', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Object, String, Number]),
    __metadata("design:returntype", Promise)
], TutoriasController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener los detalles de una tutoría específica' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Detalles de la tutoría obtenidos exitosamente.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Tutoría no encontrada.' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TutoriasController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar una tutoría existente' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Tutoría actualizada exitosamente.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Tutoría no encontrada.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'No autorizado.' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Datos de entrada inválidos.' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_tutoria_dto_1.UpdateTutoriaDto]),
    __metadata("design:returntype", Promise)
], TutoriasController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar una tutoría existente' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Tutoría eliminada exitosamente.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Tutoría no encontrada.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'No autorizado.' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TutoriasController.prototype, "remove", null);
exports.TutoriasController = TutoriasController = __decorate([
    (0, swagger_1.ApiTags)('tutorias'),
    (0, common_1.Controller)('tutorias'),
    __metadata("design:paramtypes", [tutorias_service_1.TutoriasService])
], TutoriasController);
//# sourceMappingURL=tutorias.controller.js.map