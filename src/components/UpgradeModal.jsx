import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Zap } from 'lucide-react';

const UpgradeModal = ({ onClose, feature, currentPlan = 'free' }) => {
    const navigate = useNavigate();

    const messages = {
        projects: {
            title: 'Project Limit Reached',
            desc: 'Free plan allows up to 3 projects. Upgrade to Solo for unlimited projects.',
            icon: Zap,
        },
        drafts: {
            title: 'Draft Limit Reached',
            desc: 'Free plan allows up to 20 drafts. Upgrade to Solo for unlimited drafts.',
            icon: Zap,
        },
        elements: {
            title: 'Element Limit Reached',
            desc: 'Free plan allows up to 50 elements per project. Upgrade for unlimited elements.',
            icon: Zap,
        },
        assets: {
            title: 'Custom Assets Unavailable',
            desc: 'Custom asset uploads are available on Solo and Team plans.',
            icon: Crown,
        },
        snippets: {
            title: 'Snippet Library Locked',
            desc: 'The snippet library is available on Solo and Team plans.',
            icon: Crown,
        },
        collaboration: {
            title: 'Team Collaboration Locked',
            desc: 'Real-time collaboration is available on the Team plan.',
            icon: Crown,
        },
        templates: {
            title: 'Premium Templates',
            desc: 'All templates are available on Solo and Team plans.',
            icon: Crown,
        },
        default: {
            title: 'Upgrade Your Plan',
            desc: 'Unlock more features and remove limits by upgrading.',
            icon: Crown,
        },
    };

    const msg = messages[feature] || messages.default;
    const Icon = msg.icon;

    return (
        <div className="confirm-modal" style={{ width: '400px', textAlign: 'center' }}>
            <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(13,153,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
            }}>
                <Icon size={24} color="#0d99ff" />
            </div>

            <h3>{msg.title}</h3>
            <p>{msg.desc}</p>

            <div className="confirm-actions" style={{ justifyContent: 'center' }}>
                <button className="btn" onClick={onClose}>Maybe Later</button>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        onClose();
                        navigate('/plans');
                    }}
                >
                    View Plans
                </button>
            </div>
        </div>
    );
};

export default UpgradeModal;
