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
                            <strong>Open-source notice:</strong> This repository is licensed under Apache-2.0. Keep copyright, license, and NOTICE attributions intact when redistributing it.
                        </div>

                        <h4>1. Acceptance of Terms</h4>
                        <p>By using Rust CUI Builder, you agree to these Terms of Service and to comply with the repository license when using or redistributing the code.</p>

                        <h4>2. Intellectual Property Rights</h4>
                        <p>The source code is available under Apache-2.0. SonyDev remains the original publisher, and attribution notices should be preserved.</p>
                        <p><strong>YOU MAY NOT:</strong></p>
                        <ul>
                            <li>Remove copyright, license, or NOTICE attributions.</li>
                            <li>Misrepresent your fork as the official SonyDev release.</li>
                            <li>Use the platform to abuse collaboration, billing, or support features.</li>
                            <li>Use SonyDev or Rust CUI Builder branding in a misleading way.</li>
                        </ul>

                        <h4>3. User Conduct</h4>
                        <p>Use the tool lawfully and in good faith. Respect other users, configured services, and third-party license terms tied to project dependencies.</p>
                    </div>
                );
            case 'privacy':
                return (
                    <div className="legal-text">
                        <h3>Privacy Policy</h3>
                        <p>We keep the privacy model simple and tied to how the app is configured.</p>

                        <h4>Data Usage</h4>
                        <p>When backend services are configured, the app may store account, project, notification, and support data needed to operate those features. In local mode, most state stays in the browser.</p>

                        <h4>Project Security</h4>
                        <p>Your project data should be treated according to the storage mode you use. Local mode keeps data in the browser; connected mode depends on your Supabase and API deployment settings.</p>
                    </div>
                );
            case 'license':
                return (
                    <div className="legal-text">
                        <h3>Apache License 2.0</h3>
                        <p><strong>Copyright (c) 2026 SonyDev.</strong></p>
                        <p><strong>Status: OPEN SOURCE</strong></p>

                        <p>This repository is open source under the Apache License, Version 2.0.</p>

                        <h4>Distribution</h4>
                        <p>You may use, modify, and redistribute the code under Apache-2.0, provided that you keep the required license and attribution notices.</p>

                        <h4>Attribution and Branding</h4>
                        <p>See the repository root <code>LICENSE</code> and <code>NOTICE</code> files. SonyDev attribution should stay intact, and product names or branding are not granted as trademarks beyond what Apache-2.0 allows.</p>
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
