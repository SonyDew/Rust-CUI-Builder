
const getCanvasFingerprint = () => {
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText('RustCUI', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('RustCUI', 4, 17);
        return canvas.toDataURL();
    } catch {
        return 'no-canvas';
    }
};

const getWebGLFingerprint = () => {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return 'no-webgl';
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (!debugInfo) return 'no-debug-info';
        return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown';
    } catch {
        return 'no-webgl';
    }
};

const hashString = (str) => {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
};

export const generateFingerprint = () => {
    const components = [
        navigator.userAgent,
        navigator.language,
        navigator.hardwareConcurrency || 0,
        navigator.maxTouchPoints || 0,
        screen.width + 'x' + screen.height,
        screen.colorDepth,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        getCanvasFingerprint(),
        getWebGLFingerprint(),
        navigator.platform || 'unknown',
    ];

    return hashString(components.join('|||'));
};

const FINGERPRINT_KEY = 'rcui_fp';

export const storeFingerprint = (fp) => {
    try {
        sessionStorage.setItem(FINGERPRINT_KEY, fp);
    } catch {
    }
};

export const getStoredFingerprint = () => {
    try {
        return sessionStorage.getItem(FINGERPRINT_KEY);
    } catch {
        return null;
    }
};

export const validateFingerprint = () => {
    const stored = getStoredFingerprint();
    if (!stored) return true;
    const current = generateFingerprint();
    return stored === current;
};
