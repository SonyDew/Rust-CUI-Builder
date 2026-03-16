import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { Bell, Check, CheckCheck, Trash2, Share2, MessageSquare, TicketCheck, Info } from 'lucide-react';

const typeIcons = {
    share: Share2,
    comment: MessageSquare,
    ticket_reply: TicketCheck,
    info: Info,
};

const typeColors = {
    share: '#0d99ff',
    comment: '#00cc66',
    ticket_reply: '#ff9f43',
    info: '#888',
};

const NotificationBell = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const timeAgo = (date) => {
        const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    return (
        <div ref={panelRef} style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted, #aaa)',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '6px',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-main, #fff)'; e.currentTarget.style.background = 'var(--hover-bg, #333)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted, #aaa)'; e.currentTarget.style.background = 'none'; }}
                title="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '3px',
                        right: '3px',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: '#ff4d4d',
                        color: '#fff',
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: 1,
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '360px',
                    maxHeight: '480px',
                    background: 'var(--modal-bg, #252526)',
                    border: '1px solid var(--border, #333)',
                    borderRadius: '10px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                    zIndex: 10000,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    animation: 'fadeIn 0.15s ease',
                }}>
                    <div style={{
                        padding: '14px 16px',
                        borderBottom: '1px solid var(--border, #333)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}>
                        <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main, #fff)' }}>
                            Notifications
                        </span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    title="Mark all as read"
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#0d99ff',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        borderRadius: '4px',
                                        display: 'flex',
                                    }}
                                >
                                    <CheckCheck size={16} />
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button
                                    onClick={clearAll}
                                    title="Clear all"
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--text-muted, #888)',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        borderRadius: '4px',
                                        display: 'flex',
                                    }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        {notifications.length === 0 ? (
                            <div style={{
                                padding: '40px 20px',
                                textAlign: 'center',
                                color: 'var(--text-muted, #666)',
                                fontSize: '0.85rem',
                            }}>
                                <Bell size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                                <div>No notifications yet</div>
                            </div>
                        ) : (
                            notifications.map(notification => {
                                const IconComponent = typeIcons[notification.type] || Info;
                                const iconColor = typeColors[notification.type] || '#888';
                                return (
                                    <div
                                        key={notification.id}
                                        onClick={() => { if (!notification.read) markAsRead(notification.id); }}
                                        style={{
                                            padding: '12px 16px',
                                            borderBottom: '1px solid var(--border, rgba(255,255,255,0.05))',
                                            display: 'flex',
                                            gap: '12px',
                                            cursor: notification.read ? 'default' : 'pointer',
                                            background: notification.read ? 'transparent' : 'rgba(13, 153, 255, 0.04)',
                                            transition: 'background 0.2s',
                                        }}
                                        onMouseEnter={(e) => { if (!notification.read) e.currentTarget.style.background = 'rgba(13, 153, 255, 0.08)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = notification.read ? 'transparent' : 'rgba(13, 153, 255, 0.04)'; }}
                                    >
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '8px',
                                            background: `${iconColor}20`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            <IconComponent size={16} color={iconColor} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontSize: '0.85rem',
                                                fontWeight: notification.read ? 400 : 600,
                                                color: 'var(--text-main, #fff)',
                                                marginBottom: '2px',
                                            }}>
                                                {notification.title}
                                            </div>
                                            <div style={{
                                                fontSize: '0.78rem',
                                                color: 'var(--text-muted, #888)',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                {notification.message}
                                            </div>
                                            <div style={{
                                                fontSize: '0.7rem',
                                                color: 'var(--text-muted, #666)',
                                                marginTop: '4px',
                                            }}>
                                                {timeAgo(notification.created_at)}
                                            </div>
                                        </div>
                                        {!notification.read && (
                                            <div style={{
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '50%',
                                                background: '#0d99ff',
                                                flexShrink: 0,
                                                marginTop: '6px',
                                            }} />
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
