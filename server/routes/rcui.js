import express from 'express';
import { encryptRcuiPayload, decryptRcuiPayload } from '../lib/rcuiCrypto.js';
import { asyncHandler, httpError } from '../lib/http.js';

const router = express.Router();

router.post('/encrypt', express.json({ limit: '5mb' }), asyncHandler(async (req, res) => {
    if (!req.body || typeof req.body !== 'object') {
        throw httpError(400, 'Expected a JSON RCUI payload.');
    }

    const encrypted = encryptRcuiPayload(req.body);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(encrypted);
}));

router.post('/decrypt', express.raw({ type: '*/*', limit: '10mb' }), asyncHandler(async (req, res) => {
    if (!req.body || !req.body.length) {
        throw httpError(400, 'Expected a binary RCUI payload.');
    }

    const payload = decryptRcuiPayload(req.body);
    res.json(payload);
}));

export default router;
