import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { config, hasRcuiEncryption } from './config.js';
import { httpError } from './http.js';

const IV_LENGTH = 12;
const TAG_LENGTH = 16;

const getKey = () => createHash('sha256').update(config.rcuiEncryptionKey).digest();

const ensureRcuiEncryption = () => {
    if (!hasRcuiEncryption) {
        throw httpError(503, 'RCUI encryption is not configured. Set RCUI_ENCRYPTION_KEY first.');
    }
};

export const encryptRcuiPayload = (payload) => {
    ensureRcuiEncryption();

    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
    const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return Buffer.concat([iv, authTag, encrypted]);
};

export const decryptRcuiPayload = (buffer) => {
    ensureRcuiEncryption();

    const bytes = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    if (bytes.length <= IV_LENGTH + TAG_LENGTH) {
        throw httpError(400, 'Invalid RCUI payload.');
    }

    const iv = bytes.subarray(0, IV_LENGTH);
    const authTag = bytes.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encrypted = bytes.subarray(IV_LENGTH + TAG_LENGTH);

    try {
        const decipher = createDecipheriv('aes-256-gcm', getKey(), iv);
        decipher.setAuthTag(authTag);
        const plaintext = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        return JSON.parse(plaintext.toString('utf8'));
    } catch (error) {
        throw httpError(400, 'Failed to decrypt RCUI payload.', error.message);
    }
};
