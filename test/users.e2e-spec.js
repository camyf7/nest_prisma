"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
const tasks_module_1 = require("../src/tasks/tasks.module");
const users_module_1 = require("../src/users/users.module");
const auth_module_1 = require("../src/auth/auth.module");
const database_service_1 = require("../src/database/database.service");
const supertest_1 = __importDefault(require("supertest"));
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const serve_static_1 = require("@nestjs/serve-static");
const node_path_1 = require("node:path");
const dotenv = __importStar(require("dotenv"));
const faker_1 = require("@faker-js/faker");
dotenv.config({ path: '.env' });
describe('Users (e2e)', () => {
    let app;
    let databaseService;
    let createdUserIds = [];
    const makeCreateUserDto = () => {
        const unique = `${Date.now()}-${faker_1.faker.number.int({ min: 1000, max: 9999 })}`;
        return {
            name: faker_1.faker.person.fullName(),
            email: `user-${unique}@example.com`,
            password: `Aa1!${faker_1.faker.string.alphanumeric(8)}`
        };
    };
    const createUserAndLogin = async () => {
        const createUserDto = makeCreateUserDto();
        const createResponse = await (0, supertest_1.default)(app.getHttpServer())
            .post('/users')
            .send(createUserDto)
            .expect(201);
        createdUserIds.push(createResponse.body.id);
        const authResponse = await (0, supertest_1.default)(app.getHttpServer())
            .post('/auth')
            .send({
            email: createUserDto.email,
            password: createUserDto.password
        })
            .expect(201);
        return {
            createUserDto,
            userId: createResponse.body.id,
            token: authResponse.body.token
        };
    };
    beforeAll(async () => {
        const module = await testing_1.Test.createTestingModule({
            imports: [
                config_1.ConfigModule.forRoot({
                    isGlobal: true,
                    envFilePath: '.env',
                }),
                tasks_module_1.TasksModule,
                users_module_1.UsersModule,
                auth_module_1.AuthModule,
                serve_static_1.ServeStaticModule.forRoot({
                    rootPath: (0, node_path_1.join)(__dirname, '..', '..', 'files'),
                    serveRoot: '/files'
                })
            ],
        }).compile();
        app = module.createNestApplication();
        app.useGlobalPipes(new common_1.ValidationPipe({
            whitelist: true,
            transform: true,
        }));
        databaseService = module.get(database_service_1.DatabaseService);
        await app.init();
    });
    afterEach(async () => {
        if (createdUserIds.length > 0) {
            await databaseService.user.deleteMany({
                where: {
                    id: {
                        in: createdUserIds
                    }
                }
            });
        }
        createdUserIds = [];
    });
    afterAll(async () => {
        await databaseService.$disconnect();
        await app.close();
    });
    describe('/users', () => {
        it('/users (POST) - createUser', async () => {
            const createUserDto = makeCreateUserDto();
            const response = await (0, supertest_1.default)(app.getHttpServer())
                .post('/users')
                .send(createUserDto)
                .expect(201);
            createdUserIds.push(response.body.id);
            expect(response.body).toEqual(expect.objectContaining({
                id: expect.any(Number),
                name: createUserDto.name,
                email: createUserDto.email
            }));
        });
        it('/users (POST) - should return bad request with invalid email', async () => {
            const createUserDto = {
                ...makeCreateUserDto(),
                email: 'invalid-email'
            };
            const response = await (0, supertest_1.default)(app.getHttpServer())
                .post('/users')
                .send(createUserDto)
                .expect(400);
            expect(response.body.statusCode).toBe(400);
            expect(response.body.message).toContain('email must be an email');
        });
        it('/users (POST) - should return bad request with weak password', async () => {
            const createUserDto = {
                ...makeCreateUserDto(),
                password: '12345678'
            };
            const response = await (0, supertest_1.default)(app.getHttpServer())
                .post('/users')
                .send(createUserDto)
                .expect(400);
            expect(response.body.statusCode).toBe(400);
            expect(response.body.message).toContain('password is not strong enough');
        });
        it('/users/:id (GET) - findOneUser', async () => {
            const createUserDto = makeCreateUserDto();
            const createResponse = await (0, supertest_1.default)(app.getHttpServer())
                .post('/users')
                .send(createUserDto)
                .expect(201);
            createdUserIds.push(createResponse.body.id);
            const response = await (0, supertest_1.default)(app.getHttpServer())
                .get(`/users/${createResponse.body.id}`)
                .expect(200);
            expect(response.body).toEqual(expect.objectContaining({
                id: createResponse.body.id,
                name: createUserDto.name,
                email: createUserDto.email,
                avatar: null,
                tasks: expect.any(Array)
            }));
        });
        it('/users/:id (GET) - should return user not found', async () => {
            await (0, supertest_1.default)(app.getHttpServer())
                .get('/users/999999')
                .expect(400);
        });
        it('/users/:id (PUT) - updateUser', async () => {
            const { userId, token, createUserDto } = await createUserAndLogin();
            const updateUserDto = {
                name: faker_1.faker.person.fullName(),
                password: `Bb2@${faker_1.faker.string.alphanumeric(8)}`
            };
            const response = await (0, supertest_1.default)(app.getHttpServer())
                .put(`/users/${userId}`)
                .set('Authorization', `Bearer ${token}`)
                .send(updateUserDto)
                .expect(200);
            expect(response.body).toEqual(expect.objectContaining({
                id: userId,
                name: updateUserDto.name,
                email: createUserDto.email
            }));
        });
        it('/users/:id (PUT) - should return unauthorized without token', async () => {
            const createUserDto = makeCreateUserDto();
            const createResponse = await (0, supertest_1.default)(app.getHttpServer())
                .post('/users')
                .send(createUserDto)
                .expect(201);
            createdUserIds.push(createResponse.body.id);
            const response = await (0, supertest_1.default)(app.getHttpServer())
                .put(`/users/${createResponse.body.id}`)
                .send({ name: faker_1.faker.person.fullName() })
                .expect(401);
            expect(response.body.statusCode).toBe(401);
        });
        it('/users/:id (PUT) - should return unauthorized with token from another user', async () => {
            const owner = await createUserAndLogin();
            const otherUser = await createUserAndLogin();
            const response = await (0, supertest_1.default)(app.getHttpServer())
                .put(`/users/${otherUser.userId}`)
                .set('Authorization', `Bearer ${owner.token}`)
                .send({ name: faker_1.faker.person.fullName() })
                .expect(401);
            expect(response.body.statusCode).toBe(401);
        });
        it('/users/:id (PUT) - should return user not found with valid token', async () => {
            const { token } = await createUserAndLogin();
            await (0, supertest_1.default)(app.getHttpServer())
                .put('/users/999999')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: faker_1.faker.person.fullName() })
                .expect(400);
        });
        it('/users/:id (DELETE) - deleteUser', async () => {
            const { userId, token } = await createUserAndLogin();
            const deleteResponse = await (0, supertest_1.default)(app.getHttpServer())
                .delete(`/users/${userId}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200);
            expect(deleteResponse.body).toEqual({
                message: 'User deleted successfully'
            });
            createdUserIds = createdUserIds.filter((id) => id !== userId);
            await (0, supertest_1.default)(app.getHttpServer())
                .get(`/users/${userId}`)
                .expect(400);
        });
        it('/users/:id (DELETE) - should return unauthorized without token', async () => {
            const createUserDto = makeCreateUserDto();
            const createResponse = await (0, supertest_1.default)(app.getHttpServer())
                .post('/users')
                .send(createUserDto)
                .expect(201);
            createdUserIds.push(createResponse.body.id);
            const response = await (0, supertest_1.default)(app.getHttpServer())
                .delete(`/users/${createResponse.body.id}`)
                .expect(401);
            expect(response.body.statusCode).toBe(401);
        });
        it('/users/:id (DELETE) - should return unauthorized with token from another user', async () => {
            const owner = await createUserAndLogin();
            const otherUser = await createUserAndLogin();
            const response = await (0, supertest_1.default)(app.getHttpServer())
                .delete(`/users/${otherUser.userId}`)
                .set('Authorization', `Bearer ${owner.token}`)
                .expect(401);
            expect(response.body.statusCode).toBe(401);
        });
        it('/users/:id (DELETE) - should return user not found with valid token', async () => {
            const { token } = await createUserAndLogin();
            await (0, supertest_1.default)(app.getHttpServer())
                .delete('/users/999999')
                .set('Authorization', `Bearer ${token}`)
                .expect(400);
        });
    });
    describe('/auth', () => {
        it('/auth (POST) - should return unauthorized with invalid credentials', async () => {
            const response = await (0, supertest_1.default)(app.getHttpServer())
                .post('/auth')
                .send({
                email: faker_1.faker.internet.email().toLowerCase(),
                password: `Aa1!${faker_1.faker.string.alphanumeric(8)}`
            })
                .expect(401);
            expect(response.body.statusCode).toBe(401);
        });
    });
});
//# sourceMappingURL=users.e2e-spec.js.map