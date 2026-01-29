const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const { getPaste } = require('./pasteService');

// View Paste (HTML)
// View Paste (JSON) - mirroring API behavior as requested
app.get('/p/:id', async (req, res) => {
    try {
        const result = await getPaste(req.params.id, req);

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

app.use('/api', routes);

module.exports = app;
