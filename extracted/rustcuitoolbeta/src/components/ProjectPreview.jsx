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

const ProjectPreview = ({ project, width = 300 }) => {
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

        const bgColor = (el.type === 'Panel' || el.type === 'Button' || el.type === 'InputField' || el.type === 'ScrollView') ? getCssColor(el.color, el.opacity) : 'transparent';
        const txtColor = (el.type === 'Button' || el.type === 'InputField') ? (el.textColor || 'white') : (el.type === 'Text' ? getCssColor(el.color, el.opacity) : 'white');

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
            if (el.type === 'Text' || el.type === 'Button') {
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
             if (el.type === 'Text' || el.type === 'Button') {
                 const currentShadow = textShadow === 'none' ? '' : textShadow + ', ';
                 textShadow = currentShadow + `${dx}px ${-dy}px 2px ${color}`;
             } else {
                 const currentShadow = boxShadow === 'none' ? '' : boxShadow + ', ';
                 boxShadow = currentShadow + `${dx}px ${-dy}px 5px ${color}`;
             }
        }

        return {
            position: 'absolute',
            left: `calc(${anchorMin.x * 100}% + ${offset.minX}px)`,
            right: `calc(${(1 - anchorMax.x) * 100}% - ${offset.maxX}px)`,
            top: `calc(${(1 - anchorMax.y) * 100}% - ${offset.maxY}px)`,
            bottom: `calc(${anchorMin.y * 100}% + ${offset.minY}px)`,
            backgroundColor: bgColor,
            color: txtColor,
            transform: `rotate(${el.rotation || 0}deg)`,
            display: 'flex',
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
            border: 'none',
            boxSizing: 'border-box',
            textShadow,
            boxShadow
        };
    };


    const renderElement = (el) => {
        return (
            <div key={el.id} style={getStyle(el)}>
                {el.type === 'Text' && el.text}
                {el.type === 'Button' && (el.text || 'Button')}
                {el.type === 'InputField' && (
                    <div style={{ width: '100%', height: '100%', padding: '5px', overflow: 'hidden' }}>
                        {el.text || 'Input...'}
                    </div>
                )}
                {el.type === 'ItemIcon' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: 'rgba(0,0,0,0.2)' }}>
                        <span style={{ fontSize: '24px' }}>📦</span>
                    </div>
                )}
                {el.type === 'Countdown' && (
                    <div style={{ width: '100%', height: '100%', background: '#444', position: 'relative' }}>
                        <div style={{ width: '60%', height: '100%', background: '#888' }}></div>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                            {el.endTime - el.startTime}s
                        </div>
                    </div>
                )}
                {el.type === 'ScrollView' && (
                    <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '10px', background: 'rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <div style={{ width: '4px', height: '20%', background: 'rgba(255,255,255,0.3)', borderRadius: '2px' }}></div>
                    </div>
                )}
            </div>
        );
    };


    const renderRecursive = (el) => {
        const children = elements.filter(child => child.parent === el.id);
        return (
            <div key={el.id} style={getStyle(el)}>
                {el.type === 'Text' && el.text}
                {el.type === 'Button' && (el.text || 'Button')}
                {el.type === 'InputField' && (el.text || 'Input...')}
                {el.type === 'ItemIcon' && <span style={{ fontSize: '24px' }}>📦</span>}
                {el.type === 'Countdown' && <div style={{width: '100%', height: '100%', background: '#888'}}></div>}

                {children.map(child => renderRecursive(child))}
            </div>
        );
    };


    const rootElements = elements.filter(el => !el.parent || ['Hud', 'Overlay', 'Under'].includes(el.parent));

    return (
        <div style={{ width: width, height: height, position: 'relative', overflow: 'hidden', background: '#1e1e1e', borderRadius: '4px' }}>
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
