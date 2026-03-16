import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Lock, Shield } from 'lucide-react';
import './RecoveredRoutes.css';

const sections = {
    terms: {
        title: 'Terms of Service',
        icon: FileText,
        body: (
            <>
                <p>Rust CUI Builder is intended for designing Rust UI workflows, exporting project data, and managing collaboration around those projects.</p>
                <h3>Acceptable use</h3>
                <p>Use the platform to create, review, and share project interfaces. Do not abuse collaboration or billing systems, and do not attempt to impersonate other users.</p>
                <h3>Intellectual property</h3>
                <p>The recovered product metadata and UI language identify the product as proprietary. Generated project output belongs to its creator, while the platform implementation remains owned by its author.</p>
                <h3>Service caveat</h3>
                <p>This repository is a recovery build from an archive. Until the backend and missing source parts are fully restored, some cloud features may be limited or unavailable.</p>
            </>
        )
    },
    privacy: {
        title: 'Privacy Policy',
        icon: Shield,
        body: (
            <>
                <p>The client stores theme and a small amount of local editor state in the browser. When configured, Supabase is used for authentication, project storage, notifications, and collaboration data.</p>
                <h3>What is stored locally</h3>
                <p>Theme preference, editor queue data for offline saves, and temporary auth/session values in the browser.</p>
                <h3>What is stored remotely</h3>
                <p>Projects, user profiles, notifications, support tickets, and plan-related metadata when cloud services are enabled.</p>
                <h3>Recovery build note</h3>
                <p>This project now includes local visual fallbacks so the app can still render even when cloud branding or backend endpoints are missing.</p>
            </>
        )
    },
    license: {
        title: 'License',
        icon: Lock,
        body: (
            <>
                <p>This repository currently ships with a proprietary license file at the project root. That choice follows the ownership language found inside the recovered application snapshot.</p>
                <h3>Repository license</h3>
                <p>The root <code>LICENSE</code> defines current repository terms. If ownership or publication strategy changes, update that file before wider distribution.</p>
                <h3>Third-party software</h3>
                <p>Dependencies such as React, Vite, Supabase, and Lucide remain governed by their own licenses.</p>
            </>
        )
    }
};

const LegalPage = () => {
    const navigate = useNavigate();
    const { type = 'terms' } = useParams();
    const activeKey = sections[type] ? type : 'terms';
    const active = sections[activeKey];

    return (
        <div className="legal-page-shell">
            <div className="legal-page-card">
                <div className="legal-page-nav">
                    <button className="glass-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={16} />
                        Back
                    </button>
                    {Object.entries(sections).map(([key, section]) => {
                        const Icon = section.icon;
                        return (
                            <button
                                key={key}
                                className={key === activeKey ? 'active' : ''}
                                onClick={() => navigate(`/legal/${key}`)}
                            >
                                <Icon size={16} />
                                {section.title}
                            </button>
                        );
                    })}
                </div>
                <div className="legal-page-main">
                    <div className="legal-page-head">
                        <div>
                            <h1 style={{ margin: 0 }}>{active.title}</h1>
                            <p className="legal-page-subtitle">Recovered project policy page for the rebuilt application shell.</p>
                        </div>
                    </div>
                    <div className="legal-page-body">{active.body}</div>
                </div>
            </div>
        </div>
    );
};

export default LegalPage;
