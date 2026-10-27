import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { authRouter, loadUser, requireUser } from './auth.js';
import { catalogRouter } from './catalog.js';
import { favouritesRouter } from './favourites.js';
import { cartRouter } from './cart.js';
import { HttpError } from './errors.js';

const app = express();
const PORT = Number(process.env.PORT || 3001);

app.disable('x-powered-by');
app.use(express.json({ limit: '50kb' }));

// The site sends this header on every change; other websites can't add it without CORS,
// so it blocks cross-site form posts riding on the login cookie.
app.use('/api', (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.get('X-Requested-With') !== 'fetch') {
        throw new HttpError(403, 'Request blocked.');
    }
    next();
});

app.use('/api', loadUser);
app.use('/api/auth', authRouter);
app.use('/api', catalogRouter);
// everything below needs a logged-in user
app.use('/api', requireUser);
app.use('/api', favouritesRouter);
app.use('/api', cartRouter);
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

// In production, also serve the built React app (npm run build → dist/).
const dist = fileURLToPath(new URL('../dist', import.meta.url));
if (existsSync(dist)) {
    app.use(express.static(dist));
    app.use((req, res, next) => {
        if (req.method !== 'GET') return next();
        res.sendFile('index.html', { root: dist });
    });
}

app.use((err, req, res, next) => {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid request.' });
    console.error(err);
    res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
});

app.listen(PORT, () => console.log(`Angel Dust API listening on http://localhost:${PORT}`));
