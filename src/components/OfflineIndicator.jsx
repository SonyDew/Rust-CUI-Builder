import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { isOnline, onConnectivityChange } from '../utils/offline';

/**
 * A small floating indicator that shows when the user goes offline.
 * It auto-hides 3 seconds after connectivity is restored.
 */
const OfflineIndicator = () => {
    const [online, setOnline] = useState(isOnline());
    const [showBanner, setShowBanner] = useState(false);
    const [dismissing, setDismissing] = useState(false);

    useEffect(() => {
        const unsub = onConnectivityChange((status) => {
            setOnline(status);
            if (!status) {
                setShowBanner(true);
                setDismissing(false);
            } else {
                // Show "back online" briefly then dismiss
                setShowBanner(true);
                setDismissing(false);
                setTimeout(() => {
                    setDismissing(true);
                    setTimeout(() => setShowBanner(false), 400);
                }, 2500);
            }
        });
        return unsub;
    }, []);

    if (!showBanner) return null;

    const isOffline = !online;

    return (
        <div
            className="offline-indicator"
            style={{
                position: 'fixed',
                bottom: '20px',
                left: '50%',
                transform: `translateX(-50%) translateY(${dismissing ? '20px' : '0'})`,
                zIndex: 10001,
                background: isOffline
                    ? 'rgba(239, 68, 68, 0.15)'
                    : 'rgba(74, 222, 128, 0.15)',
                backdropFilter: 'blur(16px) saturate(180%)',
                WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                border: `1px solid ${isOffline ? 'rgba(239, 68, 68, 0.3)' : 'rgba(74, 222, 128, 0.3)'}`,
                borderRadius: '12px',
                padding: '10px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: isOffline ? '#f87171' : '#4ade80',
                fontSize: '13px',
                fontWeight: '600',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                transition: 'all 0.4s ease',
                opacity: dismissing ? 0 : 1,
                pointerEvents: 'none',
            }}
        >
            {isOffline ? <WifiOff size={16} /> : <Wifi size={16} />}
            {isOffline
                ? 'You are offline — changes will sync when reconnected'
                : 'Back online — syncing changes...'}
        </div>
    );
};

export default OfflineIndicator;
