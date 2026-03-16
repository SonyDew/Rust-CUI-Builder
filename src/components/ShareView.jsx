import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Copy, ExternalLink, Globe, Layers, Lock, UserRound } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ProjectPreview from './ProjectPreview';
import ErrorPage from './ErrorPage';
import './SharedRouteShell.css';

const ShareView = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useToast();
    const [project, setProject] = useState(null);
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        const load = async () => {
            setStatus('loading');

            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('id', projectId)
                .single();

            if (error || !data) {
                setStatus('missing');
                return;
            }

            const collaborators = data.settings?.collaborators || [];
            const isOwner = user?.id === data.user_id;
            const isCollaborator = Boolean(
                user?.email && collaborators.some((entry) => {
                    const email = typeof entry === 'string' ? entry : entry?.email;
                    return email?.toLowerCase() === user.email.toLowerCase();
                })
            );

            if (!data.settings?.is_public && !isOwner && !isCollaborator) {
                setStatus('locked');
                return;
            }

            setProject(data);
            setStatus('ready');
        };

        load();
    }, [projectId, user]);

    const copyShareLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            showToast('Share link copied to clipboard', 'success');
        } catch {
            showToast('Clipboard is unavailable in this environment.', 'warning');
        }
    };

    if (status === 'loading') {
        return <div className="route-loader">Loading shared project...</div>;
    }

    if (status === 'missing') {
        return <ErrorPage code="404" title="Shared project not found" message="This share link does not point to an available project." />;
    }

    if (status === 'locked') {
        return (
            <div className="share-shell">
                <div className="share-card">
                    <div className="share-head">
                        <div>
                            <h1 style={{ margin: 0 }}>Private project</h1>
                            <p className="share-subtitle">This share link exists, but you do not have access to it.</p>
                        </div>
                        <button className="glass-btn" onClick={() => navigate('/dashboard')}>
                            <ArrowLeft size={16} style={{ marginRight: '8px' }} />
                            Back
                        </button>
                    </div>
                    <div className="admin-panel">
                        <Lock size={22} />
                        <p>This project is private and requires owner or collaborator access.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="share-shell">
            <div className="share-card">
                <div className="share-head">
                    <div>
                        <div className="share-hero">
                            <span className="share-tag">
                                {project.settings?.is_public ? <Globe size={14} /> : <Lock size={14} />}
                                <span style={{ marginLeft: '8px' }}>{project.settings?.is_public ? 'Public link' : 'Private collaboration'}</span>
                            </span>
                            <span className="share-tag">
                                <Layers size={14} />
                                <span style={{ marginLeft: '8px' }}>{(project.elements || []).length} elements</span>
                            </span>
                        </div>
                        <h1 style={{ margin: 0 }}>{project.name || 'Untitled Project'}</h1>
                        <p className="share-subtitle">Shared Rust CUI preview with project metadata and quick handoff actions.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button className="glass-btn" onClick={() => navigate('/dashboard')}>
                            <ArrowLeft size={16} style={{ marginRight: '8px' }} />
                            Dashboard
                        </button>
                        <button className="glass-btn" onClick={copyShareLink}>
                            <Copy size={16} style={{ marginRight: '8px' }} />
                            Copy link
                        </button>
                        <button className="glass-btn primary" onClick={() => navigate(`/editor/${project.id}`)}>
                            <ExternalLink size={16} style={{ marginRight: '8px' }} />
                            Open editor
                        </button>
                    </div>
                </div>

                <div className="share-columns">
                    <div className="share-preview-card">
                        <ProjectPreview project={project} width={820} />
                    </div>

                    <div className="share-panel">
                        <h2 style={{ marginTop: 0 }}>Project details</h2>
                        <div className="share-meta-list">
                            <div className="share-meta-item">
                                <span>Owner</span>
                                <strong>{project.user_id || 'Unknown'}</strong>
                            </div>
                            <div className="share-meta-item">
                                <span>Layer</span>
                                <strong>{project.settings?.layer || 'Overlay'}</strong>
                            </div>
                            <div className="share-meta-item">
                                <span>UI name</span>
                                <strong>{project.settings?.uiName || 'MyCustomUI'}</strong>
                            </div>
                            <div className="share-meta-item">
                                <span>Chat command</span>
                                <strong>{project.settings?.chatCommand || 'Not set'}</strong>
                            </div>
                            <div className="share-meta-item">
                                <span>Collaborators</span>
                                <strong>{project.settings?.collaborators?.length || 0}</strong>
                            </div>
                            <div className="share-meta-item">
                                <span>Visibility</span>
                                <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                    {project.settings?.is_public ? <Globe size={14} /> : <UserRound size={14} />}
                                    {project.settings?.is_public ? 'Public' : 'Shared privately'}
                                </strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShareView;
