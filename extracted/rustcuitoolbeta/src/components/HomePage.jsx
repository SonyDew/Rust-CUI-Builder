import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layers, Code, Zap, ArrowRight } from 'lucide-react';
import './Auth.css';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const LOGO_URL = `${SUPABASE_URL}/storage/v1/object/public/Assets/favicon.png`;
const LOGIN_BG_URL = `${SUPABASE_URL}/storage/v1/object/public/Assets/login-bg.jpg`;

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
                backgroundImage: `url(${LOGIN_BG_URL})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}>
                <div className="showcase-content">
                    <div className="brand-logo">
                        <img src={LOGO_URL} alt="Rust CUI Builder" style={{ width: '64px', height: '64px' }} />
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
                        <p>© 2026 Hex Plugins. All rights reserved.</p>
                    </div>
                </div>
                <div className="showcase-bg"></div>
            </div>

            <div className="auth-form-wrapper">
                <div className="auth-card">
                    <div className="home-card-content">
                        <img src={LOGO_URL} alt="Rust CUI Builder" style={{ width: '64px', height: '64px', marginBottom: '24px', animation: 'scaleIn 0.5s ease-out 0.2s both' }} />
                        <h2 className="home-title">Build Rust UIs Visually</h2>
                        <p className="home-subtitle">
                            The fastest way to design and export CUI interfaces for your Rust game server plugins.
                        </p>

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
