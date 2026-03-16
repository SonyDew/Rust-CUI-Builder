import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

const GlassDropdown = ({ options, value, onChange, placeholder = "Select...", style = {} }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const dropdownRef = useRef(null);

    const normalizedOptions = Array.isArray(options)
        ? options.map(opt => typeof opt === 'object' ? opt : { label: opt, value: opt })
        : [];

    const selectedOption = normalizedOptions.find(opt => opt.value === value);
    const displayLabel = selectedOption ? selectedOption.label : placeholder;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && dropdownRef.current.contains(event.target)) {
                return;
            }
            if (event.target.closest('.glass-dropdown-menu')) {
                return;
            }
            setIsOpen(false);
        };

        if (isOpen) {
            if (dropdownRef.current) {
                const rect = dropdownRef.current.getBoundingClientRect();
                setCoords({
                    top: rect.bottom + window.scrollY + 4,
                    left: rect.left + window.scrollX,
                    width: rect.width
                });
            }

            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', () => setIsOpen(false), { capture: true });
            window.addEventListener('resize', () => setIsOpen(false));
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', () => setIsOpen(false));
            window.removeEventListener('resize', () => setIsOpen(false));
        };
    }, [isOpen]);

    return (
        <div ref={dropdownRef} style={{ position: 'relative', width: '100%', ...style }}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="glass-control"
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    padding: '6px 8px',
                    height: '28px',
                    width: '100%'
                }}
            >
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '11px' }}>
                    {displayLabel}
                </span>
                <ChevronDown size={12} color="#888" style={{ minWidth: '12px' }} />
            </div>

            {isOpen && createPortal(
                <div
                    className="glass-panel glass-dropdown-menu"
                    style={{
                        position: 'fixed',
                        top: coords.top - window.scrollY,
                        left: coords.left - window.scrollX,
                        width: coords.width,
                        maxHeight: '200px',
                        overflowY: 'auto',
                        zIndex: 100000,
                        padding: '4px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                        background: 'rgba(35, 35, 35, 0.95)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid #444',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                    }}
                >
                    {normalizedOptions.map((opt) => (
                        <div
                            key={opt.value}
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange(opt.value);
                                setIsOpen(false);
                            }}
                            className="dropdown-item"
                            style={{
                                padding: '6px 8px',
                                fontSize: '11px',
                                color: opt.value === value ? '#fff' : '#ccc',
                                cursor: 'pointer',
                                borderRadius: '4px',
                                background: opt.value === value ? 'rgba(13, 153, 255, 0.3)' : 'transparent',
                                transition: 'all 0.1s'
                            }}
                            onMouseEnter={(e) => {
                                if (opt.value !== value) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                                if (opt.value !== value) e.currentTarget.style.background = 'transparent';
                            }}
                        >
                            {opt.label}
                        </div>
                    ))}
                </div>,
                document.body
            )}
        </div>
    );
};

export default GlassDropdown;
