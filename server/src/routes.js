const express = require('express');
const { z } = require('zod');
const prisma = require('./prisma');
const { getCurrentTime } = require('./time');
const { getPaste } = require('./pasteService');
const crypto = require('crypto');

const router = express.Router();

// Health Check
router.get('/healthz', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ ok: true });
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(500).json({ ok: false, error: 'Database connection failed' });
    }
});

const createPasteSchema = z.object({
    content: z.string().min(1),
    ttl_seconds: z.number().int().min(1).optional(),
    max_views: z.number().int().min(1).optional(),
});

function tryParse(str) {
    try {
        return JSON.parse(str);
    } catch (e) {
        return str;
    }
}

// Create Paste
router.post('/pastes', async (req, res) => {
    try {
        const { content, ttl_seconds, max_views } = createPasteSchema.parse(req.body);

        const id = crypto.randomUUID(); // Requirement says string ID, UUID is safest. Requirements also mentioned NanoID but UUID is built-in.
        // user asked for valid id. Implementation plan said NanoID/UUID. I'll use UUID for simplicity in JS.

        // Creation time is always real server time, expiry is relative to it?
        // "Paste expires when either TTL or view limit triggers"
        // "Use this value [x-test-now-ms] as current time ONLY for expiry logic" -> implied for checking if expired.
        // For CREATION, we should store created_at as real time? 
        // Requirement: "If header is absent → fallback to real system time. This logic must only affect TTL checks, not timestamps stored in DB."
        // So created_at is always real time.
        // But calculate expires_at? 
        // If we store expires_at as a Date, we calculate it now.
        // If we calculate it now, should we use test time?
        // "This logic must only affect TTL checks, not timestamps stored in DB."
        // It's cleaner to calculate expires_at based on real time if TTL is provided.

        const now = new Date(); // Real time for creation
        let expiresAt = null;
        if (ttl_seconds) {
            expiresAt = new Date(now.getTime() + ttl_seconds * 1000);
        }

        const paste = await prisma.paste.create({
            data: {
                id,
                content,
                max_views: max_views || null,
                expires_at: expiresAt,
                created_at: now,
            },
        });

        // Requirement: return { id, url }
        // We need to know the domain. For now, localhost or from host header.
        const clientUrl = process.env.CLIENT_URL || `${req.protocol}://${req.get('host')}`;
        const url = `${clientUrl}/p/${id}`;

        res.json({ id, url });
    } catch (error) {
        if (error instanceof z.ZodError) {
            // In some Zod versions/configurations, error.errors might be missing or non-enumerable.
            // error.issues is the standard array. error.message often contains the stringified JSON.
            const validationErrors = error.issues || error.errors || (tryParse(error.message));
            res.status(400).json({ error: validationErrors });
        } else {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});

// Fetch Paste API
router.get('/pastes/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await getPaste(id, req);

        if (!result) {
            return res.status(404).json({ error: 'Paste not found' });
        }
        if (result === 'expired' || result === 'view_limit_exceeded') {
            return res.status(404).json({ error: 'Paste expired' });
        }

        // Return format: { content, remaining_views, expires_at }
        // remaining_views may be null if unlimited
        let remaining_views = null;
        if (result.max_views !== null) {
            // result.views_count is OLD value. We just incremented it.
            // So remaining = max - (old + 1)
            remaining_views = result.max_views - (result.views_count + 1);

            // Secure: "No negative remaining views".
            remaining_views = Math.max(0, remaining_views);
        }

        // expires_at
        const expires_at = result.expires_at ? result.expires_at.toISOString() : null;

        res.json({
            content: result.content,
            remaining_views,
            expires_at
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
