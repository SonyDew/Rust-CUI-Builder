import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, ExternalLink, Zap, Star, Bug, Wrench } from 'lucide-react';

const CURRENT_VERSION = '1.6.0';

const changelog = [
    {
        version: '1.6.0',
        date: '2026-03-16',
        entries: [
            { type: 'feature', text: 'Export projects as Rust C# plugin starter files' },
            { type: 'feature', text: 'Buttons and input fields now expose command settings for generated code' },
            { type: 'improvement', text: 'Dashboard and editor now separate C# export from .rcui backup export' },
        ],
    },
    {
        version: '1.5.0',
        date: '2026-03-04',
        entries: [
            { type: 'feature', text: 'Desktop app for Windows' },
            { type: 'feature', text: 'Export and import projects as .rcui files for backup or sharing' },
            { type: 'feature', text: 'Favorite projects — star them to find them quickly in the sidebar' },
            { type: 'feature', text: 'Mobile-friendly editor — view your projects on phones and tablets' },
            { type: 'feature', text: 'Offline support — keep working without internet, changes sync automatically' },
            { type: 'improvement', text: 'Dashboard now works great on mobile devices' },
            { type: 'feature', text: 'What\'s New panel — see the latest updates right from the dashboard' },
        ],
    },
    {
        version: '1.4.0',
        date: '2026-01-13',
        entries: [
            { type: 'feature', text: 'Rename projects directly from the top-left panel in the editor' },
            { type: 'feature', text: 'Rename elements inline from the hierarchy panel' },
            { type: 'feature', text: 'Tutorial overlay for first-time users to learn the editor' },
            { type: 'feature', text: 'Shortcuts panel — view all keyboard shortcuts at a glance' },
            { type: 'improvement', text: 'Faster page loads and smoother editor performance' },
            { type: 'improvement', text: 'Refreshed UI with glass-morphism design across the app' },
        ],
    },
    {
        version: '1.3.0',
        date: '2025-12-01',
        entries: [
            { type: 'feature', text: 'Share projects publicly or privately with other users' },
            { type: 'feature', text: 'Invite collaborators with view, comment, or edit access' },
            { type: 'feature', text: 'Leave comments directly on projects' },
            { type: 'feature', text: 'Real-time notifications for shares, comments, and updates' },
            { type: 'feature', text: 'Live updates when collaborators edit shared projects' },
        ],
    },
    {
        version: '1.2.0',
        date: '2025-10-15',
        entries: [
            { type: 'feature', text: 'Support tickets — get help directly from the dashboard' },
            { type: 'feature', text: 'Track ticket status and message history' },
            { type: 'feature', text: 'Find and view other users\' profiles' },
            { type: 'improvement', text: 'Better account security and protection' },
        ],
    },
    {
        version: '1.1.0',
        date: '2025-09-01',
        entries: [
            { type: 'feature', text: 'Asset Manager — upload and organize images and backgrounds' },
            { type: 'feature', text: 'Snippet Library — save and reuse UI components across projects' },
            { type: 'feature', text: 'Version History — save, name, restore, and delete snapshots of your project' },
            { type: 'feature', text: 'Plans and billing — Free, Solo, and Team tiers with Stripe checkout' },
            { type: 'feature', text: 'Community templates — browse and fork public project templates' },
            { type: 'feature', text: 'Teams — create teams and manage members with role-based access' },
            { type: 'improvement', text: 'Draft projects — save work-in-progress separately from published projects' },
            { type: 'improvement', text: 'Duplicate projects from the dashboard' },
        ],
    },
    {
        version: '1.0.2',
        date: '2025-07-15',
        entries: [
            { type: 'feature', text: 'Context menus — right-click elements and hierarchy items for quick actions' },
            { type: 'feature', text: 'Drag-and-drop reordering in the hierarchy panel' },
            { type: 'feature', text: 'Multi-select elements on canvas with Ctrl/Shift click' },
            { type: 'feature', text: 'Double-click a parent to select its children' },
            { type: 'feature', text: 'Copy and paste elements with Ctrl+C / Ctrl+V' },
            { type: 'feature', text: 'Snap-to-grid and alignment guides when dragging elements' },
            { type: 'improvement', text: 'Zoom now follows your cursor position' },
            { type: 'improvement', text: 'Layer ordering controls — bring forward, send backward' },
        ],
    },
    {
        version: '1.0.1',
        date: '2025-06-15',
        entries: [
            { type: 'feature', text: 'Shadow, outline, and blur effects on elements' },
            { type: 'feature', text: 'Undo/redo support for all element changes' },
            { type: 'improvement', text: 'Auto-save indicator shows when your project is saving' },
            { type: 'improvement', text: 'Smoother canvas panning and resizing' },
            { type: 'fix', text: 'Fixed element anchors not updating correctly on resize' },
        ],
    },
    {
        version: '1.0.0',
        date: '2025-06-01',
        entries: [
            { type: 'feature', text: 'Visual drag-and-drop editor for Rust CUI interfaces' },
            { type: 'feature', text: 'Panels, Buttons, Text, Images, Input Fields, Countdowns, ScrollViews' },
            { type: 'feature', text: 'Property inspector — anchors, offsets, colors, fonts, shadows, and more' },
            { type: 'feature', text: 'Element hierarchy panel with nesting, visibility, and lock toggles' },
            { type: 'feature', text: 'Color picker with hex/RGB input and recent colors' },
            { type: 'feature', text: 'Code generation — export your designs as Rust C# UI starter code' },
            { type: 'feature', text: 'Auto-save as you work' },
            { type: 'feature', text: 'Project dashboard with search, create, rename, and trash' },
            { type: 'feature', text: 'Keyboard shortcuts for duplicate, delete, multi-select, and more' },
            { type: 'feature', text: 'Dark theme IDE-style workspace' },
            { type: 'feature', text: 'Email and magic link authentication' },
        ],
    },
];

const STORAGE_KEY = 'rcui-whats-new-seen';

const typeConfig = {
    feature: { icon: Zap, color: '#0d99ff', label: 'New' },
    improvement: { icon: Wrench, color: '#00cc66', label: 'Improved' },
    fix: { icon: Bug, color: '#ff9f43', label: 'Fix' },
};

const WhatsNew = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [hasNew, setHasNew] = useState(false);
    const panelRef = useRef(null);

    useEffect(() => {
        const seen = localStorage.getItem(STORAGE_KEY);
        if (seen !== CURRENT_VERSION) {
            setHasNew(true);
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleOpen = () => {
        setIsOpen(!isOpen);
        if (hasNew) {
            localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
            setHasNew(false);
        }
    };

    return (
        <div ref={panelRef} style={{ position: 'relative' }}>
            <button
                onClick={handleOpen}
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
                title="What's New"
            >
                <Sparkles size={20} />
                {hasNew && (
                    <span style={{
                        position: 'absolute',
                        top: '3px',
                        right: '3px',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#0d99ff',
                    }} />
                )}
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '380px',
                    maxHeight: '520px',
                    background: 'var(--modal-bg, #252526)',
                    border: '1px solid var(--border, #333)',
                    borderRadius: '10px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                    zIndex: 10000,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '14px 16px',
                        borderBottom: '1px solid var(--border, #333)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Sparkles size={16} style={{ color: '#0d99ff' }} />
                            <span style={{ fontWeight: 600, color: 'var(--text-main, #fff)', fontSize: '0.9rem' }}>What's New</span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-muted, #aaa)',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '4px',
                                display: 'flex',
                            }}
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Content */}
                    <div style={{
                        overflowY: 'auto',
                        flex: 1,
                        padding: '8px 0',
                    }}>
                        {changelog.map((release, i) => (
                            <div key={release.version} style={{ padding: '12px 16px' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: '10px',
                                }}>
                                    <span style={{
                                        fontSize: '0.85rem',
                                        fontWeight: 700,
                                        color: 'var(--text-main, #fff)',
                                    }}>
                                        v{release.version}
                                    </span>
                                    <span style={{
                                        fontSize: '0.7rem',
                                        color: 'var(--text-muted, #888)',
                                        background: 'rgba(255,255,255,0.06)',
                                        padding: '2px 8px',
                                        borderRadius: '99px',
                                    }}>
                                        {release.date}
                                    </span>
                                    {i === 0 && (
                                        <span style={{
                                            fontSize: '0.65rem',
                                            fontWeight: 600,
                                            color: '#0d99ff',
                                            background: 'rgba(13, 153, 255, 0.12)',
                                            padding: '2px 8px',
                                            borderRadius: '99px',
                                        }}>
                                            LATEST
                                        </span>
                                    )}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {release.entries.map((entry, j) => {
                                        const cfg = typeConfig[entry.type] || typeConfig.feature;
                                        const Icon = cfg.icon;
                                        return (
                                            <div key={j} style={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: '8px',
                                                fontSize: '0.8rem',
                                                color: 'var(--text-main, #ddd)',
                                                lineHeight: 1.45,
                                            }}>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    fontSize: '0.6rem',
                                                    fontWeight: 600,
                                                    color: cfg.color,
                                                    background: `${cfg.color}18`,
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    flexShrink: 0,
                                                    marginTop: '1px',
                                                }}>
                                                    <Icon size={10} />
                                                    {cfg.label}
                                                </span>
                                                <span>{entry.text}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {i < changelog.length - 1 && (
                                    <div style={{
                                        borderBottom: '1px solid var(--border, #333)',
                                        marginTop: '14px',
                                    }} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default WhatsNew;
