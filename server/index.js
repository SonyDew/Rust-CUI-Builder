import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { config } from './lib/config.js';
import { sendError } from './lib/http.js';
import rcuiRoutes from './routes/rcui.js';
import securityRoutes from './routes/security.js';
import stripeRoutes from './routes/stripe.js';

const app = express();

app.disable('x-powered-by');
app.use(cors({ origin: true, credentials: true }));

app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'rust-cui-builder-api' });
});

app.use('/api/security', securityRoutes);
app.use('/api/rcui', rcuiRoutes);
app.use('/api/stripe', stripeRoutes);

app.use((req, res) => {
    res.status(404).json({ error: `No route matches ${req.method} ${req.originalUrl}` });
});

app.use((error, _req, res, _next) => {
    console.error('[api]', error);
    sendError(error, res);
});

app.listen(config.apiPort, () => {
    console.log(`[api] listening on http://localhost:${config.apiPort}`);
});
