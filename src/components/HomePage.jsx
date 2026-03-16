import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layers, Code, Zap, ArrowRight } from 'lucide-react';
import { isLocalMode } from '../supabaseClient';
import { BRAND_ASSETS } from '../utils/brandAssets';
import './Auth.css';

const HomePage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    return (
        <div className="auth-container">
            <div className="auth-showcase" style={{
                backgroundImage: `url(${BRAND_ASSETS.loginBackground})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}>
                <div className="showcase-content">
                    <div className="brand-logo">
                        <img src={BRAND_ASSETS.logo} alt="Rust CUI Builder" style={{ width: '64px', height: '64px' }} />
                        <h1>Rust CUI Builder</h1>
                    </div>
                    <div className="feature-list">
                        <div className="feature-item">
                            <div className="feature-icon"><Layers size={24} /></div>
                            <div className="feature-text">
                                <h3>Visual Editor</h3>
                                <p>Drag & drop interface for Rust UI components</p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon"><Code size={24} /></div>
                            <div className="feature-text">
                                <h3>Code Generation</h3>
                                <p>Auto-generate clean C# plugin code from your designs</p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon"><Zap size={24} /></div>
                            <div className="feature-text">
                                <h3>Instant Export</h3>
                                <p>Generate production-ready C# Plugin code instantly</p>
                            </div>
                        </div>
                    </div>
                    <div className="showcase-footer">
                        <p>© 2026 SonyDev. All rights reserved.</p>
                    </div>
                </div>
                <div className="showcase-bg"></div>
            </div>

            <div className="auth-form-wrapper">
                <div className="auth-card">
                    <div className="home-card-content">
                        <img src={BRAND_ASSETS.logo} alt="Rust CUI Builder" style={{ width: '64px', height: '64px', marginBottom: '24px', animation: 'scaleIn 0.5s ease-out 0.2s both' }} />
                        <h2 className="home-title">Build Rust UIs Visually</h2>
                        <p className="home-subtitle">
                            The fastest way to design and export CUI interfaces for your Rust game server plugins.
                        </p>

                        {isLocalMode && (
                            <div style={{
                                marginBottom: '18px',
                                padding: '14px 16px',
                                borderRadius: '14px',
                                border: '1px solid rgba(13, 153, 255, 0.28)',
                                background: 'rgba(13, 153, 255, 0.08)',
                                color: '#d7ecff',
                                textAlign: 'left',
                                fontSize: '0.92rem',
                                lineHeight: 1.45,
                            }}>
                                Local mode is active. You can sign up, edit projects, export files, and test support flows without configuring Supabase.
                            </div>
                        )}

                        <div className="home-features">
                            <div className="home-feature-pill"><Layers size={14} /> Drag & Drop</div>
                            <div className="home-feature-pill"><Code size={14} /> C# Export</div>
                            <div className="home-feature-pill"><Zap size={14} /> Real-time Preview</div>
                        </div>

                        <button
                            className="home-cta-btn"
                            onClick={() => navigate('/auth?mode=signup')}
                        >
                            Get Started <ArrowRight size={18} />
                        </button>

                        <button
                            className="home-secondary-btn"
                            onClick={() => navigate('/auth')}
                        >
                            Already have an account? Sign in
                        </button>

                        <button
                            className="home-plans-link"
                            onClick={() => navigate('/plans')}
                        >
                            View Plans
                        </button>

                        <div className="home-legal">
                            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/legal/terms'); }}>Terms</a>
                            <span>·</span>
                            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/legal/privacy'); }}>Privacy</a>
                            <span>·</span>
                            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/legal/license'); }}>License</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
