import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, Home, ArrowLeft, ShieldAlert, FileQuestion, ServerCrash, Lock } from 'lucide-react';
import { BRAND_ASSETS } from '../utils/brandAssets';
import './Auth.css';

const errorContents = {
    '400': {
        title: 'Bad Request',
        message: 'The server could not understand the request due to invalid syntax.',
        Icon: AlertTriangle
    },
    '401': {
        title: 'Unauthorized',
        message: 'You must be logged in to access this resource.',
        Icon: Lock
    },
    '403': {
        title: 'Access Denied',
        message: 'You do not have permission to access this resource.',
        Icon: ShieldAlert
    },
    '404': {
        title: 'Page Not Found',
        message: "The page you are looking for doesn't exist or has been moved.",
        image: BRAND_ASSETS.lost404
    },
    '500': {
        title: 'Server Error',
        message: 'The server encountered an internal error and was unable to complete your request.',
        Icon: ServerCrash
    },
    '503': {
        title: 'Service Unavailable',
        message: 'The server is currently unavailable. Please try again later.',
        Icon: ServerCrash
    }
};

const ErrorPage = ({
    code: propCode,
    title: propTitle,
    message: propMessage
}) => {
    const navigate = useNavigate();
    const { code: routeCode } = useParams();

    const activeCode = propCode || routeCode || '404';
    const defaults = errorContents[activeCode] || errorContents['404'];

    const title = propTitle || defaults.title;
    const message = propMessage || defaults.message;
    const DisplayIcon = defaults.Icon;
    const displayImage = defaults.image;

    return (
        <div className="auth-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
            <style>{`
                @keyframes svg-draw {
                    from { stroke-dashoffset: 100; opacity: 0; }
                    to { stroke-dashoffset: 0; opacity: 1; }
                }
                @keyframes bounce-in-down {
                    0% { opacity: 0; transform: translateY(-30px); }
                    60% { opacity: 1; transform: translateY(10px); }
                    80% { opacity: 1; transform: translateY(-5px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .error-icon-svg path,
                .error-icon-svg line,
                .error-icon-svg polyline,
                .error-icon-svg circle {
                    stroke-dasharray: 100;
                    stroke-dashoffset: 100;
                    animation: svg-draw 2s ease-out forwards;
                }
                .bounce-text {
                    opacity: 0;
                    animation: bounce-in-down 0.8s cubic-bezier(0.215, 0.610, 0.355, 1.000) forwards;
                }
            `}</style>
            <div className="auth-card" style={{ maxWidth: '500px', textAlign: 'center', width: '100%' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '2rem'
                }}>
                    <div style={{
                        position: 'relative',
                        width: '180px',
                        height: '180px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {displayImage ? (
                            <img
                                src={displayImage}
                                alt={activeCode}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    position: 'relative',
                                    zIndex: 1
                                }}
                            />
                        ) : (
                            <DisplayIcon
                                size={64}
                                color="#0d99ff"
                                className="error-icon-svg"
                                style={{ position: 'relative', zIndex: 1 }}
                            />
                        )}
                    </div>
                </div>

                <h1 className="bounce-text" style={{
                    fontSize: '4rem',
                    fontWeight: '800',
                    lineHeight: 1,
                    margin: '0 0 1rem',
                    backgroundImage: 'linear-gradient(to right, #0d99ff, #66b8ff)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    WebkitTextFillColor: 'transparent',
                    display: 'inline-block',
                    animationDelay: '0.2s'
                }}>
                    {activeCode}
                </h1>

                <h2 className="bounce-text" style={{
                    fontSize: '1.5rem',
                    marginBottom: '1rem',
                    color: '#fff',
                    animationDelay: '0.3s'
                }}>
                    {title}
                </h2>

                <p className="bounce-text" style={{
                    color: '#aaa',
                    marginBottom: '2.5rem',
                    lineHeight: 1.6,
                    animationDelay: '0.4s'
                }}>
                    {message}
                </p>

                <div className="bounce-text" style={{
                    display: 'flex',
                    gap: '1rem',
                    justifyContent: 'center',
                    animationDelay: '0.5s'
                }}>
                    <button
                        onClick={() => navigate(-1)}
                        className="glass-btn"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <ArrowLeft size={18} />
                        Go Back
                    </button>

                    <button
                        onClick={() => navigate('/dashboard')}
                        className="glass-btn primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Home size={18} />
                        Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ErrorPage;
