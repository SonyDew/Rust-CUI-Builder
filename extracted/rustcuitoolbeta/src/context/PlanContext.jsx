import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';

const PlanContext = createContext();

export const usePlan = () => useContext(PlanContext);

// ── Plan definitions ────────────────────────────────────────
export const PLAN_LIMITS = {
    free: {
        name: 'Free',
        maxProjects: 3,
        maxDrafts: 20,
        maxElementsPerProject: 50,
        maxStorageBytes: 50 * 1024 * 1024,       // 50 MB
        canvasResolution: '720p',
        customAssetUploads: false,
        snippetLibrary: false,
        teamCollaboration: false,
        prioritySupport: false,
        allTemplates: false,
        maxCollaborators: 0,
        versionHistory: true,
        maxVersions: 10,
    },
    solo: {
        name: 'Solo',
        maxProjects: -1,   // unlimited
        maxDrafts: -1,
        maxElementsPerProject: -1,
        maxStorageBytes: 500 * 1024 * 1024,      // 500 MB
        canvasResolution: '4K',
        customAssetUploads: true,
        snippetLibrary: true,
        teamCollaboration: false,
        prioritySupport: true,
        allTemplates: true,
        maxCollaborators: 0,
        versionHistory: true,
        maxVersions: 50,
    },
    team: {
        name: 'Team',
        maxProjects: -1,
        maxDrafts: -1,
        maxElementsPerProject: -1,
        maxStorageBytes: 2 * 1024 * 1024 * 1024, // 2 GB
        canvasResolution: '4K',
        customAssetUploads: true,
        snippetLibrary: true,
        teamCollaboration: true,
        prioritySupport: true,
        allTemplates: true,
        maxCollaborators: 10,
        versionHistory: true,
        maxVersions: -1,
    },
};

export const PlanProvider = ({ children }) => {
    const { user } = useAuth();
    const [plan, setPlan] = useState('free');
    const [loading, setLoading] = useState(true);
    const [projectCount, setProjectCount] = useState(0);
    const [draftCount, setDraftCount] = useState(0);

    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

    // Fetch the user's plan from profiles
    const fetchPlan = useCallback(async () => {
        if (!user) {
            setPlan('free');
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('plan')
                .eq('id', user.id)
                .single();

            if (error) throw error;
            setPlan(data?.plan || 'free');
        } catch (err) {
            console.error('Failed to fetch plan:', err);
            setPlan('free');
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Fetch project and draft counts for limit checks
    const fetchProjectCount = useCallback(async () => {
        if (!user) {
            setProjectCount(0);
            setDraftCount(0);
            return;
        }

        try {
            // Fetch all non-deleted projects to split by draft status
            const { data, error } = await supabase
                .from('projects')
                .select('id, settings')
                .eq('user_id', user.id)
                .or('is_deleted.is.null,is_deleted.eq.false');

            if (error) throw error;
            const items = data || [];
            const drafts = items.filter(p => p.settings?.is_draft);
            const projects = items.filter(p => !p.settings?.is_draft);
            setDraftCount(drafts.length);
            setProjectCount(projects.length);
        } catch (err) {
            console.error('Failed to fetch project count:', err);
        }
    }, [user]);

    useEffect(() => {
        fetchPlan();
        fetchProjectCount();
    }, [fetchPlan, fetchProjectCount]);

    // ── Helper methods ──────────────────────────────────────
    const canCreateProject = () => {
        if (limits.maxProjects === -1) return true;
        return projectCount < limits.maxProjects;
    };

    const canCreateDraft = () => {
        if (limits.maxDrafts === -1) return true;
        return draftCount < limits.maxDrafts;
    };

    const canAddElement = (currentCount) => {
        if (limits.maxElementsPerProject === -1) return true;
        return currentCount < limits.maxElementsPerProject;
    };

    const canUploadAssets = () => limits.customAssetUploads;

    const canUseSnippets = () => limits.snippetLibrary;

    const canCollaborate = () => limits.teamCollaboration;

    const canUseTemplates = () => limits.allTemplates;

    const getProjectsRemaining = () => {
        if (limits.maxProjects === -1) return Infinity;
        return Math.max(0, limits.maxProjects - projectCount);
    };

    const getDraftsRemaining = () => {
        if (limits.maxDrafts === -1) return Infinity;
        return Math.max(0, limits.maxDrafts - draftCount);
    };

    const getElementsRemaining = (currentCount) => {
        if (limits.maxElementsPerProject === -1) return Infinity;
        return Math.max(0, limits.maxElementsPerProject - currentCount);
    };

    const refreshProjectCount = () => fetchProjectCount();

    const value = {
        plan,
        limits,
        loading,
        projectCount,
        canCreateProject,
        canCreateDraft,
        canAddElement,
        canUploadAssets,
        canUseSnippets,
        canCollaborate,
        canUseTemplates,
        projectCount,
        draftCount,
        getProjectsRemaining,
        getDraftsRemaining,
        getElementsRemaining,
        refreshProjectCount,
        refreshPlan: fetchPlan,
    };

    return (
        <PlanContext.Provider value={value}>
            {children}
        </PlanContext.Provider>
    );
};
