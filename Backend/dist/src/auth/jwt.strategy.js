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
var JwtStrategy_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtStrategy = void 0;
const passport_jwt_1 = require("passport-jwt");
const passport_1 = require("@nestjs/passport");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const config_1 = require("@nestjs/config");
let JwtStrategy = JwtStrategy_1 = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    prisma;
    configService;
    logger = new common_1.Logger(JwtStrategy_1.name);
    constructor(prisma, configService) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromExtractors([
                passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
                (req) => {
                    try {
                        const raw = req?.cookies?.['access_token'];
                        if (!raw) {
                            return null;
                        }
                        this.logger.debug(`Found access_token cookie: ${raw}`);
                        if (typeof raw === 'string' && raw.startsWith('j:')) {
                            const decoded = decodeURIComponent(raw.slice(2));
                            const parsed = JSON.parse(decoded);
                            this.logger.debug(`Parsed serialized cookie to: ${parsed.access_token}`);
                            return parsed.access_token;
                        }
                        return raw;
                    }
                    catch (e) {
                        this.logger.warn('Error parsing access_token cookie:', e);
                        return null;
                    }
                },
            ]),
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_SECRET') || 'supersecret',
        });
        this.prisma = prisma;
        this.configService = configService;
        this.logger.log(`JwtStrategy initialized. Using secret: ${configService.get('JWT_SECRET') ? 'from ConfigService (****)' : "'supersecret'"}. ignoreExpiration: false`);
    }
    async validate(payload) {
        this.logger.log(`Validating JWT payload: ${JSON.stringify(payload)}`);
        if (!payload || typeof payload.sub !== 'number') {
            this.logger.warn('JWT payload is invalid or missing "sub" (user ID).');
            throw new common_1.UnauthorizedException('Invalid token payload.');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
        });
        if (!user) {
            this.logger.warn(`User with ID ${payload.sub} (from JWT sub) not found in database.`);
            throw new common_1.UnauthorizedException('User specified in token does not exist.');
        }
        if (user.role !== payload.role) {
            this.logger.warn(`Role mismatch for user ${user.email} (ID: ${user.id}). JWT role: ${payload.role}, DB role: ${user.role}.`);
        }
        this.logger.log(`User ${user.email} (ID: ${user.id}, Role: ${user.role}) validated successfully.`);
        const { password, ...result } = user;
        return result;
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = JwtStrategy_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map