import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

const ICONS = {
    success: <CheckCircle size={16} />,
    error: <XCircle size={16} />,
    warning: <AlertCircle size={16} />,
    info: <Info size={16} />,
};

const COLORS = {
    success: { bg: 'rgba(0, 204, 102, 0.12)', border: 'rgba(0, 204, 102, 0.25)', text: '#4ade80' },
    error: { bg: 'rgba(248, 81, 73, 0.12)', border: 'rgba(248, 81, 73, 0.25)', text: '#f85149' },
    warning: { bg: 'rgba(251, 191, 36, 0.12)', border: 'rgba(251, 191, 36, 0.25)', text: '#fbbf24' },
    info: { bg: 'rgba(13, 153, 255, 0.12)', border: 'rgba(13, 153, 255, 0.25)', text: '#0d99ff' },
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const idRef = useRef(0);

    const showToast = useCallback((message, type = 'info', duration = 3500) => {
        const id = ++idRef.current;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    const dismissToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toasts.length > 0 && (
                <div style={{
                    position: 'fixed',
                    top: '16px',
                    right: '16px',
                    zIndex: 10000,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    pointerEvents: 'none',
                }}>
                    {toasts.map(toast => {
                        const c = COLORS[toast.type] || COLORS.info;
                        return (
                            <div
                                key={toast.id}
                                style={{
                                    pointerEvents: 'auto',
                                    background: 'rgba(30, 30, 30, 0.85)',
                                    backdropFilter: 'blur(16px) saturate(180%)',
                                    WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                                    border: `1px solid ${c.border}`,
                                    borderRadius: '10px',
                                    padding: '10px 14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    color: c.text,
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
                                    minWidth: '220px',
                                    maxWidth: '400px',
                                    animation: 'toastSlideIn 0.25s ease-out',
                                }}
                            >
                                <span style={{ flexShrink: 0, display: 'flex' }}>{ICONS[toast.type]}</span>
                                <span style={{ flex: 1, color: '#ddd' }}>{toast.message}</span>
                                <button
                                    onClick={() => dismissToast(toast.id)}
                                    style={{
                                        background: 'none', border: 'none', color: '#666',
                                        cursor: 'pointer', padding: '2px', display: 'flex',
                                        flexShrink: 0,
                                    }}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
            <style>{`
                @keyframes toastSlideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </ToastContext.Provider>
    );
};
