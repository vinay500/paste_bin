const request = require('supertest');
const app = require('./app');
const prisma = require('./prisma');

beforeAll(async () => {
    await prisma.paste.deleteMany();
});

afterAll(async () => {
    await prisma.$disconnect();
});

describe('Strict Requirements Verification', () => {

    test('Paste with max_views = 1 should allow 1 fetch then 404', async () => {
        const createRes = await request(app).post('/api/pastes').send({
            content: 'One View Only',
            max_views: 1
        });
        const id = createRes.body.id;

        // First fetch (API) -> 200
        const fetch1 = await request(app).get(`/api/pastes/${id}`);
        expect(fetch1.statusCode).toBe(200);
        expect(fetch1.body.remaining_views).toBe(0);

        // Second fetch (API) -> 404
        const fetch2 = await request(app).get(`/api/pastes/${id}`);
        expect(fetch2.statusCode).toBe(404);
        expect(fetch2.body.error).toBe('Paste expired');
    });

    test('GET /p/:id JSON route returns valid JSON with content', async () => {
        const createRes = await request(app).post('/api/pastes').send({
            content: '<h1>Hello HTML</h1>'
        });
        const id = createRes.body.id;

        const res = await request(app).get(`/p/${id}`);
        expect(res.statusCode).toBe(200);
        expect(res.header['content-type']).toMatch(/application\/json/);
        // Should contain raw content
        expect(res.body.content).toBe('<h1>Hello HTML</h1>');
    });

    test('GET /p/:id JSON route returns 404 JSON for missing paste', async () => {
        const res = await request(app).get('/p/non-existent-uuid');
        expect(res.statusCode).toBe(404);
        expect(res.header['content-type']).toMatch(/application\/json/);
        expect(res.body.error).toBe('Paste not found');
    });

    test('GET /p/:id respects expiry with x-test-now-ms', async () => {
        const createRes = await request(app).post('/api/pastes').send({
            content: 'Expiry HTML',
            ttl_seconds: 10
        });
        const id = createRes.body.id;

        // Normal fetch OK
        const res1 = await request(app).get(`/p/${id}`);
        expect(res1.statusCode).toBe(200);

        // Time travel
        process.env.TEST_MODE = '1';
        const future = Date.now() + 20000; // +20s

        const res2 = await request(app)
            .get(`/p/${id}`)
            .set('x-test-now-ms', String(future));

        expect(res2.statusCode).toBe(404);
        expect(res2.statusCode).toBe(404);
        expect(res2.body.error).toBe('Paste expired');
    });
});
