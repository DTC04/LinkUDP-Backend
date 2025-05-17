"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const profile_service_1 = require("./profile.service");
describe('ProfileService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [profile_service_1.ProfileService],
        }).compile();
        service = module.get(profile_service_1.ProfileService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=profile.service.spect.js.map