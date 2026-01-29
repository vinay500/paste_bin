const request = require('supertest');
const app = require('./app');
const prisma = require('./prisma');

beforeAll(async () => {
    await prisma.paste.deleteMany();
});

afterAll(async () => {
    await prisma.$disconnect();
});

describe('POST /api/pastes Validation Issues', () => {
    test('Should return 400 and error message for invalid ttl_seconds', async () => {
        const res = await request(app).post('/api/pastes').send({
            content: 'test content',
            ttl_seconds: -1
        });

        console.log('Status:', res.statusCode);
        console.log('Body:', JSON.stringify(res.body, null, 2));

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error');
        expect(Object.keys(res.body).length).toBeGreaterThan(0);
    });

    test('Should return 400 and error message for invalid max_views', async () => {
        const res = await request(app).post('/api/pastes').send({
            content: 'test content',
            max_views: 0
        });

        console.log('Status:', res.statusCode);
        console.log('Body:', JSON.stringify(res.body, null, 2));

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error');
        expect(Object.keys(res.body).length).toBeGreaterThan(0);
    });
});
