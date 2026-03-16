import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { config } from './config.js';

export const logSecurityEvent = async (payload, requestMeta = {}) => {
    const entry = {
        timestamp: new Date().toISOString(),
        ...payload,
        ...requestMeta,
    };

    const targetFile = config.securityEventLog;
    await mkdir(path.dirname(targetFile), { recursive: true });
    await appendFile(targetFile, `${JSON.stringify(entry)}\n`, 'utf8');
};
