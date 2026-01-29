const prisma = require('./prisma');
const { getCurrentTime } = require('./time');

/**
 * Fetch a paste by ID, handling strict expiry and view limit logic.
 * Increments view count if valid.
 * 
 * @param {string} id - The paste ID
 * @param {import('express').Request} req - Express request object (for headers)
 * @returns {Promise<Object|string|null>} - Returns paste object, 'expired', 'view_limit_exceeded', or null if not found.
 */
async function getPaste(id, req) {
    const now = getCurrentTime(req);

    // Atomic transaction to check constraints and increment view
    const result = await prisma.$transaction(async (tx) => {
        const paste = await tx.paste.findUnique({
            where: { id },
        });

        if (!paste) return null;

        // 1. Check Expiry (TTL)
        if (paste.expires_at && now > paste.expires_at) {
            return 'expired';
        }

        // 2. Check View Limits
        if (paste.max_views !== null) {
            // Requirement: "Paste with max_views = 1: first API fetch -> 200"
            // If current views_count is equal to max_views, it means we have ALREADY served it max times?
            // "Paste with max_views = 1. first fetch -> 200. views_count becomes 1. second fetch -> check 1 >= 1 -> fail?"

            // Logic:
            // views_count starts at 0.
            // Request 1: 0 < 1. Allowed. Increment to 1. Return.
            // Request 2: 1 >= 1. Blocked.

            if (paste.views_count >= paste.max_views) {
                return 'view_limit_exceeded';
            }

            // Increment view count
            await tx.paste.update({
                where: { id },
                data: { views_count: { increment: 1 } },
            });
        } else {
            // Unlimited views, track count anyway
            await tx.paste.update({
                where: { id },
                data: { views_count: { increment: 1 } },
            });
        }

        return paste;
    });

    return result;
}

module.exports = { getPaste };
