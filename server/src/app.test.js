const request = require('supertest');
const app = require('./app');
const prisma = require('./prisma');

beforeAll(async () => {
    // Clean DB
    await prisma.paste.deleteMany();
});

afterAll(async () => {
    await prisma.$disconnect();
});

describe('Pastebin API', () => {
    let createdId;

    it('GET /api/healthz returns 200', async () => {
        const res = await request(app).get('/api/healthz');
        expect(res.statusCode).toBe(200);
        expect(res.body.ok).toBe(true);
    });

    it('POST /api/pastes creates a paste', async () => {
        const res = await request(app).post('/api/pastes').send({
            content: 'Hello World',
            max_views: 2
        });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('url');
        createdId = res.body.id;
    });

    it('GET /api/pastes/:id returns content', async () => {
        const res = await request(app).get(`/api/pastes/${createdId}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.content).toBe('Hello World');
        expect(res.body.remaining_views).toBe(1);
    });

    it('GET /api/pastes/:id second time returns content and 0 remaining', async () => {
        const res = await request(app).get(`/api/pastes/${createdId}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.content).toBe('Hello World');
        expect(res.body.remaining_views).toBe(0);
    });

    it('GET /api/pastes/:id third time returns 404 (View Limit)', async () => {
        const res = await request(app).get(`/api/pastes/${createdId}`);
        expect(res.statusCode).toBe(404);
        expect(res.body.error).toBe('Paste expired');
    });

    it('TTL Expiry Test with Time Travel', async () => {
        // Create paste with 60s TTL
        const res = await request(app).post('/api/pastes').send({
            content: 'Transient',
            ttl_seconds: 60
        });
        const id = res.body.id;

        // Normal fetch
        const fetch1 = await request(app).get(`/api/pastes/${id}`);
        expect(fetch1.statusCode).toBe(200);

        // Time travel +61s
        const now = new Date();
        const future = new Date(now.getTime() + 61000).getTime();

        // Enable Test Mode BEFORE request
        process.env.TEST_MODE = '1';

        const fetch2 = await request(app)
            .get(`/api/pastes/${id}`)
            .set('x-test-now-ms', String(future));

        expect(fetch2.statusCode).toBe(404);
    });
});
