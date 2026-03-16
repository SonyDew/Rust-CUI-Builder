import React from 'react';
import './Skeleton.css';

const Skeleton = ({
    variant = 'rectangular',
    width,
    height,
    count = 1,
    style = {},
    className = '',
    animation = 'pulse'
}) => {
    const getVariantStyles = () => {
        switch (variant) {
            case 'text':
                return {
                    height: height || '1em',
                    width: width || '100%',
                    borderRadius: '4px'
                };
            case 'circular':
                return {
                    height: height || '40px',
                    width: width || '40px',
                    borderRadius: '50%'
                };
            case 'card':
                return {
                    height: height || '200px',
                    width: width || '100%',
                    borderRadius: '12px'
                };
            case 'rectangular':
            default:
                return {
                    height: height || '100px',
                    width: width || '100%',
                    borderRadius: '8px'
                };
        }
    };

    const items = Array.from({ length: count }, (_, index) => (
        <div
            key={index}
            className={`skeleton skeleton-${animation} ${className}`}
            style={{
                ...getVariantStyles(),
                ...style,
                marginBottom: count > 1 && index < count - 1 ? '8px' : 0
            }}
            aria-hidden="true"
            role="presentation"
        />
    ));

    return count === 1 ? items[0] : <>{items}</>;
};

export const ProjectCardSkeleton = () => (
    <div className="skeleton-project-card">
        <Skeleton variant="rectangular" height={160} className="skeleton-preview" />
        <div className="skeleton-card-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Skeleton variant="circular" width={32} height={32} />
                <div style={{ flex: 1 }}>
                    <Skeleton variant="text" width="70%" height={16} style={{ marginBottom: '8px' }} />
                    <Skeleton variant="text" width="40%" height={12} />
                </div>
            </div>
        </div>
    </div>
);

export const SidebarMenuSkeleton = () => (
    <div className="skeleton-sidebar-menu">
        {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-menu-item">
                <Skeleton variant="circular" width={18} height={18} />
                <Skeleton variant="text" width="60%" height={14} />
            </div>
        ))}
    </div>
);

export const PageLoadingSkeleton = ({ message = 'Loading...' }) => (
    <div className="skeleton-page-loading">
        <div className="skeleton-loader-container">
            <div className="skeleton-spinner" />
            <p className="skeleton-loading-text">{message}</p>
        </div>
    </div>
);

export const EditorSkeleton = () => (
    <div className="skeleton-editor">
        <div className="skeleton-sidebar-left">
            <Skeleton variant="rectangular" height={40} style={{ marginBottom: '16px' }} />
            <Skeleton variant="text" width="50%" height={12} style={{ marginBottom: '12px' }} />
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Skeleton variant="rectangular" width={16} height={16} />
                    <Skeleton variant="text" width="70%" height={14} />
                </div>
            ))}
        </div>

        <div className="skeleton-canvas">
            <Skeleton variant="rectangular" width="60%" height="50%" style={{ margin: 'auto' }} />
        </div>

        <div className="skeleton-sidebar-right">
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <Skeleton variant="rectangular" height={32} style={{ flex: 1 }} />
                <Skeleton variant="rectangular" height={32} style={{ flex: 1 }} />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ marginBottom: '16px' }}>
                    <Skeleton variant="text" width="40%" height={12} style={{ marginBottom: '8px' }} />
                    <Skeleton variant="rectangular" height={32} />
                </div>
            ))}
        </div>
    </div>
);

export const DashboardGridSkeleton = ({ count = 6 }) => (
    <div className="skeleton-dashboard-grid">
        {Array.from({ length: count }).map((_, i) => (
            <ProjectCardSkeleton key={i} />
        ))}
    </div>
);

export const TableRowSkeleton = ({ columns = 4 }) => (
    <div className="skeleton-table-row">
        {Array.from({ length: columns }).map((_, i) => (
            <Skeleton
                key={i}
                variant="text"
                width={i === 0 ? '30%' : '20%'}
                height={14}
            />
        ))}
    </div>
);

export const ProfileHeaderSkeleton = () => (
    <div className="skeleton-profile-header">
        <Skeleton variant="circular" width={48} height={48} />
        <div style={{ flex: 1 }}>
            <Skeleton variant="text" width="40%" height={16} style={{ marginBottom: '6px' }} />
            <Skeleton variant="text" width="60%" height={12} />
        </div>
    </div>
);

export default Skeleton;
