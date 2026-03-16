import express from 'express';
import { asyncHandler } from '../lib/http.js';
import { logSecurityEvent } from '../lib/securityLog.js';

const router = express.Router();

router.post('/event', express.json({ limit: '256kb' }), asyncHandler(async (req, res) => {
    const { type = 'UNKNOWN', details = '', level = 'INFO', user = null } = req.body || {};

    await logSecurityEvent(
        { type, details, level, user },
        {
            ip: req.ip,
            userAgent: req.get('user-agent') || null,
        }
    );

    res.status(202).json({ ok: true });
}));

export default router;
