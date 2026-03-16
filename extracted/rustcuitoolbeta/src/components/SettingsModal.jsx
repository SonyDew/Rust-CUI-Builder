import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { X, User, Shield, Key, Scale, Sun, Moon, Palette } from 'lucide-react';
import LegalModal from './LegalModal';
import './SettingsModal.css';

const SettingsModal = ({ onClose }) => {
    const { user, updateUser } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [fullName, setFullName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showLegalModal, setShowLegalModal] = useState(false);

    useEffect(() => {
        if (user) {
            setFullName(user.user_metadata?.full_name || user.user_metadata?.name || '');
            setAvatarUrl(user.user_metadata?.avatar_url || '');
        }
    }, [user]);

    const handleUpdateProfile = async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const { error } = await updateUser({
                data: {
                    full_name: fullName,
                    avatar_url: avatarUrl
                }
            });

            if (error) throw error;
            setMessage({ type: 'success', text: 'Profile updated successfully' });
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        if (password.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const { error } = await updateUser({ password: password });
            if (error) throw error;
            setMessage({ type: 'success', text: 'Password updated successfully' });
            setPassword('');
            setConfirmPassword('');
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="settings-header">
                <h2>Settings</h2>
                <button className="close-btn" onClick={onClose}><X size={20} /></button>
            </div>

            <div className="settings-body">
                <div className="settings-sidebar">
                    <div
                        className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        <User size={18} /> Profile
                    </div>
                    <div
                        className={`settings-tab ${activeTab === 'appearance' ? 'active' : ''}`}
                        onClick={() => setActiveTab('appearance')}
                    >
                        <Palette size={18} /> Appearance
                    </div>
                    <div
                        className={`settings-tab ${activeTab === 'account' ? 'active' : ''}`}
                        onClick={() => setActiveTab('account')}
                    >
                        <Shield size={18} /> Account
                    </div>
                    <div
                        className={`settings-tab ${activeTab === 'legal' ? 'active' : ''}`}
                        onClick={() => setActiveTab('legal')}
                    >
                        <Scale size={18} /> Legal
                    </div>
                </div>

                <div className="settings-content">
                    {message.text && (
                        <div style={{
                            padding: '10px',
                            marginBottom: '20px',
                            borderRadius: '4px',
                            backgroundColor: message.type === 'error' ? 'rgba(255, 77, 77, 0.1)' : 'rgba(77, 255, 148, 0.1)',
                            color: message.type === 'error' ? '#ff4d4d' : '#00cc66',
                            border: `1px solid ${message.type === 'error' ? '#ff4d4d' : '#00cc66'}`
                        }}>
                            {message.text}
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="settings-section">
                            <h3>Profile Settings</h3>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                                <img
                                    src={avatarUrl || 'https://via.placeholder.com/150'}
                                    alt="Avatar"
                                    className="avatar-preview"
                                    onError={(e) => e.target.src = 'https://via.placeholder.com/150'}
                                />
                                <div style={{ flex: 1 }}>
                                    <div className="form-group">
                                        <label>Avatar URL</label>
                                        <input
                                            type="text"
                                            value={avatarUrl}
                                            onChange={(e) => setAvatarUrl(e.target.value)}
                                            placeholder="https://example.com/avatar.png"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Display Name</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Your Name"
                                />
                            </div>

                            <div className="settings-footer" style={{ padding: 0, marginTop: '30px', background: 'transparent', border: 'none' }}>
                                <button className="btn btn-primary" onClick={handleUpdateProfile} disabled={loading}>
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'appearance' && (
                        <div className="settings-section">
                            <h3>Appearance</h3>

                            <div className="form-group">
                                <label>Theme</label>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        onClick={() => { if (theme !== 'dark') toggleTheme(); }}
                                        style={{
                                            flex: 1,
                                            padding: '14px',
                                            borderRadius: '8px',
                                            border: theme === 'dark' ? '2px solid #0d99ff' : '1px solid #444',
                                            background: theme === 'dark' ? 'rgba(13, 153, 255, 0.1)' : '#1e1e1e',
                                            color: '#fff',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '8px',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        <Moon size={24} color={theme === 'dark' ? '#0d99ff' : '#888'} />
                                        <span style={{ fontSize: '0.85rem', fontWeight: theme === 'dark' ? 600 : 400 }}>Dark</span>
                                    </button>
                                    <button
                                        onClick={() => { if (theme !== 'light') toggleTheme(); }}
                                        style={{
                                            flex: 1,
                                            padding: '14px',
                                            borderRadius: '8px',
                                            border: theme === 'light' ? '2px solid #0d99ff' : '1px solid #444',
                                            background: theme === 'light' ? 'rgba(13, 153, 255, 0.1)' : '#1e1e1e',
                                            color: '#fff',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '8px',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        <Sun size={24} color={theme === 'light' ? '#0d99ff' : '#888'} />
                                        <span style={{ fontSize: '0.85rem', fontWeight: theme === 'light' ? 600 : 400 }}>Light</span>
                                    </button>
                                </div>
                            </div>

                            <p style={{ color: '#666', fontSize: '0.8rem', marginTop: '16px' }}>
                                Theme preference is saved locally and applies immediately.
                            </p>
                        </div>
                    )}

                    {activeTab === 'account' && (
                        <div className="settings-section">
                            <h3>Account Security</h3>

                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="text"
                                    value={user?.email || ''}
                                    disabled
                                    style={{ opacity: 0.5, cursor: 'not-allowed' }}
                                />
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                                    Email cannot be changed via settings yet.
                                </div>
                            </div>

                            <div style={{ height: '1px', background: '#333', margin: '30px 0' }}></div>

                            <h3>Change Password</h3>
                            <div className="form-group">
                                <label>New Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                    />
                                    <Key size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Confirm New Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="settings-footer" style={{ padding: 0, marginTop: '30px', background: 'transparent', border: 'none' }}>
                                <button className="btn btn-primary" onClick={handleUpdatePassword} disabled={loading}>
                                    {loading ? 'Update Password' : 'Update Password'}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'legal' && (
                        <div className="settings-section">
                            <h3>Legal & Compliance</h3>
                            <p style={{ color: '#aaa', marginBottom: '20px' }}>
                                Review our Terms of Service, Privacy Policy, and License Agreement.
                                Strict adherence to these terms is required for use of this software.
                            </p>

                            <div className="form-group">
                                <label>Agreement Status</label>
                                <div style={{
                                    padding: '10px',
                                    background: 'rgba(77, 255, 148, 0.1)',
                                    border: '1px solid #00cc66',
                                    color: '#00cc66',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}>
                                    <Shield size={16} /> Active & Enforced
                                </div>
                            </div>

                            <div className="settings-footer" style={{ padding: 0, marginTop: '30px', background: 'transparent', border: 'none' }}>
                                <button className="btn btn-primary" onClick={() => setShowLegalModal(true)}>
                                    View Full Legal Documents
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {showLegalModal && <LegalModal onClose={() => setShowLegalModal(false)} />}
        </div>
    );
};

export default SettingsModal;
