import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, MonitorSmartphone } from 'lucide-react';
import './SharedRouteShell.css';

const DesktopAuthCallback = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [attempted, setAttempted] = useState(false);
    const hash = typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : '';
    const tokenPreview = useMemo(() => {
        if (!hash) return 'No token payload found.';
        return hash.length > 140 ? `${hash.slice(0, 140)}...` : hash;
    }, [hash]);

    useEffect(() => {
        const shouldAutoRedirect = searchParams.get('desktop') === '1' && hash.includes('access_token=');
        if (shouldAutoRedirect && !attempted) {
            setAttempted(true);
            window.location.href = `rustcui://auth#${hash}`;
        }
    }, [attempted, hash, searchParams]);

    return (
        <div className="desktop-callback-shell">
            <div className="desktop-callback-card">
                <div className="desktop-callback-head">
                    <div>
                        <div className="share-tag" style={{ display: 'inline-flex', marginBottom: '12px' }}>
                            <MonitorSmartphone size={16} />
                            <span style={{ marginLeft: '8px' }}>Desktop callback</span>
                        </div>
                        <h1 style={{ margin: 0 }}>Rust CUI desktop handoff</h1>
                        <p className="desktop-callback-subtitle">Use this page to return OAuth tokens back to the desktop app or fall back to the browser flow.</p>
                    </div>
                </div>

                <div className="desktop-callback-token">{tokenPreview}</div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                    <button className="glass-btn primary" onClick={() => { if (hash) window.location.href = `rustcui://auth#${hash}`; }}>
                        <ExternalLink size={16} style={{ marginRight: '8px' }} />
                        Open desktop app
                    </button>
                    <button className="glass-btn" onClick={() => navigate('/auth')}>
                        <ArrowLeft size={16} style={{ marginRight: '8px' }} />
                        Back to sign in
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DesktopAuthCallback;
