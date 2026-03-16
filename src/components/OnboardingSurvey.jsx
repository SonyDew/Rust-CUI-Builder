import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import GlassInput from './GlassInput';
import GlassDropdown from './GlassDropdown';
import {
    Sparkles,
    Users,
    Briefcase,
    Target,
    Zap,
    ArrowRight,
    ArrowLeft,
    Check,
    Rocket
} from 'lucide-react';
import './Auth.css';

const OnboardingSurvey = ({ onComplete }) => {
    const { user } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        primaryUse: '',
        experience: '',
        projectType: '',
        teamSize: '',
        goals: []
    });

    const steps = [
        {
            id: 1,
            title: 'Welcome to Rust CUI Builder!',
            subtitle: 'Let\'s personalize your experience in just 5 quick steps',
            icon: Sparkles
        },
        {
            id: 2,
            title: 'What will you build?',
            subtitle: 'Tell us what Rust plugins or UIs you\'re creating',
            icon: Target
        },
        {
            id: 3,
            title: 'Your Rust Experience',
            subtitle: 'How familiar are you with Rust development?',
            icon: Zap
        },
        {
            id: 4,
            title: 'UI Type',
            subtitle: 'What kind of interfaces do you need to create?',
            icon: Briefcase
        },
        {
            id: 5,
            title: 'Almost Done!',
            subtitle: 'Tell us about your team and goals',
            icon: Rocket
        }
    ];

    const primaryUseOptions = [
        { label: '� Game Server Plugins', value: 'game_plugins' },
        { label: '🔧 Admin Tools & Panels', value: 'admin_tools' },
        { label: '🏪 Shop & Economy Systems', value: 'economy' },
        { label: '👥 Player Management UIs', value: 'player_management' },
        { label: '📊 Server Monitoring', value: 'monitoring' },
        { label: '🎯 Custom Rust Mods', value: 'custom_mods' }
    ];

    const experienceOptions = [
        { label: '🌱 New to Rust Plugins', value: 'beginner' },
        { label: '📚 Basic Rust Knowledge', value: 'intermediate' },
        { label: '⚡ Experienced Rust Dev', value: 'advanced' },
        { label: '🎯 Rust Plugin Expert', value: 'expert' }
    ];

    const projectTypeOptions = [
        { label: '🎮 In-Game HUDs', value: 'game_hud' },
        { label: '📋 Admin Panels', value: 'admin_panel' },
        { label: '💬 Chat & Notifications', value: 'chat_ui' },
        { label: '🏪 Shop Interfaces', value: 'shop_ui' },
        { label: '📊 Stats & Leaderboards', value: 'stats' },
        { label: '⚙️ Settings & Config', value: 'settings' },
        { label: '🎯 Multiple Types', value: 'mixed' }
    ];

    const teamSizeOptions = [
        { label: '👤 Solo Developer', value: 'solo' },
        { label: '👥 Small Team (2-5)', value: 'small' },
        { label: '🏢 Medium Team (6-20)', value: 'medium' },
        { label: '🏭 Large Team (20+)', value: 'large' }
    ];

    const goalOptions = [
        { id: 'quick', label: 'Build Plugin UIs Fast', icon: '⚡' },
        { id: 'learn', label: 'Learn Rust UI', icon: '📚' },
        { id: 'collaborate', label: 'Team Development', icon: '👥' },
        { id: 'prototype', label: 'Test UI Designs', icon: '🚀' },
        { id: 'production', label: 'Production Servers', icon: '💎' },
        { id: 'explore', label: 'Explore Features', icon: '🔍' }
    ];

    const handleNext = () => {
        if (currentStep < 5) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const toggleGoal = (goalId) => {
        setFormData(prev => ({
            ...prev,
            goals: prev.goals.includes(goalId)
                ? prev.goals.filter(g => g !== goalId)
                : [...prev.goals, goalId]
        }));
    };

    const handleComplete = async () => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('user_profiles')
                .upsert({
                    user_id: user.id,
                    primary_use: formData.primaryUse,
                    experience_level: formData.experience,
                    project_type: formData.projectType,
                    team_size: formData.teamSize,
                    goals: formData.goals,
                    onboarding_completed: true,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            if (error) throw error;

            onComplete();
        } catch (error) {
            console.error('Error saving onboarding data:', error);
            onComplete();
        } finally {
            setLoading(false);
        }
    };

    const isStepValid = () => {
        switch (currentStep) {
            case 1:
                return true;
            case 2:
                return formData.primaryUse !== '';
            case 3:
                return formData.experience !== '';
            case 4:
                return formData.projectType !== '';
            case 5:
                return formData.teamSize !== '' && formData.goals.length > 0;
            default:
                return false;
        }
    };

    const currentStepData = steps[currentStep - 1];
    const StepIcon = currentStepData.icon;

    return (
        <div className="auth-container" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10000,
            background: '#1e1e1e'
        }}>
            <div className="auth-showcase">
                <div className="showcase-bg"></div>
                <div className="showcase-content">
                    <div className="brand-logo">
                        <div className="logo-icon">
                            <StepIcon size={32} />
                        </div>
                        <h1>Step {currentStep} of 5</h1>
                    </div>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '20px', fontWeight: '700' }}>
                        {currentStepData.title}
                    </h2>
                    <p style={{ fontSize: '1.1rem', opacity: 0.9, marginBottom: '40px' }}>
                        {currentStepData.subtitle}
                    </p>

                    <div style={{
                        width: '100%',
                        height: '4px',
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: '2px',
                        overflow: 'hidden',
                        marginTop: '40px'
                    }}>
                        <div style={{
                            width: `${(currentStep / 5) * 100}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #0d99ff, #00ff88)',
                            transition: 'width 0.3s ease'
                        }}></div>
                    </div>
                </div>
            </div>

            <div className="auth-form-section">
                <div className="auth-form-container" style={{
                    maxWidth: '500px',
                    width: '100%',
                    padding: '40px'
                }}>
                    <div style={{ marginBottom: '40px' }}>
                        <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '12px',
                            background: 'rgba(13, 153, 255, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '20px'
                        }}>
                            <StepIcon size={32} color="#0d99ff" />
                        </div>
                        <h2 style={{ fontSize: '1.8rem', marginBottom: '8px', margin: 0 }}>
                            {currentStepData.title}
                        </h2>
                        <p style={{ color: '#999', fontSize: '0.95rem', margin: '8px 0 0 0' }}>
                            {currentStepData.subtitle}
                        </p>
                    </div>

                    <div style={{ marginBottom: '40px', minHeight: '200px' }}>
                        {currentStep === 1 && (
                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                <div style={{
                                    fontSize: '4rem',
                                    marginBottom: '20px'
                                }}>👋</div>
                                <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#ccc', margin: 0 }}>
                                    We're excited to have you here! This quick survey will help us customize
                                    your experience and show you the features that matter most to you.
                                </p>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '12px',
                                    fontSize: '0.9rem',
                                    color: '#999'
                                }}>
                                    Select your primary use case
                                </label>
                                <GlassDropdown
                                    options={primaryUseOptions}
                                    value={formData.primaryUse}
                                    onChange={(value) => setFormData({ ...formData, primaryUse: value })}
                                    placeholder="Choose what best describes you..."
                                />
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontSize: '0.9rem',
                                    color: '#999'
                                }}>
                                    What's your experience with Rust and UI development?
                                </label>
                                <GlassDropdown
                                    options={experienceOptions}
                                    value={formData.experience}
                                    onChange={(value) => setFormData({ ...formData, experience: value })}
                                    placeholder="Select your experience level..."
                                />
                                <p style={{
                                    marginTop: '12px',
                                    fontSize: '0.85rem',
                                    color: '#888',
                                    fontStyle: 'italic'
                                }}>
                                    Don't worry! We have resources for all skill levels.
                                </p>
                            </div>
                        )}

                        {currentStep === 4 && (
                            <div>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontSize: '0.9rem',
                                    color: '#999'
                                }}>
                                    What type of projects will you focus on?
                                </label>
                                <GlassDropdown
                                    options={projectTypeOptions}
                                    value={formData.projectType}
                                    onChange={(value) => setFormData({ ...formData, projectType: value })}
                                    placeholder="Choose your project type..."
                                />
                            </div>
                        )}

                        {currentStep === 5 && (
                            <div>
                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontSize: '0.9rem',
                                        color: '#999'
                                    }}>
                                        How large is your team?
                                    </label>
                                    <GlassDropdown
                                        options={teamSizeOptions}
                                        value={formData.teamSize}
                                        onChange={(value) => setFormData({ ...formData, teamSize: value })}
                                        placeholder="Select team size..."
                                    />
                                </div>

                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '12px',
                                        fontSize: '0.9rem',
                                        color: '#999'
                                    }}>
                                        What are your goals? (Select all that apply)
                                    </label>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(2, 1fr)',
                                        gap: '12px'
                                    }}>
                                        {goalOptions.map(goal => (
                                            <div
                                                key={goal.id}
                                                onClick={() => toggleGoal(goal.id)}
                                                className="glass-control"
                                                style={{
                                                    padding: '12px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    background: formData.goals.includes(goal.id)
                                                        ? 'rgba(13, 153, 255, 0.3)'
                                                        : 'rgba(255, 255, 255, 0.05)',
                                                    border: formData.goals.includes(goal.id)
                                                        ? '1px solid rgba(13, 153, 255, 0.5)'
                                                        : '1px solid rgba(255, 255, 255, 0.1)',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <span style={{ fontSize: '1.2rem' }}>{goal.icon}</span>
                                                <span style={{ fontSize: '0.85rem', flex: 1 }}>
                                                    {goal.label}
                                                </span>
                                                {formData.goals.includes(goal.id) && (
                                                    <Check size={16} color="#0d99ff" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        marginTop: '40px'
                    }}>
                        {currentStep > 1 && (
                            <button
                                onClick={handleBack}
                                className="glass-control"
                                style={{
                                    padding: '14px 24px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    flex: '0 0 auto',
                                    fontSize: '0.95rem',
                                    fontWeight: '500'
                                }}
                            >
                                <ArrowLeft size={18} />
                                <span>Back</span>
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            disabled={!isStepValid() || loading}
                            className="glass-control"
                            style={{
                                padding: '14px 24px',
                                cursor: isStepValid() && !loading ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                background: isStepValid() && !loading
                                    ? 'linear-gradient(135deg, #0d99ff, #00ff88)'
                                    : 'rgba(255, 255, 255, 0.1)',
                                border: 'none',
                                flex: '1',
                                opacity: isStepValid() && !loading ? 1 : 0.5,
                                transition: 'all 0.2s',
                                fontSize: '0.95rem',
                                fontWeight: '600'
                            }}
                        >
                            <span>{currentStep === 5 ? 'Complete Setup' : 'Continue'}</span>
                            {currentStep === 5 ? <Rocket size={18} /> : <ArrowRight size={18} />}
                        </button>
                    </div>

                    <button
                        onClick={onComplete}
                        style={{
                            marginTop: '20px',
                            width: '100%',
                            padding: '10px',
                            background: 'none',
                            border: 'none',
                            color: '#888',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#aaa'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
                    >
                        Skip for now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OnboardingSurvey;
