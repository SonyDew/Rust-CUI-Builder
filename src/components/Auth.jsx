import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { BRAND_ASSETS } from '../utils/brandAssets';
import ConfirmModal from './ConfirmModal';
import LegalModal from './LegalModal';
import { Lock, Mail, ArrowRight, Loader2, Code, Layers, Zap, RefreshCw, ShieldCheck, Unlock, Check, FileText } from 'lucide-react';
import { isLocalMode } from '../supabaseClient';
import './Auth.css';

const Auth = () => {
    const { showModal, hideModal } = useModal();
    const [searchParams] = useSearchParams();
    const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'signup');
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [captchaInput, setCaptchaInput] = useState('');
    const [generatedCaptcha, setGeneratedCaptcha] = useState('');
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [showLegalModal, setShowLegalModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { user, signIn, signUp, signInWithOAuth, resetPasswordForEmail } = useAuth();
    const navigate = useNavigate();
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!isLogin) {
            generateCaptcha();
        }
    }, [isLogin]);

    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const generateCaptcha = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setGeneratedCaptcha(result);
        drawCaptcha(result);
    };

    const drawCaptcha = (text) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#2a2a2b');
        gradient.addColorStop(1, '#1a1a1b');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < 15; i++) {
            ctx.strokeStyle = `rgba(255,255,255,${Math.random() * 0.15})`;
            ctx.lineWidth = Math.random() * 2;
            ctx.beginPath();
            ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.stroke();
        }

        for (let i = 0; i < 30; i++) {
            ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.2})`;
            ctx.beginPath();
            ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 2, 0, 2 * Math.PI);
            ctx.fill();
        }

        ctx.font = 'bold 24px monospace';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';

        const startX = 20;
        const spacing = (canvas.width - 40) / text.length;

        for (let i = 0; i < text.length; i++) {
            ctx.save();
            const x = startX + (i * spacing) + (Math.random() * 5 - 2.5);
            const y = canvas.height / 2 + (Math.random() * 5 - 2.5);

            ctx.translate(x, y);
            ctx.rotate((Math.random() - 0.5) * 0.6);

            ctx.fillStyle = '#0d99ff';
            ctx.fillText(text[i], 0, 0);
            ctx.restore();
        }

        for (let i = 0; i < 5; i++) {
            ctx.strokeStyle = `rgba(13, 153, 255, ${Math.random() * 0.3})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.stroke();
        }
    };

    const checkPasswordStrength = (pass) => {
        let score = 0;
        if (pass.length > 6) score++;
        if (pass.length > 10) score++;
        if (/[A-Z]/.test(pass)) score++;
        if (/[0-9]/.test(pass)) score++;
        if (/[^A-Za-z0-9]/.test(pass)) score++;
        if (score > 4) score = 4;
        setPasswordStrength(score);
    };

    const handlePasswordChange = (e) => {
        const val = e.target.value;
        setPassword(val);
        checkPasswordStrength(val);
    };

    const handleGoogleLogin = async () => {
        try {
            const { error } = await signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
        } catch (error) {
            setError(error.message);
        }
    };

    const handleDiscordLogin = async () => {
        try {
            const { error } = await signInWithOAuth({
                provider: 'discord',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
        } catch (error) {
            setError(error.message);
        }
    };

    const handleForgotPasswordSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { error } = await resetPasswordForEmail(email);
            if (error) throw error;
            showModal(<ConfirmModal title="Email Sent" message="Check your email for the password reset link." onConfirm={() => { setIsForgotPassword(false); setIsLogin(true); hideModal(); }} confirmText="OK" cancelText="" />);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const checkDisposableEmail = async (email) => {
        try {
            const response = await fetch(`https://open.kickbox.com/v1/disposable/${email}`);
            const data = await response.json();
            return data.disposable;
        } catch (error) {
            console.warn("Failed to check disposable email:", error);
            return false;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!isLogin && !agreedToTerms) {
            setError("You must agree to the Terms of Service to create an account.");
            return;
        }

        setLoading(true);

        try {
            if (isLogin) {
                const { error } = await signIn({ email, password });
                if (error) throw error;
                navigate('/dashboard');
            } else {
                if (captchaInput.toUpperCase() !== generatedCaptcha) throw new Error("Invalid Captcha");

                const isDisposable = await checkDisposableEmail(email);
                if (isDisposable) throw new Error("Disposable email addresses are not allowed. Please use a permanent email address.");

                if (password !== confirmPassword) throw new Error("Passwords do not match");

                const { data, error } = await signUp({ email, password });
                if (error) throw error;

                if (data.session) {
                    navigate('/dashboard');
                } else {
                    showModal(<ConfirmModal title="Success" message="Account created! Please check your email to verify your account." onConfirm={hideModal} confirmText="OK" cancelText="" />);
                    setIsLogin(true);
                }
            }
        } catch (err) {
            setError(err.message);
            if (!isLogin) generateCaptcha();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-showcase" style={{
                backgroundImage: `url(${BRAND_ASSETS.loginBackground})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}>
                <div className="showcase-content">
                    <div className="brand-logo">
                        <img src={BRAND_ASSETS.logo} alt="Rust CUI Builder Logo" style={{ width: '64px', height: '64px' }} />
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
                <div className="auth-card" key={`${isLogin}-${isForgotPassword}`}>
                    <div className="auth-header">
                        <h2>{isForgotPassword ? 'Reset Password' : (isLogin ? 'Welcome Back' : 'Create Account')}</h2>
                        <p>
                            {isForgotPassword ? 'Enter your email to receive a reset link' : (isLogin ? 'Enter your credentials to access your projects' : 'Sign up to start building Rust CUIs')}
                        </p>
                    </div>

                    {!isForgotPassword && (
                        <>
                        <div className="social-login-group">
                            <button type="button" className="google-btn" onClick={handleGoogleLogin}>
                                <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Google
                            </button>

                            <button type="button" className="google-btn discord-btn" onClick={handleDiscordLogin}>
                                <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z"/>
                                </svg>
                                Discord
                            </button>
                        </div>

                            <div className="auth-divider">
                                <span>OR</span>
                            </div>
                        </>
                    )}

                    {isLocalMode && (
                        <div style={{
                            marginBottom: '16px',
                            padding: '12px 14px',
                            borderRadius: '12px',
                            border: '1px solid rgba(13, 153, 255, 0.25)',
                            background: 'rgba(13, 153, 255, 0.08)',
                            color: '#d7ecff',
                            fontSize: '0.88rem',
                            lineHeight: 1.45,
                        }}>
                            Local mode is active. Accounts, projects, notifications, and support data stay in this browser until a real Supabase backend is configured.
                        </div>
                    )}

                    {error && <div className="auth-error">{error}</div>}

                    <form onSubmit={isForgotPassword ? handleForgotPasswordSubmit : handleSubmit} className="auth-form">

                        <div className="form-group">
                            <label>Email</label>
                            <div className="input-wrapper">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    required
                                />
                                <Mail size={18} />
                            </div>
                        </div>

                        {!isForgotPassword && (
                            <>
                                <div className="form-group">
                                    <label>Password</label>
                                    <div className="input-wrapper">
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={handlePasswordChange}
                                            placeholder="••••••••"
                                            required
                                        />
                                        <Lock size={18} />
                                    </div>
                                    {!isLogin && password && (
                                        <div className="password-strength-container">
                                            <div className="strength-segments">
                                                {[0, 1, 2, 3].map((level) => (
                                                    <div
                                                        key={level}
                                                        className={`strength-segment ${passwordStrength > level ? 'filled' : ''} strength-${passwordStrength}`}
                                                    ></div>
                                                ))}
                                            </div>
                                            <div className={`strength-label strength-text-${passwordStrength}`}>
                                                {passwordStrength >= 4 ? <Lock size={14} /> : <Unlock size={14} />}
                                                <span>{['Weak', 'Fair', 'Good', 'Strong', 'Excellent'][passwordStrength]}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {isLogin && (
                                    <div style={{ textAlign: 'right', marginTop: '-10px', marginBottom: '15px' }}>
                                        <span
                                            onClick={() => setIsForgotPassword(true)}
                                            style={{ color: '#0d99ff', fontSize: '12px', cursor: 'pointer' }}
                                        >
                                            Forgot Password?
                                        </span>
                                    </div>
                                )}
                            </>
                        )}

                        {!isLogin && (
                            <div className="form-group">
                                <label>Confirm Password</label>
                                <div className="input-wrapper">
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                    />
                                    <Lock size={18} />
                                </div>
                            </div>
                        )}

                        {!isLogin && !isForgotPassword && (
                            <div className="form-group">
                                <label>Security Check</label>
                                <div className="captcha-container">
                                    <canvas ref={canvasRef} width="120" height="40" className="captcha-canvas"></canvas>
                                    <button type="button" onClick={generateCaptcha} className="refresh-captcha" title="Refresh Captcha">
                                        <RefreshCw size={16} />
                                    </button>
                                    <div className="input-wrapper" style={{ flex: 1 }}>
                                        <input
                                            type="text"
                                            value={captchaInput}
                                            onChange={(e) => setCaptchaInput(e.target.value)}
                                            placeholder="ENTER CODE"
                                            required
                                            style={{ textTransform: 'uppercase', paddingRight: '10px', paddingLeft: '44px' }}
                                        />
                                        <ShieldCheck size={18} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {!isLogin && !isForgotPassword && (
                            <div className="terms-checkbox-container" style={{display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '10px', marginBottom: '20px'}}>
                                <input
                                    type="checkbox"
                                    id="terms-check"
                                    checked={agreedToTerms}
                                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                                    required
                                    style={{marginTop: '4px', cursor: 'pointer', width: 'auto'}}
                                />
                                <label htmlFor="terms-check" style={{fontSize: '0.85rem', color: '#ccc', cursor: 'pointer', lineHeight: '1.4'}}>
                                    I agree to the strict <button type="button" style={{color: '#0d99ff', textDecoration: 'underline', background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit'}} onClick={(e) => {e.preventDefault(); setShowLegalModal(true)}}>Terms of Service and License Agreement</button>. I acknowledge this is proprietary software.
                                </label>
                            </div>
                        )}

                        <button type="submit" className="auth-submit" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" /> : (isForgotPassword ? 'Send Reset Link' : (isLogin ? 'Sign In' : 'Create Account'))}
                            {!loading && <ArrowRight size={18} />}
                        </button>
                    </form>

                    <div className="auth-footer">
                        {isForgotPassword ? (
                            <button className="link-btn" onClick={() => { setIsForgotPassword(false); setIsLogin(true); }}>
                                Back to Sign In
                            </button>
                        ) : (
                            <>
                                {isLogin ? "Don't have an account? " : "Already have an account? "}
                                <button className="link-btn" onClick={() => { setIsLogin(!isLogin); }}>
                                    {isLogin ? 'Sign Up' : 'Sign In'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
            {showLegalModal && <LegalModal onClose={() => setShowLegalModal(false)} />}
        </div>
    );
};

export default Auth;
