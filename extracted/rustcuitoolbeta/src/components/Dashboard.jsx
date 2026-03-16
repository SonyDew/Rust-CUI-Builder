import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePlan } from '../context/PlanContext';
import { useModal } from '../context/ModalContext';
import { useToast } from '../context/ToastContext';
import ConfirmModal from './ConfirmModal';
import UpgradeModal from './UpgradeModal';
import CreateTeamModal from './CreateTeamModal';
import SettingsModal from './SettingsModal';
import OnboardingSurvey from './OnboardingSurvey';
import { supabase } from '../supabaseClient';
import {
    Plus,
    Clock,
    PenLine,
    Search,
    Trash2,
    Users,
    Globe,
    ChevronDown,
    MoreHorizontal,
    Link as LinkIcon,
    FileCode,
    Grid,
    List,
    RotateCcw,
    XCircle,
    Shield,
    LifeBuoy,
    FolderOpen,
    X,
    Eye,
    Star,
    Download,
    Upload
} from 'lucide-react';
import { exportProject, importProject } from '../utils/projectFile';
import SupportTicket from './SupportTicket';
import './Dashboard.css';
import ProjectPreview from './ProjectPreview';
import SupportView from './SupportView';
import { logActivity } from '../utils/activityLogger';
import { DashboardGridSkeleton, SidebarMenuSkeleton, ProfileHeaderSkeleton } from './Skeleton';
import NotificationBell from './NotificationBell';
import WhatsNew from './WhatsNew';

const Dashboard = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState('recents');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState('lastModified');
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [checkingOnboarding, setCheckingOnboarding] = useState(true);
    const [userMap, setUserMap] = useState({});
    const [selectedTags, setSelectedTags] = useState([]);
    const [editingTagProject, setEditingTagProject] = useState(null);
    const [tagInput, setTagInput] = useState('');
    const [dragOverProject, setDragOverProject] = useState(null);
    const [previewProject, setPreviewProject] = useState(null);
    const [stealthMode, setStealthMode] = useState(true);
    const [favorites, setFavorites] = useState([]);
    const navigate = useNavigate();
    const { user, session, signOut, isAdmin } = useAuth();
    const { canCreateProject, canCreateDraft, canCollaborate, getProjectsRemaining, getDraftsRemaining, limits, plan, refreshProjectCount } = usePlan();
    const { showModal, hideModal } = useModal();
    const { showToast } = useToast();

    const upgradeMessages = [
        "You're running out of files in your free plan. Upgrade to give your ideas room to grow.",
        "Unlock unlimited projects and take your designs to the next level.",
        "Your creativity shouldn't have limits. Upgrade for unlimited storage & projects.",
        "Upgrade and get priority support, more storage, and unlimited exports.",
        "Unlimited projects, team features, and more — check out our plans.",
        "Running low on space? Upgrade for room to build without limits.",
        "Level up your workflow with advanced features and more storage.",
        "Free plans are great to start, but there's so much more waiting for you.",
    ];
    const [upgradeMessage] = useState(() => upgradeMessages[Math.floor(Math.random() * upgradeMessages.length)]);

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }
        fetchProjects();
        fetchFavorites();
        checkOnboardingStatus();

        if (isAdmin) {
            fetchUserMap();
        }

    }, [user, navigate, isAdmin]);

    const fetchFavorites = async () => {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('favorites')
                .eq('user_id', user.id)
                .single();
            if (error) throw error;
            setFavorites(data?.favorites || []);
        } catch (err) {
            console.error('Failed to fetch favorites:', err);
            setFavorites([]);
        }
    };

    const saveFavoritesToSupabase = async (newFavorites) => {
        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({ favorites: newFavorites })
                .eq('user_id', user.id);
            if (error) throw error;
        } catch (err) {
            console.error('Failed to save favorites:', err);
        }
    };

    const isEmailVerified = user?.email_confirmed_at || user?.app_metadata?.provider === 'google';

    // ---- Favorites ----
    const toggleFavorite = (projectId) => {
        setFavorites(prev => {
            const next = prev.includes(projectId)
                ? prev.filter(id => id !== projectId)
                : [...prev, projectId];
            saveFavoritesToSupabase(next);
            return next;
        });
    };

    const removeFavorite = (projectId) => {
        setFavorites(prev => {
            if (!prev.includes(projectId)) return prev;
            const next = prev.filter(id => id !== projectId);
            saveFavoritesToSupabase(next);
            return next;
        });
    };

    const isFavorite = (projectId) => favorites.includes(projectId);

    // ---- Export / Import ----
    const handleExportProject = async (e, project) => {
        e.stopPropagation();
        try {
            await exportProject(project, session?.access_token);
            showToast(`Exported "${project.name}" as .rcui file`, 'success');
        } catch (err) {
            showToast(err.message || 'Failed to export project', 'error');
        }
    };

    const handleImportProject = async () => {
        try {
            const projectData = await importProject(session?.access_token);
            const { data, error } = await supabase
                .from('projects')
                .insert([{
                    name: projectData.name,
                    user_id: user.id,
                    elements: projectData.elements,
                    settings: {
                        backgroundUrl: projectData.settings?.backgroundUrl || `${import.meta.env.BASE_URL}backgrounds/main-view.png`,
                        is_public: false,
                        is_draft: false,
                        share_access: 'view',
                        collaborators: [],
                        uiName: projectData.settings?.uiName || 'MyCustomUI',
                        layer: projectData.settings?.layer || 'Overlay',
                        chatCommand: projectData.settings?.chatCommand || '',
                        consoleCommand: projectData.settings?.consoleCommand || '',
                        permission: projectData.settings?.permission || '',
                        user_tags: projectData.settings?.user_tags || {},
                    }
                }])
                .select()
                .single();

            if (error) throw error;
            refreshProjectCount();
            showToast(`Imported "${projectData.name}" successfully`, 'success');
            fetchProjects();
        } catch (err) {
            if (err.message !== 'Import cancelled') {
                showToast(err.message || 'Failed to import project', 'error');
            }
        }
    };

    const checkOnboardingStatus = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('onboarding_completed')
                .eq('user_id', user.id)
                .single();

            if (error && error.code === 'PGRST116') {
                setShowOnboarding(true);
            } else if (!error && !data?.onboarding_completed) {
                setShowOnboarding(true);
            }
        } catch (err) {
            console.error('Error checking onboarding:', err);
        } finally {
            setCheckingOnboarding(false);
        }
    };

    const fetchUserMap = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, username, email');

            if (error) throw error;

            const map = {};
            if (data) {
                data.forEach(profile => {
                    map[profile.id] = {
                        username: profile.username || 'No Username',
                        email: profile.email
                    };
                });
            }
            setUserMap(map);
        } catch (error) {
            console.error('Failed to fetch user profiles:', error);
        }
    };

    const handleOnboardingComplete = () => {
        setShowOnboarding(false);
    };

    const fetchProjects = async () => {
        setLoading(true);
        try {

            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .order('last_modified', { ascending: false });

            const isUserCollaborator = (collaborators, email) => {
                if (!collaborators || !email) return false;
                return collaborators.some(c =>
                    (typeof c === 'string' ? c : c?.email)?.toLowerCase() === email.toLowerCase()
                );
            };

            const getCollaboratorRole = (collaborators, email) => {
                if (!collaborators || !email) return null;
                const collab = collaborators.find(c =>
                    (typeof c === 'string' ? c : c?.email)?.toLowerCase() === email.toLowerCase()
                );
                if (!collab) return null;
                return typeof collab === 'string' ? 'edit' : (collab.role || 'edit');
            };

            if (error) throw error;

            const mappedProjects = (data || []).map(p => ({
                ...p,
                lastModified: p.last_modified,
                isDeleted: p.is_deleted,
                isDemo: p.user_id !== user.id && (() => {
                    const collabs = p.settings?.collaborators || [];
                    const userIsCollab = isUserCollaborator(collabs, user.email);
                    if (!userIsCollab) return true;
                    const role = getCollaboratorRole(collabs, user.email);
                    return role === 'view';
                })(),
                isTeam: p.settings?.collaborators && p.settings.collaborators.length > 0,
                isOwner: p.user_id === user.id
            }));

            setProjects(mappedProjects);

            // Clean up stale favorites (deleted/trashed projects no longer accessible)
            const validIds = new Set((data || []).map(p => p.id));
            setFavorites(prev => {
                const cleaned = prev.filter(id => validIds.has(id));
                if (cleaned.length !== prev.length) {
                    saveFavoritesToSupabase(cleaned);
                }
                return cleaned;
            });
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const createNewProject = async (asDraft = false) => {
        if (asDraft) {
            if (!canCreateDraft()) {
                showModal(<UpgradeModal feature="drafts" currentPlan={plan} onClose={hideModal} />);
                return;
            }
        } else {
            if (!canCreateProject()) {
                showModal(<UpgradeModal feature="projects" currentPlan={plan} onClose={hideModal} />);
                return;
            }
        }
        try {
            const { data, error } = await supabase
                .from('projects')
                .insert([
                    {
                        name: 'Untitled',
                        user_id: user.id,
                        elements: [],
                        settings: {
                            backgroundUrl: `${import.meta.env.BASE_URL}backgrounds/main-view.png`,
                            is_public: false,
                            is_draft: asDraft,
                            share_access: 'view',
                            collaborators: []
                        }
                    }
                ])
                .select()
                .single();

            if (error) throw error;
            refreshProjectCount();
            if (window.__RCUI_DESKTOP) {
                console.log('__RCUI_OPEN_TAB__:' + window.location.origin + `/editor/${data.id}` + '|Untitled');
            } else {
                navigate(`/editor/${data.id}`);
            }
        } catch (error) {
            console.error('Failed to create project:', error);
            showModal(<ConfirmModal title="Error" message="Failed to create project." onConfirm={hideModal} confirmText="OK" cancelText="" />);
        }
    };

    // Expose create function for desktop app (always fresh closure)
    if (window.__RCUI_DESKTOP) {
        window.__RCUI_CREATE_PROJECT = createNewProject;
    }

    // ---- Tags (per-user) ----
    const getUserTags = (project) => {
        return project.settings?.user_tags?.[user.id] || project.settings?.tags || [];
    };

    const getAllTags = () => {
        const tagSet = new Set();
        projects.forEach(p => {
            getUserTags(p).forEach(t => tagSet.add(t));
        });
        return Array.from(tagSet).sort();
    };

    const addTagToProject = async (projectId, tag) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;
        const currentTags = getUserTags(project);
        if (currentTags.includes(tag)) return;
        const newTags = [...currentTags, tag];
        const userTags = { ...(project.settings?.user_tags || {}), [user.id]: newTags };
        try {
            await supabase.from('projects').update({
                settings: { ...project.settings, user_tags: userTags }
            }).eq('id', projectId);
            setProjects(prev => prev.map(p => p.id === projectId ? { ...p, settings: { ...p.settings, user_tags: userTags } } : p));
        } catch (err) { console.error('Failed to add tag:', err); }
    };

    const removeTagFromProject = async (projectId, tag) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;
        const newTags = getUserTags(project).filter(t => t !== tag);
        const userTags = { ...(project.settings?.user_tags || {}), [user.id]: newTags };
        try {
            await supabase.from('projects').update({
                settings: { ...project.settings, user_tags: userTags }
            }).eq('id', projectId);
            setProjects(prev => prev.map(p => p.id === projectId ? { ...p, settings: { ...p.settings, user_tags: userTags } } : p));
        } catch (err) { console.error('Failed to remove tag:', err); }
    };

    const toggleTagFilter = (tag) => {
        setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    };

    const createTeamProject = () => {
        if (!canCollaborate()) {
            showModal(<UpgradeModal feature="collaboration" currentPlan={plan} onClose={hideModal} />);
            return;
        }
        if (!canCreateProject()) {
            showModal(<UpgradeModal feature="projects" currentPlan={plan} onClose={hideModal} />);
            return;
        }
        showModal(
            <CreateTeamModal
                onConfirm={async (name, email) => {
                    try {
                        const { data, error } = await supabase
                            .from('projects')
                            .insert([
                                {
                                    name: name,
                                    user_id: user.id,
                                    elements: [],
                                    settings: {
                                        backgroundUrl: `${import.meta.env.BASE_URL}backgrounds/main-view.png`,
                                        is_public: false,
                                        share_access: 'edit',
                                        collaborators: [email]
                                    }
                                }
                            ])
                            .select()
                            .single();

                        if (error) throw error;

                        // Notify the invited collaborator
                        try {
                            const { data: profiles } = await supabase
                                .from('profiles')
                                .select('id')
                                .eq('email', email)
                                .single();
                            if (profiles?.id && profiles.id !== user.id) {
                                await supabase.from('notifications').insert([{
                                    user_id: profiles.id,
                                    type: 'team_invite',
                                    title: 'You were invited to a team project',
                                    message: `${user.email} invited you to collaborate on "${name}"`,
                                    metadata: { projectId: data.id },
                                    read: false
                                }]);
                            }
                        } catch (_) { /* non-critical */ }

                        hideModal();
                        fetchProjects();
                    } catch (error) {
                        console.error('Failed to create team project:', error);
                        showToast('Failed to create team project. Please try again.', 'error');
                    }
                }}
                onCancel={hideModal}
            />
        );
    };

    const duplicateProject = async (project) => {
        const isDraft = project.settings?.is_draft;
        if (isDraft) {
            if (!canCreateDraft()) {
                showModal(<UpgradeModal feature="drafts" currentPlan={plan} onClose={hideModal} />);
                return;
            }
        } else {
            if (!canCreateProject()) {
                showModal(<UpgradeModal feature="projects" currentPlan={plan} onClose={hideModal} />);
                return;
            }
        }
        try {
            const newName = `${project.name} (Copy)`;
            const { data, error } = await supabase
                .from('projects')
                .insert([{
                    name: newName,
                    user_id: user.id,
                    elements: project.elements || [],
                    settings: {
                        ...(project.settings || {}),
                        is_public: false,
                        is_community_published: false,
                        collaborators: [],
                        community_title: null,
                        community_desc: null,
                        community_tags: null,
                        community_category: null,
                        share_access: 'view'
                    }
                }])
                .select()
                .single();

            if (error) throw error;
            hideModal();
            if (window.__RCUI_DESKTOP) {
                console.log('__RCUI_OPEN_TAB__:' + window.location.origin + `/editor/${data.id}` + '|' + newName);
            } else {
                navigate(`/editor/${data.id}`);
            }
        } catch (error) {
            console.error('Failed to duplicate project:', error);
            showModal(<ConfirmModal title="Error" message="Failed to copy project." onConfirm={hideModal} confirmText="OK" cancelText="" />);
        }
    };

    const openProject = (project) => {
        if (activeView === 'trash') return;

        logActivity('OPEN_PROJECT', `Opened Project: ${project.name} (${project.id})`, user?.email);

        if (activeView === 'browse') {
            setPreviewProject(project);
            return;
        }
        if (project.isDemo) {
            showModal(
                <ConfirmModal
                    title="Use Template"
                    message={`Do you want to create a copy of "${project.name}"?`}
                    confirmText="Create Copy"
                    cancelText="Cancel"
                    onConfirm={() => duplicateProject(project)}
                    onCancel={hideModal}
                />
            );
            return;
        }
        if (window.__RCUI_DESKTOP) {
            console.log('__RCUI_OPEN_TAB__:' + window.location.origin + `/editor/${project.id}` + '|' + project.name);
        } else {
            navigate(`/editor/${project.id}`);
        }
    };

    const deleteProject = async (e, id) => {
        e.stopPropagation();
        if (activeView === 'trash') {
            showModal(
                <ConfirmModal
                    title="Delete Project"
                    message="Permanently delete this project? This cannot be undone."
                    isDestructive={true}
                    onConfirm={async () => {
                        try {
                            const { error } = await supabase
                                .from('projects')
                                .update({
                                    marked_for_deletion: true,
                                    deletion_scheduled_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                                })
                                .eq('id', id);

                            if (error) throw error;

                            removeFavorite(id);
                            showModal(
                                <ConfirmModal
                                    title="Project Deleted"
                                    message="Your project has been scheduled for permanent deletion in 30 days. You can recover it within this period by contacting support."
                                    onConfirm={hideModal}
                                    confirmText="OK"
                                    cancelText=""
                                />
                            );
                            fetchProjects();
                        } catch (error) {
                            console.error('Failed to delete project:', error);
                            showToast('Failed to delete project.', 'error');
                            hideModal();
                        }
                    }}
                    onCancel={hideModal}
                />
            );
        } else {
            showModal(
                <ConfirmModal
                    title="Move to Trash"
                    message="Move this project to trash?"
                    isDestructive={true}
                    onConfirm={async () => {
                        try {
                            const { error } = await supabase
                                .from('projects')
                                .update({ is_deleted: true })
                                .eq('id', id);

                            if (error) throw error;
                            removeFavorite(id);
                            fetchProjects();
                        } catch (error) {
                            console.error('Failed to delete project:', error);
                        }
                        hideModal();
                    }}
                    onCancel={hideModal}
                />
            );
        }
    };

    const restoreProject = async (e, id) => {
        e.stopPropagation();
        const project = projects.find(p => p.id === id);
        const isDraft = project?.settings?.is_draft;
        if (isDraft) {
            if (!canCreateDraft()) {
                showModal(<UpgradeModal feature="drafts" currentPlan={plan} onClose={hideModal} />);
                return;
            }
        } else {
            if (!canCreateProject()) {
                showModal(<UpgradeModal feature="projects" currentPlan={plan} onClose={hideModal} />);
                return;
            }
        }
        try {
            const { error } = await supabase
                .from('projects')
                .update({ is_deleted: false })
                .eq('id', id);

            if (error) throw error;
            refreshProjectCount();
            fetchProjects();
        } catch (error) {
            console.error('Failed to restore project:', error);
        }
    };

    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    };

    const getFilteredProjects = () => {
        let filtered = projects.filter(p => !p.marked_for_deletion);

        if (searchQuery) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        if (selectedTags.length > 0) {
            filtered = filtered.filter(p => {
                const projectTags = getUserTags(p);
                return selectedTags.every(tag => projectTags.includes(tag));
            });
        }

        filtered.sort((a, b) => {
            if (sortOrder === 'lastModified') {
                return new Date(b.lastModified) - new Date(a.lastModified);
            } else {
                return a.name.localeCompare(b.name);
            }
        });

        const isUserCollab = (collaborators, email) => {
            if (!collaborators || !email) return false;
            return collaborators.some(c =>
                (typeof c === 'string' ? c : c?.email)?.toLowerCase() === email.toLowerCase()
            );
        };

        const isExternalProject = (p) => {
            if (p.user_id === user.id) return false;
            if (isUserCollab(p.settings?.collaborators, user?.email)) return false;
            if (p.isTeam) return false;

            // Admins see all projects via RLS — treat non-owned as external outside browse view
            if (isAdmin) return true;

            if (p.settings?.is_community_published) return true;

            if (p.settings?.is_public) return true;

            return false;
        };

        const notCommunity = p => !p.settings?.is_community_published;

        switch (activeView) {
            case 'recents':
                return filtered.filter(p => !p.isDeleted && !isExternalProject(p) && notCommunity(p)).slice(0, 10);
            case 'favorites':
                return filtered.filter(p => !p.isDeleted && favorites.includes(p.id));
            case 'drafts':
                return filtered.filter(p => !p.isDeleted && !isExternalProject(p) && notCommunity(p) && p.settings?.is_draft);
            case 'all':
                return filtered.filter(p => !p.isDeleted && !isExternalProject(p) && notCommunity(p) && !p.settings?.is_draft);
            case 'trash':
                return filtered.filter(p => p.isDeleted);
            case 'community':
                return filtered.filter(p => !p.isDeleted && p.settings?.is_community_published);
            case 'team':
                return filtered.filter(p => !p.isDeleted && p.isTeam && !isExternalProject(p));
            case 'browse':
                return filtered.filter(p => !p.isDeleted && p.user_id !== user.id);
            default:
                return filtered.filter(p => !p.isDeleted && !isExternalProject(p) && notCommunity(p));
        }
    };

    const filteredProjects = getFilteredProjects();

    const getTitle = () => {
        switch (activeView) {
            case 'recents': return 'Recents';
            case 'favorites': return 'Favorites';
            case 'community': return 'Community';
            case 'drafts': return 'Drafts';
            case 'all': return 'All Projects';
            case 'team': return 'Team Projects';
            case 'trash': return 'Trash';
            case 'support': return 'Support Tickets';
            case 'browse': return 'Browse All Projects';
            default: return 'Projects';
        }
    };

    return (
        <div className="dashboard-container">
            {!isEmailVerified && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    background: '#ff4d4f',
                    color: 'white',
                    textAlign: 'center',
                    padding: '8px',
                    fontSize: '13px',
                    fontWeight: '500',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                }}>
                    <XCircle size={16} />
                    You need to verify your email or your account will be suspended and removed in 8h.
                </div>
            )}
            <div className="dashboard-sidebar">
                <div className="sidebar-header">
                    <div className="user-profile" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                        {user?.user_metadata?.avatar_url ? (
                            <img
                                src={user.user_metadata.avatar_url}
                                alt="Profile"
                                className="user-avatar"
                                style={{ objectFit: 'cover' }}
                            />
                        ) : (
                            <div className="user-avatar">{user?.email?.[0].toUpperCase() || 'U'}</div>
                        )}
                        <span className="user-name">
                            {user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || 'User'}
                        </span>
                        <ChevronDown size={14} style={{ color: '#888' }} />

                        {showProfileMenu && (
                            <div className="profile-dropdown">
                                <div className="menu-item" onClick={(e) => { e.stopPropagation(); showModal(<SettingsModal onClose={hideModal} />); setShowProfileMenu(false); }}>Settings</div>
                                <div className="menu-item" onClick={(e) => { e.stopPropagation(); signOut(); navigate('/'); }}>Log out</div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="sidebar-search">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="sidebar-menu">
                    <div className={`menu-item ${activeView === 'recents' ? 'active' : ''}`} onClick={() => setActiveView('recents')}>
                        <Clock size={18} />
                        <span>Recents</span>
                    </div>
                    <div className={`menu-item ${activeView === 'favorites' ? 'active' : ''}`} onClick={() => setActiveView('favorites')}>
                        <Star size={18} />
                        <span>Favorites</span>
                        {favorites.length > 0 && (
                            <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#fbbf24', opacity: 0.7 }}>{favorites.length}</span>
                        )}
                    </div>
                    <div className={`menu-item ${activeView === 'community' ? 'active' : ''}`} onClick={() => setActiveView('community')}>
                        <Globe size={18} />
                        <span>Community</span>
                    </div>

                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '10px 0' }} />

                    <div className="sidebar-section">
                        <div className={`menu-item ${activeView === 'drafts' ? 'active' : ''}`} onClick={() => setActiveView('drafts')}>
                            <PenLine size={18} />
                            <span>Drafts</span>
                        </div>
                        <div className={`menu-item ${activeView === 'all' ? 'active' : ''}`} onClick={() => setActiveView('all')}>
                            <FolderOpen size={18} />
                            <span>All projects</span>
                        </div>
                        <div className={`menu-item ${activeView === 'team' ? 'active' : ''}`} onClick={() => setActiveView('team')}>
                            <Users size={18} />
                            <span>Team project</span>
                        </div>
                        <div className={`menu-item ${activeView === 'trash' ? 'active' : ''}`} onClick={() => setActiveView('trash')}>
                            <Trash2 size={18} />
                            <span>Trash</span>
                        </div>
                        <div className={`menu-item ${activeView === 'support' ? 'active' : ''}`} onClick={() => setActiveView('support')}>
                            <LifeBuoy size={18} />
                            <span>Support</span>
                        </div>
                    </div>

                    {isAdmin && (
                        <div className="sidebar-section" style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                            <div className="sidebar-label" style={{ color: '#0d99ff', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase', padding: '0 15px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Shield size={12} /> Admin
                            </div>
                            <div className={`menu-item ${activeView === 'browse' ? 'active' : ''}`} onClick={() => setActiveView('browse')}>
                                <Eye size={18} />
                                <span>Browse Projects</span>
                            </div>
                            <div className="menu-item" onClick={() => navigate('/admin')}>
                                <Shield size={18} />
                                <span>Admin Panel</span>
                            </div>
                        </div>
                    )}
                </div>

                {plan === 'free' && projects.filter(p => !p.settings?.is_trashed).length >= 2 && (
                    <div className="upgrade-banner">
                        <div className="upgrade-text">
                            {getProjectsRemaining() === 0
                                ? "You've used all 3 free projects. Upgrade tomorrow is bright!"
                                : `${getProjectsRemaining()} project${getProjectsRemaining() === 1 ? '' : 's'} remaining on Free plan. ${upgradeMessage}`
                            }
                        </div>
                        <button className="upgrade-btn" onClick={() => navigate('/plans')}>View plans</button>
                    </div>
                )}
            </div>

            <div className="dashboard-main">
                <div className="main-header">
                    <div className="header-title">{getTitle()}</div>
                    <div className="header-actions">
                        <WhatsNew />
                        <NotificationBell />
                        {activeView !== 'trash' && activeView !== 'community' && activeView !== 'support' && activeView !== 'browse' && (
                            <>
                                <button className="action-btn" onClick={handleImportProject} title="Import .rcui file">
                                    <Upload size={16} /> Import
                                </button>
                                {activeView !== 'drafts' && (
                                    <button className="action-btn" onClick={createTeamProject}>
                                        <Users size={16} /> New Team Project
                                    </button>
                                )}
                                <button className="action-btn primary" onClick={() => createNewProject(activeView === 'drafts')}>
                                    <Plus size={16} /> {activeView === 'drafts' ? 'New draft design' : 'New project design'}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="filters-bar" style={activeView === 'support' ? { display: 'none' } : undefined}>
                    {getAllTags().length > 0 && activeView !== 'support' && activeView !== 'community' && activeView !== 'templates' && (
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '6px',
                            alignItems: 'center',
                            marginRight: 'auto',
                        }}>
                            {getAllTags().map(tag => (
                                <button
                                    key={tag}
                                    draggable
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData('text/tag', tag);
                                        e.dataTransfer.effectAllowed = 'copy';
                                    }}
                                    onClick={() => toggleTagFilter(tag)}
                                    style={{
                                        padding: '4px 12px',
                                        fontSize: '0.75rem',
                                        borderRadius: '99px',
                                        border: 'none',
                                        background: selectedTags.includes(tag) ? 'rgba(13, 153, 255, 0.18)' : 'rgba(255,255,255,0.06)',
                                        color: selectedTags.includes(tag) ? '#0d99ff' : '#999',
                                        cursor: 'grab',
                                        transition: 'all 0.2s',
                                        fontWeight: selectedTags.includes(tag) ? 600 : 400,
                                        letterSpacing: '0.2px',
                                    }}
                                >
                                    {tag}
                                </button>
                            ))}
                            {selectedTags.length > 0 && (
                                <button
                                    onClick={() => setSelectedTags([])}
                                    style={{
                                        padding: '4px 10px',
                                        fontSize: '0.7rem',
                                        borderRadius: '99px',
                                        border: 'none',
                                        background: 'rgba(255,255,255,0.04)',
                                        color: '#666',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <X size={10} /> Clear
                                </button>
                            )}
                        </div>
                    )}
                    <div className="filter-dropdown" onClick={() => setSortOrder(sortOrder === 'lastModified' ? 'name' : 'lastModified')}>
                        {sortOrder === 'lastModified' ? 'Last modified' : 'Name'} <ChevronDown size={14} />
                    </div>
                    <div className="filter-dropdown">
                        <Grid size={16} />
                    </div>
                </div>

                <div className="projects-scroll-area" style={{ overflow: activeView === 'support' ? 'hidden' : 'auto' }}>
                    {activeView === 'support' ? (
                        <SupportView user={user} showModal={showModal} hideModal={hideModal} />
                    ) : loading ? (
                        <DashboardGridSkeleton count={6} />
                    ) : filteredProjects.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666' }}>
                            <div style={{ marginBottom: '10px' }}><FolderOpen size={48} /></div>
                            <div>No projects found in {getTitle()}</div>
                        </div>
                    ) : (
                        activeView === 'browse' ? (
                            <div className="projects-grid">
                                {filteredProjects.map(project => (
                                    <div key={project.id} className="project-card" onClick={() => openProject(project)}>
                                        <div className="card-preview">
                                            <ProjectPreview project={project} width={280} />
                                        </div>
                                        <div className="card-info">
                                            <div className="card-title-row">
                                                <div className="card-icon">
                                                    {project.isTeam ? (
                                                        <Users size={24} style={{ background: '#0d99ff', padding: '4px', borderRadius: '4px', color: 'white' }} />
                                                    ) : project.settings?.is_community_published ? (
                                                        <Globe size={24} style={{ background: '#0d99ff', padding: '4px', borderRadius: '4px', color: 'white' }} />
                                                    ) : (
                                                        <LinkIcon size={24} style={{ background: '#0d99ff', padding: '4px', borderRadius: '4px', color: 'white' }} />
                                                    )}
                                                </div>
                                                <div className="card-title" title={project.name}>{project.name}</div>
                                            </div>
                                            <div className="card-meta" style={{ marginLeft: '40px' }}>
                                                Edited {timeAgo(project.lastModified)}
                                                <span style={{ marginLeft: '10px', color: '#0d99ff', fontSize: '10px' }}>
                                                    By: {userMap[project.user_id]?.username || userMap[project.user_id]?.email || project.user_id?.substring(0, 6)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="projects-grid">
                                {filteredProjects.map(project => (
                                <div
                                    key={project.id}
                                    className="project-card"
                                    onClick={() => openProject(project)}
                                    style={{
                                        opacity: activeView === 'trash' ? 0.7 : 1,
                                        outline: dragOverProject === project.id ? '2px solid #0d99ff' : 'none',
                                        outlineOffset: '-2px',
                                        transition: 'outline 0.15s ease',
                                    }}
                                    onDragOver={(e) => {
                                        if (e.dataTransfer.types.includes('text/tag')) {
                                            e.preventDefault();
                                            e.dataTransfer.dropEffect = 'copy';
                                            setDragOverProject(project.id);
                                        }
                                    }}
                                    onDragLeave={() => setDragOverProject(null)}
                                    onDrop={(e) => {
                                        const tag = e.dataTransfer.getData('text/tag');
                                        if (tag) {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            addTagToProject(project.id, tag);
                                        }
                                        setDragOverProject(null);
                                    }}
                                >
                                    <div className="card-preview">
                                        <ProjectPreview project={project} width={280} />
                                    </div>
                                    <div className="card-info">
                                        <div className="card-title-row">
                                            <div className="card-icon">
                                                {project.isTeam ? (
                                                    <Users size={24} style={{ background: '#0d99ff', padding: '4px', borderRadius: '4px', color: 'white' }} />
                                                ) : project.settings?.is_community_published ? (
                                                    <Globe size={24} style={{ background: '#0d99ff', padding: '4px', borderRadius: '4px', color: 'white' }} />
                                                ) : (
                                                    <LinkIcon size={24} style={{ background: '#0d99ff', padding: '4px', borderRadius: '4px', color: 'white' }} />
                                                )}
                                            </div>
                                            <div className="card-title" title={project.name}>{project.name}</div>
                                            <div style={{ marginLeft: 'auto', display: 'flex', gap: '5px', alignItems: 'center' }}>
                                                <button
                                                    className={`favorite-btn ${isFavorite(project.id) ? 'is-favorite' : ''}`}
                                                    title={isFavorite(project.id) ? 'Remove from favorites' : 'Add to favorites'}
                                                    onClick={(e) => { e.stopPropagation(); toggleFavorite(project.id); }}
                                                >
                                                    <Star size={16} fill={isFavorite(project.id) ? '#fbbf24' : 'none'} />
                                                </button>
                                                {activeView === 'trash' ? (
                                                    <>
                                                        <RotateCcw
                                                            size={20}
                                                            className="delete-btn"
                                                            title="Restore"
                                                            onClick={(e) => restoreProject(e, project.id)}
                                                        />
                                                        <XCircle
                                                            size={20}
                                                            className="delete-btn"
                                                            title="Delete Permanently"
                                                            onClick={(e) => deleteProject(e, project.id)}
                                                            style={{ color: '#ff4d4d' }}
                                                        />
                                                    </>
                                                ) : (
                                                    !project.isDemo && (
                                                        <>
                                                            <Download
                                                                size={18}
                                                                className="delete-btn"
                                                                title="Export as .rcui"
                                                                onClick={(e) => handleExportProject(e, project)}
                                                            />
                                                            <Trash2
                                                                size={20}
                                                                className="delete-btn"
                                                                onClick={(e) => deleteProject(e, project.id)}
                                                            />
                                                        </>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                        <div className="card-meta" style={{ marginLeft: '40px' }}>
                                            Edited {timeAgo(project.lastModified)}
                                        </div>
                                        {/* Project Tags */}
                                        <div style={{ marginLeft: '40px', marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                                            {getUserTags(project).map(tag => (
                                                <span key={tag} style={{
                                                    padding: '3px 10px',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 500,
                                                    borderRadius: '10px',
                                                    background: 'rgba(13, 153, 255, 0.1)',
                                                    color: '#0d99ff',
                                                    border: '1px solid rgba(13, 153, 255, 0.18)',
                                                    display: 'flex', alignItems: 'center', gap: '4px',
                                                    letterSpacing: '0.2px',
                                                }}>
                                                    {tag}
                                                    <X size={10} style={{ cursor: 'pointer', opacity: 0.6 }} onClick={(e) => { e.stopPropagation(); removeTagFromProject(project.id, tag); }} />
                                                </span>
                                            ))}
                                            {(
                                                editingTagProject === project.id ? (
                                                    <input
                                                        autoFocus
                                                        value={tagInput}
                                                        onChange={(e) => setTagInput(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            e.stopPropagation();
                                                            if (e.key === 'Enter' && tagInput.trim()) {
                                                                addTagToProject(project.id, tagInput.trim().toLowerCase());
                                                                setTagInput('');
                                                                setEditingTagProject(null);
                                                            }
                                                            if (e.key === 'Escape') { setEditingTagProject(null); setTagInput(''); }
                                                        }}
                                                        onBlur={() => { setEditingTagProject(null); setTagInput(''); }}
                                                        onClick={(e) => e.stopPropagation()}
                                                        placeholder="tag name"
                                                        style={{
                                                            width: '80px',
                                                            padding: '3px 8px',
                                                            fontSize: '0.7rem',
                                                            borderRadius: '10px',
                                                            border: '1px solid rgba(13, 153, 255, 0.3)',
                                                            background: 'rgba(13, 153, 255, 0.06)',
                                                            color: '#fff',
                                                            outline: 'none',
                                                        }}
                                                    />
                                                ) : (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setEditingTagProject(project.id); setTagInput(''); }}
                                                        style={{
                                                            padding: '3px 10px',
                                                            fontSize: '0.7rem',
                                                            borderRadius: '10px',
                                                            border: '1px dashed rgba(255,255,255,0.15)',
                                                            background: 'rgba(255,255,255,0.03)',
                                                            color: '#666',
                                                            cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', gap: '3px',
                                                            transition: 'all 0.2s',
                                                        }}
                                                    >
                                                        <Plus size={10} /> tag
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            </div>
                        )
                    )}
                </div>
            </div>

            {showOnboarding && (
                <OnboardingSurvey onComplete={handleOnboardingComplete} />
            )}

            {previewProject && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
                    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                }} onClick={() => setPreviewProject(null)}>
                    <div style={{
                        background: 'var(--glass-bg, rgba(30, 30, 30, 0.65))',
                        backdropFilter: 'blur(16px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                        border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.125))',
                        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
                        borderRadius: '8px',
                        width: '520px', maxHeight: '90vh', overflow: 'hidden',
                    }} onClick={(e) => e.stopPropagation()}>
                        {/* Preview */}
                        <div style={{ borderRadius: '8px 8px 0 0', overflow: 'hidden', borderBottom: '1px solid var(--glass-border, rgba(255,255,255,0.125))' }}>
                            <ProjectPreview project={previewProject} width={520} />
                        </div>

                        {/* Info */}
                        <div style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '8px',
                                    background: 'var(--accent, #0d99ff)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <LinkIcon size={18} color="white" />
                                </div>
                                <div>
                                    <div style={{ color: 'var(--text-main, #fff)', fontSize: '15px', fontWeight: '600' }}>{previewProject.name}</div>
                                    <div style={{ color: 'var(--text-muted, #888)', fontSize: '11px', marginTop: '1px' }}>
                                        By: {userMap[previewProject.user_id]?.username || userMap[previewProject.user_id]?.email || 'Unknown'}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '16px', marginBottom: '14px', color: 'var(--text-muted, #888)', fontSize: '11px' }}>
                                <div>Edited {timeAgo(previewProject.lastModified)}</div>
                                <div>{(previewProject.elements || []).length} elements</div>
                                <div>{previewProject.settings?.is_draft ? 'Draft' : 'Published'}</div>
                            </div>

                            {/* Stealth toggle */}
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '10px 14px', borderRadius: '6px',
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
                                marginBottom: '16px',
                            }}>
                                <div>
                                    <div style={{ color: 'var(--text-main, #fff)', fontSize: '12px', fontWeight: '500' }}>Stealth Mode</div>
                                    <div style={{ color: 'var(--text-muted, #666)', fontSize: '10px', marginTop: '2px' }}>User won't see your cursor or presence</div>
                                </div>
                                <div
                                    onClick={() => setStealthMode(!stealthMode)}
                                    style={{
                                        width: '38px', height: '20px', borderRadius: '10px', cursor: 'pointer',
                                        background: stealthMode ? 'var(--accent, #0d99ff)' : 'rgba(255,255,255,0.15)',
                                        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                                    }}
                                >
                                    <div style={{
                                        width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
                                        position: 'absolute', top: '2px',
                                        left: stealthMode ? '20px' : '2px',
                                        transition: 'left 0.2s',
                                    }} />
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button
                                    className="btn"
                                    onClick={() => setPreviewProject(null)}
                                >Cancel</button>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => {
                                        const url = `/editor/${previewProject.id}${stealthMode ? '?stealth=1' : ''}`;
                                        setPreviewProject(null);
                                        navigate(url);
                                    }}
                                >Enter Project</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
