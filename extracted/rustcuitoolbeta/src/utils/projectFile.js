/**
 * Project Export/Import as .rcui file
 * 
 * The .rcui format is an AES-256-GCM encrypted binary file.
 * Encryption/decryption is handled server-side using the RCUI_ENCRYPTION_KEY env var.
 * Binary layout: [12-byte IV][16-byte auth tag][encrypted JSON data]
 */

const RCUI_VERSION = 1;

// Resolve API base URL (production uses same origin, dev uses server port)
const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3000';

/**
 * Export a project to a downloadable encrypted .rcui file
 */
export const exportProject = async (project, accessToken) => {
    const rcuiData = {
        format: 'rcui',
        version: RCUI_VERSION,
        exportedAt: new Date().toISOString(),
        project: {
            name: project.name || 'Untitled',
            elements: project.elements || [],
            settings: {
                uiName: project.settings?.uiName || 'MyCustomUI',
                layer: project.settings?.layer || 'Overlay',
                chatCommand: project.settings?.chatCommand || '',
                consoleCommand: project.settings?.consoleCommand || '',
                permission: project.settings?.permission || '',
                backgroundUrl: project.settings?.backgroundUrl || '',
                tags: project.settings?.tags || [],
            }
        }
    };

    const headers = { 'Content-Type': 'application/json' };
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

    const response = await fetch(`${API_BASE}/api/rcui/encrypt`, {
        method: 'POST',
        headers,
        body: JSON.stringify(rcuiData),
    });

    if (!response.ok) throw new Error('Failed to encrypt project file');

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sanitizeFilename(project.name || 'project')}.rcui`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

/**
 * Import a .rcui file and return parsed project data
 * Returns a promise that resolves with the project data or rejects with an error
 */
export const importProject = (accessToken) => {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.rcui';

        input.onchange = async (e) => {
            const file = e.target.files?.[0];
            if (!file) {
                reject(new Error('No file selected'));
                return;
            }

            try {
                const arrayBuffer = await file.arrayBuffer();

                const headers = { 'Content-Type': 'application/octet-stream' };
                if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

                const response = await fetch(`${API_BASE}/api/rcui/decrypt`, {
                    method: 'POST',
                    headers,
                    body: arrayBuffer,
                });

                if (!response.ok) {
                    const err = await response.json().catch(() => ({}));
                    throw new Error(err.error || 'Failed to decrypt project file');
                }

                const data = await response.json();

                // Validate the file format
                if (data.format !== 'rcui') {
                    reject(new Error('Invalid file format. Expected a .rcui project file.'));
                    return;
                }

                if (!data.project || !Array.isArray(data.project.elements)) {
                    reject(new Error('Invalid project data. The file appears to be corrupted.'));
                    return;
                }

                // Regenerate element IDs to avoid conflicts
                const idMap = {};
                const newElements = data.project.elements.map((el, index) => {
                    const newId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5) + index;
                    idMap[el.id] = newId;
                    return { ...el, id: newId };
                });

                // Update parent references
                const remappedElements = newElements.map(el => ({
                    ...el,
                    parent: idMap[el.parent] || el.parent
                }));

                resolve({
                    name: data.project.name || 'Imported Project',
                    elements: remappedElements,
                    settings: data.project.settings || {},
                    originalVersion: data.version,
                    exportedAt: data.exportedAt,
                });
            } catch (err) {
                reject(new Error(err.message || 'Failed to decrypt file. Make sure it is a valid .rcui file.'));
            }
        };

        // Handle cancel (user closes the dialog without selecting)
        input.oncancel = () => reject(new Error('Import cancelled'));

        input.click();
    });
};

/**
 * Export project data from the editor context (elements + settings)
 */
export const exportFromEditor = async ({ projectName, elements, uiName, layer, chatCommand, consoleCommand, permission, backgroundUrl }) => {
    await exportProject({
        name: projectName,
        elements,
        settings: {
            uiName,
            layer,
            chatCommand,
            consoleCommand,
            permission,
            backgroundUrl,
        }
    });
};

function sanitizeFilename(name) {
    return name.replace(/[^a-z0-9_\-\s]/gi, '').replace(/\s+/g, '_').substring(0, 64) || 'project';
}
