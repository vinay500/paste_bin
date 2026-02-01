// const express = require('express');
// const cors = require('cors');
// const routes = require('./routes');
// const dotenv = require('dotenv');

// dotenv.config();

// const app = express();

// app.use(cors());
// app.use(express.json());

// const path = require("path");

// app.use(express.static(path.join(__dirname, "../../client/dist")));

// // app.get("*", (req, res) => {
// //     res.sendFile(path.join(__dirname, "../../client/dist/index.html"));
// // });


// app.get("/*", (req, res) => {
//     res.sendFile(path.join(__dirname, "../../client/dist/index.html"));
// });

// const { getPaste } = require('./pasteService');

// // View Paste (HTML)
// // View Paste (JSON) - mirroring API behavior as requested
// app.get('/p/:id', async (req, res) => {
//     try {
//         const result = await getPaste(req.params.id, req);

//         if (!result) {
//             return res.status(404).json({ error: 'Paste not found' });
//         }
//         if (result === 'expired' || result === 'view_limit_exceeded') {
//             return res.status(404).json({ error: 'Paste expired' });
//         }

//         // Return format: { content, remaining_views, expires_at }
//         // remaining_views may be null if unlimited
//         let remaining_views = null;
//         if (result.max_views !== null) {
//             // result.views_count is OLD value. We just incremented it.
//             // So remaining = max - (old + 1)
//             remaining_views = result.max_views - (result.views_count + 1);

//             // Secure: "No negative remaining views".
//             remaining_views = Math.max(0, remaining_views);
//         }

//         // expires_at
//         const expires_at = result.expires_at ? result.expires_at.toISOString() : null;

//         res.json({
//             content: result.content,
//             remaining_views,
//             expires_at
//         });

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });

// app.use('/api', routes);

// module.exports = app;















const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require("path");

dotenv.config();

const routes = require('./routes');
const { getPaste } = require('./pasteService');

const app = express();

app.use(cors());
app.use(express.json());

/**
 * 1️⃣ API ROUTES FIRST
 */
app.use('/api', routes);

/**
 * 2️⃣ (TEMPORARY) Backend /p/:id JSON route
 * You already said you'll remove this later — that's fine.
 */
app.get('/p/:id', async (req, res) => {
    try {
        const result = await getPaste(req.params.id, req);

        if (!result || result === 'expired' || result === 'view_limit_exceeded') {
            return res.status(404).json({ error: 'Paste not found' });
        }

        let remaining_views = null;
        if (result.max_views !== null) {
            remaining_views = Math.max(
                0,
                result.max_views - (result.views_count + 1)
            );
        }

        const expires_at = result.expires_at
            ? result.expires_at.toISOString()
            : null;

        res.json({
            content: result.content,
            remaining_views,
            expires_at
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * 3️⃣ SERVE REACT STATIC FILES
 */
app.use(express.static(path.join(__dirname, "../../client/dist")));

/**
 * 4️⃣ SPA FALLBACK (MUST BE LAST)
 * Express v5 requires "/*", not "*"
 */
app.use((req, res) => {
    res.sendFile(
        path.join(__dirname, "../../client/dist/index.html")
    );
});

module.exports = app;
