const ROOT_LAYERS = new Set(['Hud', 'Overlay', 'Under']);
const INDENT = '    ';
const DEFAULT_AUTHOR = 'SonyDev';
const DEFAULT_SETTINGS = {
    uiName: 'MyCustomUI',
    layer: 'Overlay',
    chatCommand: '',
    consoleCommand: '',
    permission: '',
    backgroundUrl: '',
};

const ALIGN_TO_TEXT_ANCHOR = {
    UpperLeft: 'TextAnchor.UpperLeft',
    UpperCenter: 'TextAnchor.UpperCenter',
    UpperRight: 'TextAnchor.UpperRight',
    MiddleLeft: 'TextAnchor.MiddleLeft',
    MiddleCenter: 'TextAnchor.MiddleCenter',
    MiddleRight: 'TextAnchor.MiddleRight',
    LowerLeft: 'TextAnchor.LowerLeft',
    LowerCenter: 'TextAnchor.LowerCenter',
    LowerRight: 'TextAnchor.LowerRight',
};

const sanitizeFilename = (name) =>
    (name || 'project')
        .replace(/[^a-z0-9_\-\s]/gi, '')
        .replace(/\s+/g, '_')
        .substring(0, 64) || 'project';

const normalizeProject = (project) => ({
    name: project?.name?.trim() || 'Untitled',
    elements: Array.isArray(project?.elements) ? project.elements : [],
    settings: { ...DEFAULT_SETTINGS, ...(project?.settings || {}) },
});

const normalizeCommand = (value, { stripLeadingSlash = false } = {}) => {
    if (!value) return '';
    const trimmed = String(value).trim();
    if (!trimmed) return '';
    const firstToken = trimmed.split(/\s+/)[0];
    const withoutSlash = stripLeadingSlash ? firstToken.replace(/^\/+/, '') : firstToken;
    return withoutSlash.replace(/[^a-zA-Z0-9_.:-]/g, '');
};

const deriveCloseCommand = (consoleCommand, className) => {
    if (!consoleCommand) return `${className.toLowerCase()}.close`;
    if (consoleCommand.endsWith('.open')) return `${consoleCommand.slice(0, -5)}.close`;
    if (consoleCommand.endsWith('_open')) return `${consoleCommand.slice(0, -5)}_close`;
    return `${consoleCommand}.close`;
};

const toPascalIdentifier = (value, fallback = 'RustCuiBuilderExport') => {
    const parts = String(value || '')
        .replace(/[^a-zA-Z0-9]+/g, ' ')
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    const raw = parts
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');

    const candidate = raw || fallback;
    return /^[A-Za-z_]/.test(candidate) ? candidate : `Rcui${candidate}`;
};

const toLocalIdentifier = (value, index, fallback = 'Element') => {
    const base = toPascalIdentifier(value, fallback);
    return `${base.charAt(0).toLowerCase()}${base.slice(1)}${index + 1}`;
};

const escapeCSharpString = (value) =>
    String(value ?? '')
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\r/g, '\\r')
        .replace(/\n/g, '\\n');

const toCSharpStringLiteral = (value) => `"${escapeCSharpString(value)}"`;

const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const formatFloatLiteral = (value, fallback = 0) => `${toNumber(value, fallback)}f`;

const formatCoordinate = (value, fallback = 0) => {
    const numeric = toNumber(value, fallback);
    if (Number.isInteger(numeric)) return String(numeric);
    return numeric.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
};

const formatColorComponent = (value) =>
    Math.max(0, Math.min(1, value)).toFixed(4).replace(/0+$/, '').replace(/\.$/, '') || '0';

const parseHexColor = (value) => {
    const hex = value.replace('#', '').trim();
    const normalized = hex.length === 3 ? hex.split('').map((char) => char + char).join('') : hex;
    if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;

    return {
        r: parseInt(normalized.slice(0, 2), 16) / 255,
        g: parseInt(normalized.slice(2, 4), 16) / 255,
        b: parseInt(normalized.slice(4, 6), 16) / 255,
        a: 1,
    };
};

const parseRgbaColor = (value) => {
    const parts = value.match(/[\d.]+/g);
    if (!parts || parts.length < 3) return null;

    const [r, g, b, a = 1] = parts.map(Number);
    if (![r, g, b, a].every(Number.isFinite)) return null;

    return {
        r: r > 1 ? r / 255 : r,
        g: g > 1 ? g / 255 : g,
        b: b > 1 ? b / 255 : b,
        a: a > 1 ? a / 255 : a,
    };
};

const parseNormalizedColor = (value) => {
    const parts = String(value)
        .trim()
        .split(/\s+/)
        .map(Number);

    if (parts.length < 3 || parts.length > 4 || !parts.every(Number.isFinite)) return null;
    const [r, g, b, a = 1] = parts;
    return { r, g, b, a };
};

const toRustColor = (value, opacity = 100, fallback = '1 1 1 1') => {
    if (!value) return fallback;

    const source = String(value).trim();
    if (!source) return fallback;

    let parsed = null;
    if (source.startsWith('#')) parsed = parseHexColor(source);
    else if (source.startsWith('rgba') || source.startsWith('rgb')) parsed = parseRgbaColor(source);
    else parsed = parseNormalizedColor(source);

    if (!parsed) return fallback;

    const alpha = Math.max(0, Math.min(1, parsed.a * (toNumber(opacity, 100) / 100)));
    return [
        formatColorComponent(parsed.r),
        formatColorComponent(parsed.g),
        formatColorComponent(parsed.b),
        formatColorComponent(alpha),
    ].join(' ');
};

const buildRectTransformBlock = (element) => {
    const anchor = element.anchor || {};
    const offset = element.offset || {};

    return [
        'new CuiRectTransformComponent',
        '{',
        `    AnchorMin = ${toCSharpStringLiteral(anchor.min || '0 0')},`,
        `    AnchorMax = ${toCSharpStringLiteral(anchor.max || '1 1')},`,
        `    OffsetMin = ${toCSharpStringLiteral(`${formatCoordinate(offset.minX, 0)} ${formatCoordinate(offset.minY, 0)}`)},`,
        `    OffsetMax = ${toCSharpStringLiteral(`${formatCoordinate(offset.maxX, 0)} ${formatCoordinate(offset.maxY, 0)}`)},`,
        `    Rotation = ${formatFloatLiteral(element.rotation, 0)},`,
        '}',
    ];
};

const buildImageComponentBlock = (color, extra = {}) => {
    const assignments = [`Color = ${toCSharpStringLiteral(color)}`];

    if (extra.png) assignments.push(`Png = ${toCSharpStringLiteral(extra.png)}`);
    if (extra.sprite) assignments.push(`Sprite = ${toCSharpStringLiteral(extra.sprite)}`);
    if (extra.material) assignments.push(`Material = ${toCSharpStringLiteral(extra.material)}`);

    return [
        'new CuiImageComponent',
        '{',
        ...assignments.map((line) => `    ${line},`),
        '}',
    ];
};

const buildRawImageComponentBlock = ({ url, steamId, png, color }) => {
    const assignments = [`Color = ${toCSharpStringLiteral(color)}`];

    if (url) assignments.push(`Url = ${toCSharpStringLiteral(url)}`);
    if (steamId) assignments.push(`SteamId = ${toCSharpStringLiteral(steamId)}`);
    if (png) assignments.push(`Png = ${toCSharpStringLiteral(png)}`);

    return [
        'new CuiRawImageComponent',
        '{',
        ...assignments.map((line) => `    ${line},`),
        '}',
    ];
};

const buildTextComponentBlock = (element, { textOverride, colorOverride } = {}) => [
    'new CuiTextComponent',
    '{',
    `    Text = ${toCSharpStringLiteral(textOverride ?? element.text ?? '')},`,
    `    FontSize = ${Math.max(1, Math.round(toNumber(element.fontSize, 14)))},`,
    `    Align = ${ALIGN_TO_TEXT_ANCHOR[element.align] || 'TextAnchor.MiddleCenter'},`,
    `    Color = ${toCSharpStringLiteral(colorOverride || toRustColor(element.color, element.opacity, '1 1 1 1'))},`,
    `    Font = ${toCSharpStringLiteral(element.font || 'RobotoCondensed-Bold.ttf')},`,
    '}',
];

const buildOutlineComponentBlock = (outline) => [
    'new CuiOutlineComponent',
    '{',
    `    Distance = ${toCSharpStringLiteral(outline?.distance || '1 1')},`,
    `    Color = ${toCSharpStringLiteral(toRustColor(outline?.color, 100, '0 0 0 1'))},`,
    '    UseGraphicAlpha = true,',
    '}',
];

const buildButtonComponentBlock = (element, closeUi) => {
    const assignments = [`Color = ${toCSharpStringLiteral(toRustColor(element.color, element.opacity, '0.2 0.2 0.2 1'))}`];
    const command = normalizeCommand(element.command);

    if (command) assignments.push(`Command = ${toCSharpStringLiteral(command)}`);
    if (closeUi) assignments.push('Close = UiRoot');

    return [
        'new CuiButtonComponent',
        '{',
        ...assignments.map((line) => `    ${line},`),
        '}',
    ];
};

const buildInputFieldComponentBlock = (element) => {
    const command = normalizeCommand(element.command);
    const readOnly = element.readOnly ?? !command;
    const charsLimit = Math.max(0, Math.round(toNumber(element.charsLimit, 0)));
    const assignments = [
        `Text = ${toCSharpStringLiteral(element.text || '')}`,
        `FontSize = ${Math.max(1, Math.round(toNumber(element.fontSize, 18)))}`,
        `Align = ${ALIGN_TO_TEXT_ANCHOR[element.align] || 'TextAnchor.MiddleLeft'}`,
        `Color = ${toCSharpStringLiteral(toRustColor(element.textColor || '#d7ecff', 100, '1 1 1 1'))}`,
        `Font = ${toCSharpStringLiteral(element.font || 'RobotoCondensed-Regular.ttf')}`,
        `CharsLimit = ${charsLimit}`,
        `ReadOnly = ${readOnly ? 'true' : 'false'}`,
        `NeedsKeyboard = ${readOnly ? 'false' : 'true'}`,
    ];

    if (command) assignments.push(`Command = ${toCSharpStringLiteral(command)}`);

    return [
        'new CuiInputFieldComponent',
        '{',
        ...assignments.map((line) => `    ${line},`),
        '}',
    ];
};

const pushBlock = (lines, block, indentLevel = 0) => {
    const padding = INDENT.repeat(indentLevel);
    block.forEach((line) => lines.push(`${padding}${line}`));
};

const pushComponentBlocks = (lines, componentBlocks, indentLevel = 0) => {
    componentBlocks.forEach((block) => {
        pushBlock(lines, block, indentLevel);
        lines[lines.length - 1] += ',';
    });
};

const createElementContainerBlock = ({ nameVar, parentRef, componentBlocks }) => {
    const lines = [
        `var ${nameVar} = $"{UiRoot}.${nameVar.toLowerCase()}";`,
        'container.Add(new CuiElement',
        '{',
        `    Name = ${nameVar},`,
        `    Parent = ${parentRef},`,
        '    Components =',
        '    {',
    ];

    pushComponentBlocks(lines, componentBlocks, 2);
    lines.push('    }');
    lines.push('});');
    return lines;
};

const isRemoteUrl = (value) => /^https?:\/\//i.test(String(value || '').trim());

const createElementEmitter = (context) => {
    const { notes } = context;

    return (element, index, parentRef) => {
        const nameVar = toLocalIdentifier(element.type, index);
        const componentBlocks = [];
        const color = toRustColor(element.color, element.opacity, '1 1 1 1');

        switch (element.type) {
            case 'Panel':
                componentBlocks.push(buildImageComponentBlock(color));
                componentBlocks.push(buildRectTransformBlock(element));
                if (element.outline?.enabled) componentBlocks.push(buildOutlineComponentBlock(element.outline));
                return createElementContainerBlock({ nameVar, parentRef, componentBlocks });

            case 'Text':
                componentBlocks.push(buildTextComponentBlock(element));
                componentBlocks.push(buildRectTransformBlock(element));
                if (element.outline?.enabled) componentBlocks.push(buildOutlineComponentBlock(element.outline));
                return createElementContainerBlock({ nameVar, parentRef, componentBlocks });

            case 'Button': {
                const closeUi = Boolean(element.closeUi);
                const hasBehavior = Boolean(normalizeCommand(element.command) || closeUi);
                if (hasBehavior) {
                    componentBlocks.push(buildButtonComponentBlock(element, closeUi));
                } else {
                    componentBlocks.push(buildImageComponentBlock(color));
                    notes.visualButtons += 1;
                }

                componentBlocks.push(
                    buildTextComponentBlock(element, {
                        colorOverride: toRustColor(element.textColor || '#ffffff', 100, '1 1 1 1'),
                    }),
                );
                componentBlocks.push(buildRectTransformBlock(element));
                if (element.outline?.enabled) componentBlocks.push(buildOutlineComponentBlock(element.outline));
                return createElementContainerBlock({ nameVar, parentRef, componentBlocks });
            }

            case 'Image': {
                if (element.imageUrl) {
                    if (isRemoteUrl(element.imageUrl)) {
                        componentBlocks.push(
                            buildRawImageComponentBlock({
                                url: element.imageUrl,
                                color,
                            }),
                        );
                    } else {
                        componentBlocks.push(buildImageComponentBlock(color));
                        notes.localOnlyImages += 1;
                    }
                } else if (element.steamId) {
                    componentBlocks.push(
                        buildRawImageComponentBlock({
                            steamId: String(element.steamId),
                            color,
                        }),
                    );
                } else if (element.png) {
                    componentBlocks.push(
                        buildImageComponentBlock(color, {
                            png: element.png,
                        }),
                    );
                } else {
                    componentBlocks.push(buildImageComponentBlock(color));
                }

                componentBlocks.push(buildRectTransformBlock(element));
                return createElementContainerBlock({ nameVar, parentRef, componentBlocks });
            }

            case 'InputField':
                componentBlocks.push(buildImageComponentBlock(color));
                componentBlocks.push(buildInputFieldComponentBlock(element));
                componentBlocks.push(buildRectTransformBlock(element));
                if (element.outline?.enabled) componentBlocks.push(buildOutlineComponentBlock(element.outline));
                if (!normalizeCommand(element.command)) notes.readOnlyInputs += 1;
                return createElementContainerBlock({ nameVar, parentRef, componentBlocks });

            default:
                notes.unsupported.push(`${element.type}#${index + 1}`);
                return [
                    `// Unsupported element type "${escapeCSharpString(element.type)}" was skipped during generation.`,
                    `var ${nameVar} = ${parentRef};`,
                ];
        }
    };
};

export const buildRustPluginCode = (project, options = {}) => {
    const normalized = normalizeProject(project);
    const author = options.author || DEFAULT_AUTHOR;
    const className = toPascalIdentifier(normalized.settings.uiName || normalized.name);
    const pluginTitle = normalized.name || normalized.settings.uiName || className;
    const uiMethodName = `Show${className}`;
    const permissionName = normalized.settings.permission?.trim() || '';
    const chatCommand = normalizeCommand(normalized.settings.chatCommand, { stripLeadingSlash: true });
    const consoleCommand = normalizeCommand(normalized.settings.consoleCommand);
    const layer = ROOT_LAYERS.has(normalized.settings.layer) ? normalized.settings.layer : 'Overlay';
    const closeConsoleCommand = deriveCloseCommand(consoleCommand, className);
    const notes = {
        visualButtons: 0,
        readOnlyInputs: 0,
        unsupported: [],
        localOnlyImages: 0,
    };
    const elementIds = new Set(normalized.elements.map((element) => element.id));
    const childrenByParent = new Map();
    const emitElement = createElementEmitter({ notes });

    normalized.elements.forEach((element, index) => {
        const parentId = element.parent && elementIds.has(element.parent) ? element.parent : '__root__';
        if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
        childrenByParent.get(parentId).push({ ...element, __index: index });
    });

    const hasCursor = normalized.elements.some((element) => element.type === 'Button' || element.type === 'InputField');
    const hasKeyboard = normalized.elements.some((element) => element.type === 'InputField');
    const backgroundUrl = isRemoteUrl(normalized.settings.backgroundUrl) ? normalized.settings.backgroundUrl.trim() : '';
    const lines = [
        'using Oxide.Game.Rust.Cui;',
        'using UnityEngine;',
        '',
        'namespace Oxide.Plugins',
        '{',
        `${INDENT}[Info(${toCSharpStringLiteral(pluginTitle)}, ${toCSharpStringLiteral(author)}, "1.0.0")]`,
        `${INDENT}[Description("Generated by Rust CUI Builder.")]`,
        `${INDENT}public class ${className} : RustPlugin`,
        `${INDENT}{`,
        `${INDENT.repeat(2)}private const string UiRoot = "${className}.Root";`,
    ];

    if (permissionName) {
        lines.push(`${INDENT.repeat(2)}private const string PermissionUse = ${toCSharpStringLiteral(permissionName)};`);
    }

    lines.push('');
    lines.push(`${INDENT.repeat(2)}private void Init()`);
    lines.push(`${INDENT.repeat(2)}{`);
    if (permissionName) {
        lines.push(`${INDENT.repeat(3)}permission.RegisterPermission(PermissionUse, this);`);
    } else {
        lines.push(`${INDENT.repeat(3)}// No plugin permission was configured in the builder.`);
    }
    lines.push(`${INDENT.repeat(2)}}`);
    lines.push('');
    lines.push(`${INDENT.repeat(2)}private void Unload()`);
    lines.push(`${INDENT.repeat(2)}{`);
    lines.push(`${INDENT.repeat(3)}foreach (var player in BasePlayer.activePlayerList)`);
    lines.push(`${INDENT.repeat(3)}{`);
    lines.push(`${INDENT.repeat(4)}DestroyUi(player);`);
    lines.push(`${INDENT.repeat(3)}}`);
    lines.push(`${INDENT.repeat(2)}}`);
    lines.push('');
    lines.push(`${INDENT.repeat(2)}private void DestroyUi(BasePlayer player)`);
    lines.push(`${INDENT.repeat(2)}{`);
    lines.push(`${INDENT.repeat(3)}if (player == null) return;`);
    lines.push(`${INDENT.repeat(3)}CuiHelper.DestroyUi(player, UiRoot);`);
    lines.push(`${INDENT.repeat(2)}}`);
    lines.push('');
    lines.push(`${INDENT.repeat(2)}private bool CanOpenUi(BasePlayer player)`);
    lines.push(`${INDENT.repeat(2)}{`);
    lines.push(`${INDENT.repeat(3)}if (player == null) return false;`);
    if (permissionName) {
        lines.push(`${INDENT.repeat(3)}return permission.UserHasPermission(player.UserIDString, PermissionUse);`);
    } else {
        lines.push(`${INDENT.repeat(3)}return true;`);
    }
    lines.push(`${INDENT.repeat(2)}}`);
    lines.push('');

    if (chatCommand) {
        lines.push(`${INDENT.repeat(2)}[ChatCommand("${chatCommand}")]`);
        lines.push(`${INDENT.repeat(2)}private void ${className}ChatCommand(BasePlayer player, string command, string[] args)`);
        lines.push(`${INDENT.repeat(2)}{`);
        lines.push(`${INDENT.repeat(3)}if (!CanOpenUi(player)) return;`);
        lines.push(`${INDENT.repeat(3)}${uiMethodName}(player);`);
        lines.push(`${INDENT.repeat(2)}}`);
        lines.push('');
    }

    if (consoleCommand) {
        lines.push(`${INDENT.repeat(2)}[ConsoleCommand("${consoleCommand}")]`);
        lines.push(`${INDENT.repeat(2)}private void ${className}ConsoleCommand(ConsoleSystem.Arg arg)`);
        lines.push(`${INDENT.repeat(2)}{`);
        lines.push(`${INDENT.repeat(3)}var player = arg.Player();`);
        lines.push(`${INDENT.repeat(3)}if (!CanOpenUi(player)) return;`);
        lines.push(`${INDENT.repeat(3)}${uiMethodName}(player);`);
        lines.push(`${INDENT.repeat(2)}}`);
        lines.push('');
    }

    lines.push(`${INDENT.repeat(2)}[ConsoleCommand("${closeConsoleCommand}")]`);
    lines.push(`${INDENT.repeat(2)}private void ${className}CloseCommand(ConsoleSystem.Arg arg)`);
    lines.push(`${INDENT.repeat(2)}{`);
    lines.push(`${INDENT.repeat(3)}DestroyUi(arg.Player());`);
    lines.push(`${INDENT.repeat(2)}}`);
    lines.push('');
    lines.push(`${INDENT.repeat(2)}private void ${uiMethodName}(BasePlayer player)`);
    lines.push(`${INDENT.repeat(2)}{`);
    lines.push(`${INDENT.repeat(3)}if (!CanOpenUi(player)) return;`);
    lines.push('');
    lines.push(`${INDENT.repeat(3)}DestroyUi(player);`);
    lines.push('');
    lines.push(`${INDENT.repeat(3)}var container = new CuiElementContainer();`);
    lines.push(`${INDENT.repeat(3)}container.Add(new CuiElement`);
    lines.push(`${INDENT.repeat(3)}{`);
    lines.push(`${INDENT.repeat(4)}Name = UiRoot,`);
    lines.push(`${INDENT.repeat(4)}Parent = "${layer}",`);
    lines.push(`${INDENT.repeat(4)}Components =`);
    lines.push(`${INDENT.repeat(4)}{`);

    const rootComponents = [
        buildImageComponentBlock('0 0 0 0'),
        buildRectTransformBlock({ anchor: { min: '0 0', max: '1 1' }, offset: {}, rotation: 0 }),
    ];

    if (hasCursor) rootComponents.push(['new CuiNeedsCursorComponent()', '']);
    if (hasKeyboard) rootComponents.push(['new CuiNeedsKeyboardComponent()', '']);

    rootComponents.forEach((block) => {
        const normalizedBlock = block.filter(Boolean);
        pushBlock(lines, normalizedBlock, 5);
        lines[lines.length - 1] += ',';
    });

    lines.push(`${INDENT.repeat(4)}}`);
    lines.push(`${INDENT.repeat(3)}});`);
    lines.push('');

    if (backgroundUrl) {
        pushBlock(lines, createElementContainerBlock({
            nameVar: 'backgroundImage',
            parentRef: 'UiRoot',
            componentBlocks: [
                buildRawImageComponentBlock({ url: backgroundUrl, color: '1 1 1 1' }),
                buildRectTransformBlock({ anchor: { min: '0 0', max: '1 1' }, offset: {}, rotation: 0 }),
            ],
        }), 3);
        lines.push('');
    }

    const emitChildren = (parentId, parentRef) => {
        const children = childrenByParent.get(parentId) || [];
        children
            .sort((left, right) => left.__index - right.__index)
            .forEach((child) => {
                pushBlock(lines, emitElement(child, child.__index, parentRef), 3);
                lines.push('');
                emitChildren(child.id, `${child.type.toLowerCase()}${child.__index + 1}`);
            });
    };

    emitChildren('__root__', 'UiRoot');

    lines.push(`${INDENT.repeat(3)}CuiHelper.AddUi(player, container);`);
    lines.push(`${INDENT.repeat(2)}}`);
    lines.push('');
    lines.push(`${INDENT.repeat(2)}// Call ${uiMethodName}(player); from your own hooks if you prefer to open this UI manually.`);
    if (!chatCommand && !consoleCommand) {
        lines.push(`${INDENT.repeat(2)}// No open command was generated because the project settings did not include a chat or console command.`);
    }
    if (notes.visualButtons > 0) {
        lines.push(`${INDENT.repeat(2)}// ${notes.visualButtons} button element(s) were exported as visual-only blocks because no console command or close action was configured.`);
    }
    if (notes.readOnlyInputs > 0) {
        lines.push(`${INDENT.repeat(2)}// ${notes.readOnlyInputs} input field(s) were exported as read-only because no submit command was configured.`);
    }
    if (notes.localOnlyImages > 0) {
        lines.push(`${INDENT.repeat(2)}// ${notes.localOnlyImages} image element(s) referenced a non-http URL and were exported as colored placeholders.`);
    }
    if (notes.unsupported.length > 0) {
        lines.push(`${INDENT.repeat(2)}// Unsupported elements skipped: ${notes.unsupported.join(', ')}.`);
    }
    lines.push(`${INDENT}}`);
    lines.push('}');

    return lines.join('\n');
};

export const exportCSharpProject = (project, options = {}) => {
    const normalized = normalizeProject(project);
    const code = buildRustPluginCode(normalized, options);
    const fileBase = toPascalIdentifier(normalized.settings.uiName || normalized.name || 'RustCuiBuilderExport');
    const blob = new Blob([code], { type: 'text/x-csharp;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${sanitizeFilename(fileBase)}.cs`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    return code;
};

export const exportCSharpFromEditor = (project) => exportCSharpProject(project);
