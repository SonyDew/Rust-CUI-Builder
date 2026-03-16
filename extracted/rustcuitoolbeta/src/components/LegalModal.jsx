import React, { useState } from 'react';
import { X, Shield, FileText, Lock, AlertTriangle } from 'lucide-react';
import './LegalModal.css';

const LegalModal = ({ onClose, initialTab = 'tos' }) => {
    const [activeTab, setActiveTab] = useState(initialTab);

    const renderContent = () => {
        switch (activeTab) {
            case 'tos':
                return (
                    <div className="legal-text">
                        <h3>Terms of Service</h3>
                        <div className="warning-box">
                            <AlertTriangle size={20} style={{ float: 'left', marginRight: '10px' }} />
                            <strong>STRICTLY ENFORCED:</strong> Any attempt to clone, reverse engineer, or steal features from this software will result in immediate termination and legal action.
                        </div>

                        <h4>1. Acceptance of Terms</h4>
                        <p>By using Rust CUI Builder, you agree to these strict Terms. If you do not agree, strictly do not use this Service.</p>

                        <h4>2. Intellectual Property Rights</h4>
                        <p>All source code, UI designs, UX flows, and features are the exclusive property of Rust CUI Builder.</p>
                        <p><strong>YOU MAY NOT:</strong></p>
                        <ul>
                            <li>Copy the specific look and feel of the interface.</li>
                            <li>Redistribute the code generated for checking or competing purposes.</li>
                            <li>Use any automated tools to scrape or clone the Service.</li>
                            <li>Reverse engineer the WebAssembly or JavaScript bundles.</li>
                        </ul>

                        <h4>3. User Conduct</h4>
                        <p>You agree to use this tool solely for its intended purpose of building interfaces. Using this tool to analyze its own construction for replication is strictly prohibited.</p>
                    </div>
                );
            case 'privacy':
                return (
                    <div className="legal-text">
                        <h3>Privacy Policy</h3>
                        <p>We take your privacy—and our intellectual property—seriously.</p>

                        <h4>Data Usage</h4>
                        <p>We collect minimal usage data to ensure system stability and to strictly monitor for suspicious activity, such as cloning bots or unauthorized scraping.</p>

                        <h4>Project Security</h4>
                        <p>Your projects are private. However, the <em>structure</em> of your projects must not be used to reverse-engineer our builder logic.</p>
                    </div>
                );
            case 'license':
                return (
                    <div className="legal-text">
                        <h3>Proprietary License</h3>
                        <p><strong>Copyright (c) 2026 Rust CUI Builder.</strong></p>
                        <p><strong>Status: PROPRIETARY & CONFIDENTIAL</strong></p>

                        <p>This is NOT open source software. It is a closed-source, proprietary tool.</p>

                        <h4>Grant of License</h4>
                        <p>You are granted a revocable, non-exclusive, non-transferable license to use the portions of the software expressly made available to you via the web interface.</p>

                        <h4>No Right to Source</h4>
                        <p>You have no right to view, modify, or distribute the source code of this application.</p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="modal-overlay">
            <div className="legal-modal">
                <div className="legal-header">
                    <h2>Legal & Agreements</h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>
                <div className="legal-body">
                    <div className="legal-sidebar">
                        <button
                            className={activeTab === 'tos' ? 'active' : ''}
                            onClick={() => setActiveTab('tos')}
                        >
                            <FileText size={18} /> Terms of Service
                        </button>
                        <button
                            className={activeTab === 'privacy' ? 'active' : ''}
                            onClick={() => setActiveTab('privacy')}
                        >
                            <Shield size={18} /> Privacy Policy
                        </button>
                        <button
                            className={activeTab === 'license' ? 'active' : ''}
                            onClick={() => setActiveTab('license')}
                        >
                            <Lock size={18} /> License
                        </button>
                    </div>
                    <div className="legal-content">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LegalModal;
