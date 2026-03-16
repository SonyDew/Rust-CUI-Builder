import React from 'react';

const getCssColor = (color, opacity) => {
    if (!color) return 'transparent';

    if (typeof color === 'string' && color.includes(' ') && !color.startsWith('rgb')) {
        const parts = color.split(' ').map(Number);
        if (parts.length >= 3) {
            const r = Math.floor(parts[0] * 255);
            const g = Math.floor(parts[1] * 255);
            const b = Math.floor(parts[2] * 255);
            const a = parts.length > 3 ? parts[3] : 1.0;
            const finalAlpha = a * (opacity / 100);
            return `rgba(${r}, ${g}, ${b}, ${finalAlpha})`;
        }
    }

    if (color.startsWith('#')) {
        let hex = color.replace('#', '');
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
    }
    if (color.startsWith('rgba')) {
        const parts = color.match(/[\d.]+/g);
        if (parts && parts.length >= 3) {
            const r = parts[0];
            const g = parts[1];
            const b = parts[2];
            let a = parts.length > 3 ? parseFloat(parts[3]) : 1.0;
            a = a * (opacity / 100);
            return `rgba(${r}, ${g}, ${b}, ${a})`;
        }
    }
    return color;
};

const parseAnchor = (anchorStr) => {
    if (!anchorStr) return { x: 0, y: 0 };
    const parts = anchorStr.split(' ');
    return { x: parseFloat(parts[0]), y: parseFloat(parts[1]) };
};

const pad = (value) => String(Math.max(0, Math.floor(value))).padStart(2, '0');

const formatCountdownPreview = (element) => {
    const totalSeconds = Math.max(0, Math.round((Number(element?.endTime) || 0) - (Number(element?.startTime) || 0)));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    switch (element?.timerFormat) {
        case 'SecondsHundreth':
            return `${pad(totalSeconds)}.00`;
        case 'MinutesSecondsHundreth':
            return `${pad(Math.floor(totalSeconds / 60))}:${pad(seconds)}.00`;
        case 'HoursMinutes':
            return `${pad(Math.floor(totalSeconds / 3600))}:${pad(minutes)}`;
        case 'HoursMinutesSeconds':
            return `${pad(Math.floor(totalSeconds / 3600))}:${pad(minutes)}:${pad(seconds)}`;
        case 'DaysHoursMinutes':
            return `${days}d ${pad(hours)}h ${pad(minutes)}m`;
        case 'DaysHoursMinutesSeconds':
            return `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
        case 'MinutesSeconds':
        default:
            return `${pad(Math.floor(totalSeconds / 60))}:${pad(seconds)}`;
    }
};

const ProjectPreview = ({ project, width = 300, selectedId = null, onElementPointerDown, onCanvasPointerDown }) => {
    const elements = project.elements || [];
    const settings = project.settings || {};

    const baseWidth = 1920;
    const baseHeight = 1080;

    const scale = width / baseWidth;
    const height = baseHeight * scale;

    const getStyle = (el) => {
        const anchorMin = parseAnchor(el.anchor.min);
        const anchorMax = parseAnchor(el.anchor.max);
        const offset = el.offset;
        const isSelected = el.id === selectedId;
        const isTextual = el.type === 'Text' || el.type === 'Button' || el.type === 'Countdown';

        const bgColor = (el.type === 'Panel' || el.type === 'Button' || el.type === 'InputField' || el.type === 'ScrollView' || el.type === 'Slot') ? getCssColor(el.color, el.opacity) : 'transparent';
        const txtColor = (el.type === 'Button' || el.type === 'InputField') ? (el.textColor || 'white') : (isTextual ? getCssColor(el.color, el.opacity) : 'white');

        let fontFamily = 'inherit';
        if (el.font) {
            switch(el.font) {
                case 'RobotoCondensed-Bold.ttf': fontFamily = "'Roboto Condensed', sans-serif"; break;
                case 'RobotoCondensed-Regular.ttf': fontFamily = "'Roboto Condensed', sans-serif"; break;
                case 'RobotoCondensed-Light.ttf': fontFamily = "'Roboto Condensed', sans-serif"; break;
                case 'PermanentMarker.ttf': fontFamily = "'Permanent Marker', cursive"; break;
                case 'DroidSansMono.ttf': fontFamily = "'Roboto Mono', monospace"; break;
                default: fontFamily = "'Roboto Condensed', sans-serif";
            }
        }
        const fontWeight = el.font && el.font.includes('Bold') ? '700' : (el.font && el.font.includes('Light') ? '300' : '400');

        const alignItems = el.align ? (el.align.includes('Upper') ? 'flex-start' : el.align.includes('Lower') ? 'flex-end' : 'center') : 'center';
        const justifyContent = el.align ? (el.align.includes('Left') ? 'flex-start' : el.align.includes('Right') ? 'flex-end' : 'center') : 'center';

        let backgroundImage = 'none';
        if (el.type === 'Image') {
            if (el.imageUrl) {
                backgroundImage = `url(${el.imageUrl})`;
            } else if (el.steamId) {
                backgroundImage = `url(https://avatars.akamai.steamstatic.com/${el.steamId}_full.jpg)`;
            } else if (el.png) {
                backgroundImage = 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)';
            }
        }

        let textShadow = 'none';
        let boxShadow = 'none';

        if (el.outline && el.outline.enabled) {
            const dist = el.outline.distance.split(' ').map(Number);
            const dx = dist[0] || 1;
            const dy = dist[1] || -1;
            const color = getCssColor(el.outline.color, 100);
            if (isTextual) {
                textShadow = `${dx}px ${-dy}px 0 ${color}`;
            } else {
                boxShadow = `${dx}px ${-dy}px 0 ${color}`;
            }
        }

        if (el.shadow && el.shadow.enabled) {
             const dist = el.shadow.distance.split(' ').map(Number);
             const dx = dist[0] || 1;
             const dy = dist[1] || -1;
             const color = getCssColor(el.shadow.color, 100);
             if (isTextual) {
                 const currentShadow = textShadow === 'none' ? '' : textShadow + ', ';
                 textShadow = currentShadow + `${dx}px ${-dy}px 2px ${color}`;
             } else {
                 const currentShadow = boxShadow === 'none' ? '' : boxShadow + ', ';
                 boxShadow = currentShadow + `${dx}px ${-dy}px 5px ${color}`;
             }
        }

        const border = el.type === 'Slot'
            ? '1px dashed rgba(214, 234, 255, 0.48)'
            : el.type === 'ScrollView'
                ? '1px solid rgba(214, 234, 255, 0.18)'
                : 'none';

        return {
            position: 'absolute',
            left: `calc(${anchorMin.x * 100}% + ${offset.minX}px)`,
            right: `calc(${(1 - anchorMax.x) * 100}% - ${offset.maxX}px)`,
            top: `calc(${(1 - anchorMax.y) * 100}% - ${offset.maxY}px)`,
            bottom: `calc(${anchorMin.y * 100}% + ${offset.minY}px)`,
            backgroundColor: bgColor,
            color: txtColor,
            transform: `rotate(${el.rotation || 0}deg)`,
            display: el.type === 'ScrollView' ? 'block' : 'flex',
            alignItems,
            justifyContent,
            fontSize: `${el.fontSize || 14}px`,
            fontFamily,
            fontWeight,
            backgroundImage,
            backgroundSize: el.png ? '10px 10px' : '100% 100%',
            backgroundPosition: 'center',
            backgroundRepeat: el.png ? 'repeat' : 'no-repeat',
            textAlign: el.align ? el.align.replace(/([A-Z])/g, ' $1').trim() : 'center',
            overflow: el.type === 'ScrollView' ? 'hidden' : 'visible',
            border,
            boxSizing: 'border-box',
            textShadow,
            boxShadow: isSelected
                ? `0 0 0 2px rgba(13, 153, 255, 0.95), 0 0 0 6px rgba(13, 153, 255, 0.18)${boxShadow !== 'none' ? `, ${boxShadow}` : ''}`
                : boxShadow,
            cursor: onElementPointerDown ? 'grab' : 'default',
            userSelect: 'none',
            touchAction: 'none',
        };
    };

    const renderRecursive = (el) => {
        const children = elements.filter(child => child.parent === el.id);
        const contentScaleX = Math.max(1, Number(el.contentScaleX) || 1);
        const contentScaleY = Math.max(1, Number(el.contentScaleY) || 1);
        return (
            <div
                key={el.id}
                style={getStyle(el)}
                onPointerDown={onElementPointerDown ? (event) => onElementPointerDown(el, event) : undefined}
            >
                {el.type === 'Text' && el.text}
                {el.type === 'Button' && (el.text || 'Button')}
                {el.type === 'InputField' && (el.text || 'Input...')}
                {el.type === 'Countdown' && (el.text?.trim() || formatCountdownPreview(el))}
                {el.type === 'Slot' && (
                    <div style={{ textAlign: 'center', color: '#d7ecff', fontSize: '12px', letterSpacing: '0.04em' }}>
                        <div style={{ fontSize: '22px', marginBottom: '4px' }}>[]</div>
                        <div>{el.filter || 'slot'}</div>
                    </div>
                )}
                {el.type === 'ScrollView' ? (
                    <>
                        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
                            <div style={{ position: 'relative', width: `${contentScaleX * 100}%`, height: `${contentScaleY * 100}%`, minWidth: '100%', minHeight: '100%' }}>
                                {children.length > 0 ? children.map(child => renderRecursive(child)) : (
                                    <div style={{ position: 'absolute', inset: '12px', border: '1px dashed rgba(214, 234, 255, 0.2)', borderRadius: '10px', display: 'grid', placeItems: 'center', color: '#8eb4d6', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                        Scroll content
                                    </div>
                                )}
                            </div>
                        </div>
                        {el.vertical !== false && <div style={{ position: 'absolute', top: '10px', right: '8px', width: '4px', height: '28%', borderRadius: '999px', background: 'rgba(214, 234, 255, 0.24)' }} />}
                        {el.horizontal && <div style={{ position: 'absolute', left: '10px', bottom: '8px', width: '28%', height: '4px', borderRadius: '999px', background: 'rgba(214, 234, 255, 0.24)' }} />}
                    </>
                ) : children.map(child => renderRecursive(child))}
            </div>
        );
    };


    const rootElements = elements.filter(el => !el.parent || ['Hud', 'Overlay', 'Under'].includes(el.parent));

    return (
        <div
            style={{ width: width, height: height, position: 'relative', overflow: 'hidden', background: '#1e1e1e', borderRadius: '4px' }}
            onPointerDown={onCanvasPointerDown}
        >
             <div style={{
                 width: baseWidth,
                 height: baseHeight,
                 position: 'absolute',
                 top: 0,
                 left: 0,
                 transform: `scale(${scale})`,
                 transformOrigin: 'top left',
                 backgroundImage: settings.backgroundUrl ? `url(${settings.backgroundUrl})` : 'none',
                 backgroundSize: 'cover',
                 backgroundPosition: 'center'
             }}>
                {rootElements.map(el => renderRecursive(el))}
             </div>
        </div>
    );
};

export default ProjectPreview;
