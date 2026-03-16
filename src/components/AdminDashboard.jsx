import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, FolderKanban, LifeBuoy, ShieldCheck, Users } from 'lucide-react';
import { supabase } from '../supabaseClient';
import './SharedRouteShell.css';

const COUNT_TABLES = [
    { key: 'profiles', label: 'Profiles', icon: Users },
    { key: 'projects', label: 'Projects', icon: FolderKanban },
    { key: 'tickets', label: 'Tickets', icon: LifeBuoy },
    { key: 'notifications', label: 'Notifications', icon: Bell },
];

const formatDate = (value) => {
    if (!value) return 'Unknown';
    return new Date(value).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [counts, setCounts] = useState({});
    const [recentProjects, setRecentProjects] = useState([]);
    const [recentTickets, setRecentTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);

            try {
                const countResults = await Promise.all(
                    COUNT_TABLES.map(async ({ key }) => {
                        const { count } = await supabase.from(key).select('*', { count: 'exact', head: true });
                        return [key, typeof count === 'number' ? count : null];
                    })
                );

                setCounts(Object.fromEntries(countResults));

                const [{ data: projects }, { data: tickets }] = await Promise.all([
                    supabase
                        .from('projects')
                        .select('id, name, user_id, last_modified, settings')
                        .order('last_modified', { ascending: false })
                        .limit(6),
                    supabase
                        .from('tickets')
                        .select('id, subject, status, updated_at, user_id')
                        .order('updated_at', { ascending: false })
                        .limit(6)
                ]);

                setRecentProjects(projects || []);
                setRecentTickets(tickets || []);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    return (
        <div className="admin-shell">
            <div className="admin-card">
                <div className="admin-head">
                    <div>
                        <div className="share-tag" style={{ display: 'inline-flex', marginBottom: '12px' }}>
                            <ShieldCheck size={16} />
                            <span style={{ marginLeft: '8px' }}>Admin Console</span>
                        </div>
                        <h1 style={{ margin: 0 }}>Workspace overview</h1>
                        <p className="admin-subtitle">A lightweight admin view for projects, users, tickets, and notifications.</p>
                    </div>
                    <button className="glass-btn" onClick={() => navigate('/dashboard')}>
                        <ArrowLeft size={16} style={{ marginRight: '8px' }} />
                        Back to dashboard
                    </button>
                </div>

                <div className="stats-grid">
                    {COUNT_TABLES.map(({ key, label, icon: Icon }) => (
                        <div key={key} className="stat-card">
                            <Icon size={18} />
                            <strong>{loading ? '...' : counts[key] ?? '--'}</strong>
                            <span>{label}</span>
                        </div>
                    ))}
                </div>

                <div className="admin-columns">
                    <section className="admin-panel">
                        <h2 style={{ marginTop: 0 }}>Recent projects</h2>
                        <div className="admin-list">
                            {recentProjects.length === 0 ? (
                                <div className="admin-list-item">
                                    <span>No project data available.</span>
                                    <span>{loading ? 'Loading...' : 'Unavailable'}</span>
                                </div>
                            ) : (
                                recentProjects.map((project) => (
                                    <div key={project.id} className="admin-list-item">
                                        <div>
                                            <strong>{project.name || 'Untitled'}</strong>
                                            <div className="admin-subtitle">{project.user_id || 'Unknown owner'}</div>
                                        </div>
                                        <span>{formatDate(project.last_modified)}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    <section className="admin-panel">
                        <h2 style={{ marginTop: 0 }}>Recent tickets</h2>
                        <div className="admin-list">
                            {recentTickets.length === 0 ? (
                                <div className="admin-list-item">
                                    <span>No ticket data available.</span>
                                    <span>{loading ? 'Loading...' : 'Unavailable'}</span>
                                </div>
                            ) : (
                                recentTickets.map((ticket) => (
                                    <div key={ticket.id} className="admin-list-item">
                                        <div>
                                            <strong>{ticket.subject || 'Untitled ticket'}</strong>
                                            <div className="admin-subtitle">{ticket.user_id || 'Unknown reporter'}</div>
                                        </div>
                                        <span>{ticket.status || 'open'}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
