/**
 * Offline mode utilities
 * - Service worker registration
 * - Online/offline state detection
 * - Offline queue for syncing changes when back online
 */

const SW_PATH = '/sw.js';
const OFFLINE_QUEUE_KEY = 'rcui_offline_queue';

/**
 * Register the service worker
 */
export const registerServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) {
        console.log('[Offline] Service workers not supported');
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.register(SW_PATH, {
            scope: '/',
        });

        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'activated') {
                        // New version available - could show a toast
                        console.log('[Offline] New service worker activated');
                    }
                });
            }
        });

        console.log('[Offline] Service worker registered');
        return registration;
    } catch (err) {
        console.warn('[Offline] Service worker registration failed:', err);
        return null;
    }
};

/**
 * Check if the browser is online
 */
export const isOnline = () => navigator.onLine;

/**
 * Subscribe to online/offline changes
 * Returns an unsubscribe function
 */
export const onConnectivityChange = (callback) => {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
};

/**
 * Queue a project save for when we come back online
 */
export const queueOfflineSave = (projectId, projectData) => {
    try {
        const queue = getOfflineQueue();
        // Replace any existing entry for the same project
        const filtered = queue.filter((item) => item.projectId !== projectId);
        filtered.push({
            projectId,
            projectData,
            timestamp: Date.now(),
        });
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
    } catch (err) {
        console.warn('[Offline] Failed to queue save:', err);
    }
};

/**
 * Get all queued offline saves
 */
export const getOfflineQueue = () => {
    try {
        const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

/**
 * Clear the offline queue (after successful sync)
 */
export const clearOfflineQueue = () => {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
};

/**
 * Process the offline queue - attempt to save all queued projects
 * @param {Function} saveFn - async function(projectId, projectData) that performs the actual save
 * @returns {Object} { synced: number, failed: number }
 */
export const processOfflineQueue = async (saveFn) => {
    const queue = getOfflineQueue();
    if (queue.length === 0) return { synced: 0, failed: 0 };

    let synced = 0;
    let failed = 0;
    const remaining = [];

    for (const item of queue) {
        try {
            await saveFn(item.projectId, item.projectData);
            synced++;
        } catch {
            failed++;
            remaining.push(item);
        }
    }

    if (remaining.length > 0) {
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
    } else {
        clearOfflineQueue();
    }

    return { synced, failed };
};
