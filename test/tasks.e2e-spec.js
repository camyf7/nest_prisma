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
const database_service_1 = require("../src/database/database.service");
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const supertest_1 = __importDefault(require("supertest"));
const config_1 = require("@nestjs/config");
const tasks_module_1 = require("../src/tasks/tasks.module");
const users_module_1 = require("../src/users/users.module");
const auth_module_1 = require("../src/auth/auth.module");
const serve_static_1 = require("@nestjs/serve-static");
const node_path_1 = require("node:path");
const dotenv = __importStar(require("dotenv"));
const faker_1 = require("@faker-js/faker");
dotenv.config({ path: '.env' });
describe('Tasks (e2e)', () => {
    let app;
    let databaseService;
    let createdUserIds = [];
    let createdTaskIds = [];
    const makeCreateUserDto = () => {
        const unique = `${Date.now()}-${faker_1.faker.number.int({ min: 1000, max: 9999 })}`;
        return {
            name: faker_1.faker.person.fullName(),
            email: `task-user-${unique}@example.com`,
            password: `Aa1!${faker_1.faker.string.alphanumeric(8)}`
        };
    };
    const makeCreateTaskDto = () => {
        const unique = `${Date.now()}-${faker_1.faker.number.int({ min: 1000, max: 9999 })}`;
        return {
            name: `Task ${unique}`,
            description: `Description for task ${unique}`
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
        if (createdTaskIds.length > 0) {
            await databaseService.task.deleteMany({
                where: {
                    id: {
                        in: createdTaskIds
                    }
                }
            });
        }
        if (createdUserIds.length > 0) {
            await databaseService.user.deleteMany({
                where: {
                    id: {
                        in: createdUserIds
                    }
                }
            });
        }
        createdTaskIds = [];
        createdUserIds = [];
    });
    afterAll(async () => {
        await databaseService.$disconnect();
        await app.close();
    });
    describe('/tasks', () => {
        it('/tasks (POST) - createTask', async () => {
            const { token, userId } = await createUserAndLogin();
            const createTaskDto = makeCreateTaskDto();
            const response = await (0, supertest_1.default)(app.getHttpServer())
                .post('/tasks')
                .set('Authorization', `Bearer ${token}`)
                .send(createTaskDto)
                .expect(201);
            createdTaskIds.push(response.body.id);
            expect(response.body).toEqual(expect.objectContaining({
                id: expect.any(Number),
                name: createTaskDto.name,
                description: createTaskDto.description,
                completed: false,
                userId,
            }));
        });
        it('/tasks (POST) - should return bad request with invalid payload', async () => {
            const { token } = await createUserAndLogin();
            const response = await (0, supertest_1.default)(app.getHttpServer())
                .post('/tasks')
                .set('Authorization', `Bearer ${token}`)
                .send({
                name: 'abc',
                description: 'short'
            })
                .expect(400);
            expect(response.body.statusCode).toBe(400);
        });
        it('/tasks (POST) - should return unauthorized without token', async () => {
            const createTaskDto = makeCreateTaskDto();
            const response = await (0, supertest_1.default)(app.getHttpServer())
                .post('/tasks')
                .send(createTaskDto)
                .expect(401);
            expect(response.body.statusCode).toBe(401);
        });
        it('/tasks (GET) - findAllTasks', async () => {
            const { token } = await createUserAndLogin();
            const createTaskDto = makeCreateTaskDto();
            const createResponse = await (0, supertest_1.default)(app.getHttpServer())
                .post('/tasks')
                .set('Authorization', `Bearer ${token}`)
                .send(createTaskDto)
                .expect(201);
            createdTaskIds.push(createResponse.body.id);
            const response = await (0, supertest_1.default)(app.getHttpServer())
                .get('/tasks?limit=10&offset=0')
                .expect(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
        });
        it('/tasks/:id (GET) - findOneTask', async () => {
            const { token } = await createUserAndLogin();
            const createTaskDto = makeCreateTaskDto();
            const createResponse = await (0, supertest_1.default)(app.getHttpServer())
                .post('/tasks')
                .set('Authorization', `Bearer ${token}`)
                .send(createTaskDto)
                .expect(201);
            createdTaskIds.push(createResponse.body.id);
            const response = await (0, supertest_1.default)(app.getHttpServer())
                .get(`/tasks/${createResponse.body.id}`)
                .expect(200);
            expect(response.body).toEqual(expect.objectContaining({
                id: createResponse.body.id,
                name: createTaskDto.name,
                description: createTaskDto.description
            }));
        });
        it('/tasks/:id (GET) - should return task not found', async () => {
            const response = await (0, supertest_1.default)(app.getHttpServer())
                .get('/tasks/999999')
                .expect(404);
            expect(response.body.statusCode).toBe(404);
        });
        it('/tasks/:id (PUT) - updateTask', async () => {
            const { token } = await createUserAndLogin();
            const createTaskDto = makeCreateTaskDto();
            const createResponse = await (0, supertest_1.default)(app.getHttpServer())
                .post('/tasks')
                .set('Authorization', `Bearer ${token}`)
                .send(createTaskDto)
                .expect(201);
            createdTaskIds.push(createResponse.body.id);
            const updateTaskDto = {
                name: `Updated ${faker_1.faker.word.words(2)}`,
                description: `Updated description ${faker_1.faker.word.words(4)}`,
                completed: true
            };
            const response = await (0, supertest_1.default)(app.getHttpServer())
                .put(`/tasks/${createResponse.body.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send(updateTaskDto)
                .expect(200);
            expect(response.body).toEqual(expect.objectContaining({
                id: createResponse.body.id,
                name: updateTaskDto.name,
                description: updateTaskDto.description,
                completed: true
            }));
        });
        it('/tasks/:id (PUT) - should return unauthorized without token', async () => {
            const response = await (0, supertest_1.default)(app.getHttpServer())
                .put('/tasks/1')
                .send({ name: 'Task Update Without Token' })
                .expect(401);
            expect(response.body.statusCode).toBe(401);
        });
        it('/tasks/:id (PUT) - should return unauthorized with token from another user', async () => {
            const owner = await createUserAndLogin();
            const otherUser = await createUserAndLogin();
            const createTaskDto = makeCreateTaskDto();
            const createResponse = await (0, supertest_1.default)(app.getHttpServer())
                .post('/tasks')
                .set('Authorization', `Bearer ${otherUser.token}`)
                .send(createTaskDto)
                .expect(201);
            createdTaskIds.push(createResponse.body.id);
            const response = await (0, supertest_1.default)(app.getHttpServer())
                .put(`/tasks/${createResponse.body.id}`)
                .set('Authorization', `Bearer ${owner.token}`)
                .send({ name: 'Task Update Unauthorized' })
                .expect(401);
            expect(response.body.statusCode).toBe(401);
        });
        it('/tasks/:id (PUT) - should return task not found with valid token', async () => {
            const { token } = await createUserAndLogin();
            const response = await (0, supertest_1.default)(app.getHttpServer())
                .put('/tasks/999999')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Task Not Found Update' })
                .expect(404);
            expect(response.body.statusCode).toBe(404);
        });
        it('/tasks/:id (DELETE) - deleteTask', async () => {
            const { token } = await createUserAndLogin();
            const createTaskDto = makeCreateTaskDto();
            const createResponse = await (0, supertest_1.default)(app.getHttpServer())
                .post('/tasks')
                .set('Authorization', `Bearer ${token}`)
                .send(createTaskDto)
                .expect(201);
            createdTaskIds.push(createResponse.body.id);
            const deleteResponse = await (0, supertest_1.default)(app.getHttpServer())
                .delete(`/tasks/${createResponse.body.id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200);
            expect(deleteResponse.body).toEqual({
                message: 'Tarefa deletada com sucesso'
            });
            createdTaskIds = createdTaskIds.filter((id) => id !== createResponse.body.id);
            const getResponse = await (0, supertest_1.default)(app.getHttpServer())
                .get(`/tasks/${createResponse.body.id}`)
                .expect(404);
            expect(getResponse.body.statusCode).toBe(404);
        });
        it('/tasks/:id (DELETE) - should return unauthorized without token', async () => {
            const response = await (0, supertest_1.default)(app.getHttpServer())
                .delete('/tasks/1')
                .expect(401);
            expect(response.body.statusCode).toBe(401);
        });
        it('/tasks/:id (DELETE) - should return unauthorized with token from another user', async () => {
            const owner = await createUserAndLogin();
            const otherUser = await createUserAndLogin();
            const createTaskDto = makeCreateTaskDto();
            const createResponse = await (0, supertest_1.default)(app.getHttpServer())
                .post('/tasks')
                .set('Authorization', `Bearer ${otherUser.token}`)
                .send(createTaskDto)
                .expect(201);
            createdTaskIds.push(createResponse.body.id);
            const response = await (0, supertest_1.default)(app.getHttpServer())
                .delete(`/tasks/${createResponse.body.id}`)
                .set('Authorization', `Bearer ${owner.token}`)
                .expect(401);
            expect(response.body.statusCode).toBe(401);
        });
        it('/tasks/:id (DELETE) - should return task not found with valid token', async () => {
            const { token } = await createUserAndLogin();
            const response = await (0, supertest_1.default)(app.getHttpServer())
                .delete('/tasks/999999')
                .set('Authorization', `Bearer ${token}`)
                .expect(404);
            expect(response.body.statusCode).toBe(404);
        });
    });
});
//# sourceMappingURL=tasks.e2e-spec.js.map