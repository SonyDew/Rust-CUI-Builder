import React, { startTransition, useDeferredValue, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Copy, Download, FileCode, PlusSquare, Save, Trash2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { usePlan } from '../context/PlanContext';
import { useToast } from '../context/ToastContext';
import ProjectPreview from './ProjectPreview';
import { exportFromEditor } from '../utils/projectFile';
import { exportCSharpFromEditor } from '../utils/csharpExport';
import { isOnline, onConnectivityChange, processOfflineQueue, queueOfflineSave } from '../utils/offline';
import { DEFAULT_PROJECT_BACKGROUND } from '../utils/brandAssets';
import './Editor.css';

const ROOT_LAYERS = ['Hud', 'Overlay', 'Under'];
const LOCAL_DRAFT_PREFIX = 'rcui-local-project:';
const ALIGN_OPTIONS = ['UpperLeft', 'UpperCenter', 'UpperRight', 'MiddleLeft', 'MiddleCenter', 'MiddleRight', 'LowerLeft', 'LowerCenter', 'LowerRight'];
const FONT_OPTIONS = ['RobotoCondensed-Regular.ttf', 'RobotoCondensed-Bold.ttf', 'PermanentMarker.ttf', 'DroidSansMono.ttf'];
const DEFAULT_SETTINGS = { uiName: 'MyCustomUI', layer: 'Overlay', chatCommand: '', consoleCommand: '', permission: '', backgroundUrl: DEFAULT_PROJECT_BACKGROUND };
const PREVIEW_BASE_WIDTH = 1920;
const PREVIEW_BASE_HEIGHT = 1080;
const PRESETS = {
  Panel: { color: '0.10 0.16 0.22 0.92', opacity: 100, anchor: { min: '0.32 0.30', max: '0.68 0.66' }, offset: { minX: 0, minY: 0, maxX: 0, maxY: 0 }, rotation: 0, align: 'MiddleCenter' },
  Text: { text: 'Header text', color: '#f5fbff', opacity: 100, font: 'RobotoCondensed-Bold.ttf', fontSize: 34, anchor: { min: '0.38 0.54', max: '0.62 0.60' }, offset: { minX: 0, minY: 0, maxX: 0, maxY: 0 }, rotation: 0, align: 'MiddleCenter' },
  Button: { text: 'Click me', color: '0.05 0.35 0.68 0.96', opacity: 100, textColor: '#ffffff', font: 'RobotoCondensed-Bold.ttf', fontSize: 24, command: '', closeUi: false, anchor: { min: '0.40 0.38', max: '0.60 0.46' }, offset: { minX: 0, minY: 0, maxX: 0, maxY: 0 }, rotation: 0, align: 'MiddleCenter' },
  Image: { imageUrl: '', color: '#ffffff', opacity: 100, anchor: { min: '0.08 0.14', max: '0.24 0.42' }, offset: { minX: 0, minY: 0, maxX: 0, maxY: 0 }, rotation: 0, align: 'MiddleCenter' },
  InputField: { text: 'Input...', color: '0.12 0.16 0.22 0.95', opacity: 100, textColor: '#d7ecff', font: 'RobotoCondensed-Regular.ttf', fontSize: 22, command: '', charsLimit: 0, anchor: { min: '0.34 0.24', max: '0.66 0.31' }, offset: { minX: 0, minY: 0, maxX: 0, maxY: 0 }, rotation: 0, align: 'MiddleLeft' }
};

const localDraftKey = (projectId) => `${LOCAL_DRAFT_PREFIX}${projectId}`;
const createId = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const parseAnchor = (value = '0 0') => {
  const [x = 0, y = 0] = value.split(' ').map(Number);
  return { x: Number.isFinite(x) ? x : 0, y: Number.isFinite(y) ? y : 0 };
};
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const roundTo = (value, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};
const formatAnchor = ({ x, y }) => `${roundTo(x, 4)} ${roundTo(y, 4)}`;
const toNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const createElement = (type) => ({ id: createId(), type, parent: 'Overlay', ...PRESETS[type] });
const flattenElements = (elements, parent = null, depth = 0, visited = new Set()) => {
  const children = elements.filter((element) => parent === null ? !element.parent || ROOT_LAYERS.includes(element.parent) : element.parent === parent);
  return children.flatMap((element) => {
    if (visited.has(element.id)) return [];
    visited.add(element.id);
    return [{ element, depth }, ...flattenElements(elements, element.id, depth + 1, visited)];
  });
};

const Field = ({ label, children, full = false }) => (
  <div className={full ? 'editor-field--full' : 'editor-field'}>
    <label>{label}</label>
    {children}
  </div>
);

const Editor = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { canAddElement, limits } = usePlan();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState('Untitled');
  const [elements, setElements] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [selectedId, setSelectedId] = useState(null);
  const [layerSearch, setLayerSearch] = useState('');
  const [previewWidth, setPreviewWidth] = useState(920);
  const [saveState, setSaveState] = useState('saved');
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const deferredLayerSearch = useDeferredValue(layerSearch);
  const skipAutosaveRef = useRef(true);
  const dragStateRef = useRef(null);
  const selectedElement = elements.find((element) => element.id === selectedId) || null;
  const visibleLayers = flattenElements(elements).filter(({ element }) => `${element.type} ${element.text || ''}`.toLowerCase().includes(deferredLayerSearch.toLowerCase()));

  useEffect(() => { document.title = `${projectName || 'Untitled'} · Rust CUI Builder`; }, [projectName]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const localRaw = localStorage.getItem(localDraftKey(projectId));
      try {
        const { data, error } = await supabase.from('projects').select('*').eq('id', projectId).single();
        if (error || !data) throw error || new Error('Project not found');
        skipAutosaveRef.current = true;
        setProjectName(data.name || 'Untitled');
        setElements(Array.isArray(data.elements) ? data.elements : []);
        setSettings({ ...DEFAULT_SETTINGS, ...(data.settings || {}) });
        setSelectedId(data.elements?.[0]?.id || null);
        setLastSavedAt(data.last_modified || null);
      } catch (error) {
        if (localRaw) {
          const draft = JSON.parse(localRaw);
          skipAutosaveRef.current = true;
          setProjectName(draft.name || 'Untitled');
          setElements(Array.isArray(draft.elements) ? draft.elements : []);
          setSettings({ ...DEFAULT_SETTINGS, ...(draft.settings || {}) });
          setSelectedId(draft.elements?.[0]?.id || null);
          setSaveState('local');
          setErrorMessage('Loaded local draft because cloud data is unavailable.');
        } else {
          setErrorMessage(error?.message || 'Failed to load project');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [projectId]);

  useEffect(() => {
    if (loading) return undefined;
    if (skipAutosaveRef.current) {
      skipAutosaveRef.current = false;
      return undefined;
    }
    setSaveState('dirty');
    const timeoutId = window.setTimeout(() => { void persistProject(false); }, 900);
    return () => window.clearTimeout(timeoutId);
  }, [elements, projectName, settings, loading]);

  useEffect(() => {
    const unsubscribe = onConnectivityChange((online) => {
      if (online) {
        showToast('Back online. Syncing queued changes...', 'info', 2200);
        void processOfflineQueue(async (queuedProjectId, payload) => { await saveRemotePayload(queuedProjectId, payload); });
      } else {
        showToast('Offline mode enabled. Changes will queue locally.', 'warning', 2200);
      }
    });
    return unsubscribe;
  }, [showToast]);

  useEffect(() => {
    const handlePointerMove = (event) => {
      const dragState = dragStateRef.current;
      if (!dragState) return;

      const previewScale = previewWidth / PREVIEW_BASE_WIDTH;
      if (!previewScale) return;

      const deltaX = (event.clientX - dragState.lastClientX) / previewScale;
      const deltaY = (event.clientY - dragState.lastClientY) / previewScale;
      if (!deltaX && !deltaY) return;

      dragStateRef.current = {
        ...dragState,
        lastClientX: event.clientX,
        lastClientY: event.clientY,
      };

      setElements((previous) => previous.map((element) => {
        if (element.id !== dragState.elementId) return element;
        const anchorMin = parseAnchor(element.anchor?.min);
        const anchorMax = parseAnchor(element.anchor?.max);
        const offset = element.offset || {};
        const currentLeft = anchorMin.x * PREVIEW_BASE_WIDTH + toNumber(offset.minX, 0);
        const currentRight = anchorMax.x * PREVIEW_BASE_WIDTH + toNumber(offset.maxX, 0);
        const currentBottom = anchorMin.y * PREVIEW_BASE_HEIGHT + toNumber(offset.minY, 0);
        const currentTop = anchorMax.y * PREVIEW_BASE_HEIGHT + toNumber(offset.maxY, 0);
        const clampedDeltaX = clamp(deltaX, -currentLeft, PREVIEW_BASE_WIDTH - currentRight);
        const clampedDeltaY = clamp(-deltaY, -currentBottom, PREVIEW_BASE_HEIGHT - currentTop);
        return {
          ...element,
          offset: {
            ...offset,
            minX: roundTo(toNumber(offset.minX, 0) + clampedDeltaX),
            maxX: roundTo(toNumber(offset.maxX, 0) + clampedDeltaX),
            minY: roundTo(toNumber(offset.minY, 0) + clampedDeltaY),
            maxY: roundTo(toNumber(offset.maxY, 0) + clampedDeltaY),
          },
        };
      }));
    };

    const stopDragging = () => {
      dragStateRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopDragging);
    window.addEventListener('pointercancel', stopDragging);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopDragging);
      window.removeEventListener('pointercancel', stopDragging);
    };
  }, [previewWidth]);

  const buildPayload = () => ({ name: projectName?.trim() || 'Untitled', elements, settings: { ...DEFAULT_SETTINGS, ...settings }, last_modified: new Date().toISOString() });
  const saveRemotePayload = async (targetProjectId, payload) => {
    const { error } = await supabase.from('projects').update(payload).eq('id', targetProjectId);
    if (error) throw error;
  };
  const persistProject = async (manual) => {
    const payload = buildPayload();
    localStorage.setItem(localDraftKey(projectId), JSON.stringify(payload));
    if (!isOnline()) {
      queueOfflineSave(projectId, payload);
      setSaveState('queued');
      if (manual) showToast('Offline. Change queued for sync.', 'warning');
      return;
    }
    try {
      setSaveState('saving');
      await saveRemotePayload(projectId, payload);
      localStorage.removeItem(localDraftKey(projectId));
      setLastSavedAt(payload.last_modified);
      setSaveState('saved');
      if (manual) showToast('Project saved', 'success');
    } catch (error) {
      if (error?.code === 'CONFIG_MISSING') {
        setSaveState('local');
        if (manual) showToast('Saved locally. Add Supabase credentials to enable cloud sync.', 'info');
        return;
      }
      queueOfflineSave(projectId, payload);
      setSaveState('queued');
      if (manual) showToast('Remote save failed. Latest state was queued locally.', 'warning');
    }
  };

  const addElement = (type) => {
    if (!canAddElement(elements.length)) {
      showToast(`Plan limit reached. Max elements: ${limits.maxElementsPerProject}.`, 'warning');
      return;
    }
    const next = createElement(type);
    startTransition(() => {
      setElements((previous) => [...previous, next]);
      setSelectedId(next.id);
    });
  };
  const duplicateSelected = () => {
    if (!selectedElement || !canAddElement(elements.length)) return;
    const duplicate = { ...selectedElement, id: createId(), anchor: { ...selectedElement.anchor }, offset: { ...selectedElement.offset } };
    startTransition(() => {
      setElements((previous) => [...previous, duplicate]);
      setSelectedId(duplicate.id);
    });
  };
  const deleteSelected = () => {
    if (!selectedElement) return;
    const doomed = new Set([selectedElement.id]);
    let changed = true;
    while (changed) {
      changed = false;
      elements.forEach((element) => {
        if (doomed.has(element.parent)) {
          doomed.add(element.id);
          changed = true;
        }
      });
    }
    startTransition(() => {
      setElements((previous) => previous.filter((element) => !doomed.has(element.id)));
      setSelectedId(null);
    });
  };
  const patchSelected = (updater) => selectedElement && setElements((previous) => previous.map((element) => element.id === selectedElement.id ? updater(element) : element));
  const updateAnchorValue = (edge, axis, value) => patchSelected((element) => {
    const next = parseAnchor(element.anchor?.[edge]);
    const oppositeEdge = edge === 'min' ? 'max' : 'min';
    const opposite = parseAnchor(element.anchor?.[oppositeEdge]);
    const normalized = clamp(toNumber(value, next[axis]), 0, 1);
    next[axis] = edge === 'min'
      ? Math.min(normalized, opposite[axis])
      : Math.max(normalized, opposite[axis]);
    return { ...element, anchor: { ...element.anchor, [edge]: formatAnchor(next) } };
  });
  const updateOffsetValue = (key, value) => patchSelected((element) => ({ ...element, offset: { ...element.offset, [key]: roundTo(toNumber(value, element.offset?.[key] || 0)) } }));
  const saveLabel = saveState === 'saving' ? 'Saving...' : saveState === 'queued' ? 'Queued offline' : saveState === 'local' ? 'Local draft' : saveState === 'dirty' ? 'Unsaved changes' : lastSavedAt ? `Saved ${new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Saved';
  const handlePreviewPointerDown = (element, event) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedId(element.id);
    dragStateRef.current = {
      elementId: element.id,
      lastClientX: event.clientX,
      lastClientY: event.clientY,
    };
  };
  const handleCanvasPointerDown = () => {
    dragStateRef.current = null;
    setSelectedId(null);
  };
  const exportProject = { name: projectName?.trim() || 'Untitled', elements, settings: { ...DEFAULT_SETTINGS, ...settings } };
  const handleExportRcui = async () => {
    try {
      await exportFromEditor({
        projectName,
        elements,
        uiName: settings.uiName,
        layer: settings.layer,
        chatCommand: settings.chatCommand,
        consoleCommand: settings.consoleCommand,
        permission: settings.permission,
        backgroundUrl: settings.backgroundUrl,
      });
      showToast('Exported .rcui backup', 'success');
    } catch (error) {
      showToast(error?.message || 'Failed to export .rcui project file', 'error');
    }
  };
  const handleExportCSharp = () => {
    try {
      exportCSharpFromEditor(exportProject);
      showToast('Exported C# plugin starter code', 'success');
    } catch (error) {
      showToast(error?.message || 'Failed to export C# plugin code', 'error');
    }
  };

  if (loading) return <div className="route-loader">Loading editor...</div>;
  if (errorMessage && !elements.length) return <div className="route-loader">{errorMessage}</div>;

  return (
    <div className="editor-shell">
      <aside className="editor-sidebar">
        <div className="editor-panel">
          <div className="editor-panel-header">
            <div>
              <h2>Project</h2>
              <div className="editor-footer-note">{settings.uiName} on {settings.layer}</div>
            </div>
            <button className="glass-btn" onClick={() => navigate('/dashboard')}><ArrowLeft size={16} style={{ marginRight: '8px' }} />Exit</button>
          </div>
          <div className="editor-micro-grid">
            <div className="editor-stat"><span>Elements</span><strong>{elements.length}</strong></div>
            <div className="editor-stat"><span>Sync</span><strong>{saveState === 'local' ? 'Local' : 'Cloud'}</strong></div>
          </div>
          {errorMessage && <div className="editor-footer-note">{errorMessage}</div>}
        </div>

        <div className="editor-panel">
          <div className="editor-panel-header"><div><h3>Element library</h3><div className="editor-footer-note">Add common Rust CUI blocks</div></div></div>
          <div className="editor-library">
            {Object.keys(PRESETS).map((type) => <button key={type} onClick={() => addElement(type)}><PlusSquare size={16} style={{ marginRight: '8px' }} />{type}</button>)}
          </div>
        </div>

        <div className="editor-panel">
          <div className="editor-panel-header"><div><h3>Layers</h3><div className="editor-footer-note">Choose an element to edit</div></div></div>
          <input value={layerSearch} onChange={(event) => setLayerSearch(event.target.value)} placeholder="Filter layers" className="editor-project-name" style={{ maxWidth: '100%' }} />
          <div className="editor-layer-list">
            {visibleLayers.length === 0 ? <div className="editor-empty">No matching elements yet.</div> : visibleLayers.map(({ element, depth }) => (
              <button key={element.id} className={`editor-layer ${selectedId === element.id ? 'is-selected' : ''}`} onClick={() => setSelectedId(element.id)} style={{ paddingLeft: `${14 + depth * 18}px` }}>
                <div style={{ fontWeight: 600 }}>{element.type}</div>
                <div style={{ fontSize: '0.78rem', opacity: 0.75 }}>{element.text || element.imageUrl || element.id.slice(0, 8)}</div>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <main className="editor-main">
        <div className="editor-toolbar">
          <div className="editor-toolbar-group">
            <input className="editor-project-name" value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="Project name" />
            <span className="editor-status">{saveLabel}</span>
          </div>
          <div className="editor-toolbar-group">
            <button className="glass-btn" onClick={() => void persistProject(true)}><Save size={16} style={{ marginRight: '8px' }} />Save</button>
            <button className="glass-btn" onClick={duplicateSelected} disabled={!selectedElement}><Copy size={16} style={{ marginRight: '8px' }} />Duplicate</button>
            <button className="glass-btn" onClick={handleExportCSharp}><FileCode size={16} style={{ marginRight: '8px' }} />Export C#</button>
            <button className="glass-btn" onClick={() => void handleExportRcui()}><Download size={16} style={{ marginRight: '8px' }} />Export .rcui</button>
          </div>
        </div>
        <div className="editor-canvas-wrap">
          <div className="editor-preview-frame">
            <div className="editor-panel" style={{ marginBottom: '18px' }}>
              <div className="editor-panel-header">
                <div><h3>Preview canvas</h3><div className="editor-footer-note">Live preview of the current project.</div></div>
                <div className="editor-toolbar-group"><span className="editor-footer-note">{previewWidth}px</span><input type="range" min="620" max="1080" step="20" value={previewWidth} onChange={(event) => setPreviewWidth(toNumber(event.target.value, 920))} /></div>
              </div>
            </div>
            <ProjectPreview
              project={{ name: projectName, elements, settings }}
              width={previewWidth}
              selectedId={selectedId}
              onElementPointerDown={handlePreviewPointerDown}
              onCanvasPointerDown={handleCanvasPointerDown}
            />
          </div>
        </div>
      </main>

      <aside className="editor-sidebar editor-sidebar--right">
        <div className="editor-panel">
          <div className="editor-panel-header"><div><h3>Project settings</h3><div className="editor-footer-note">Export-facing metadata</div></div></div>
          <div className="editor-field-grid">
            <Field label="UI Name"><input value={settings.uiName} onChange={(event) => setSettings((previous) => ({ ...previous, uiName: event.target.value }))} /></Field>
            <Field label="Layer"><select value={settings.layer} onChange={(event) => setSettings((previous) => ({ ...previous, layer: event.target.value }))}>{ROOT_LAYERS.map((layer) => <option key={layer} value={layer}>{layer}</option>)}</select></Field>
            <Field label="Chat Command"><input value={settings.chatCommand} onChange={(event) => setSettings((previous) => ({ ...previous, chatCommand: event.target.value }))} /></Field>
            <Field label="Console Command"><input value={settings.consoleCommand} onChange={(event) => setSettings((previous) => ({ ...previous, consoleCommand: event.target.value }))} /></Field>
            <Field label="Permission" full><input value={settings.permission} onChange={(event) => setSettings((previous) => ({ ...previous, permission: event.target.value }))} /></Field>
            <Field label="Background URL" full><input value={settings.backgroundUrl} onChange={(event) => setSettings((previous) => ({ ...previous, backgroundUrl: event.target.value }))} /></Field>
          </div>
        </div>

        <div className="editor-panel">
          <div className="editor-panel-header">
            <div><h3>Selected element</h3><div className="editor-footer-note">Layout and visual settings</div></div>
            {selectedElement && <button className="glass-btn" onClick={deleteSelected}><Trash2 size={16} style={{ marginRight: '8px' }} />Delete</button>}
          </div>
          {!selectedElement ? <div className="editor-empty">Add an element or choose one from the layer list.</div> : (
            <div className="editor-field-grid">
              <Field label="Parent"><select value={selectedElement.parent || 'Overlay'} onChange={(event) => patchSelected((element) => ({ ...element, parent: event.target.value }))}>{ROOT_LAYERS.map((layer) => <option key={layer} value={layer}>{layer}</option>)}{elements.filter((entry) => entry.id !== selectedElement.id).map((entry) => <option key={entry.id} value={entry.id}>{entry.type} · {(entry.text || '').slice(0, 12) || entry.id.slice(0, 6)}</option>)}</select></Field>
              <Field label="Opacity"><input type="number" value={selectedElement.opacity ?? 100} onChange={(event) => patchSelected((element) => ({ ...element, opacity: toNumber(event.target.value, 100) }))} /></Field>
              {(selectedElement.type === 'Text' || selectedElement.type === 'Button' || selectedElement.type === 'InputField') && <Field label="Text" full><textarea value={selectedElement.text || ''} onChange={(event) => patchSelected((element) => ({ ...element, text: event.target.value }))} /></Field>}
              <Field label="Color"><input value={selectedElement.color || ''} onChange={(event) => patchSelected((element) => ({ ...element, color: event.target.value }))} /></Field>
              {(selectedElement.type === 'Button' || selectedElement.type === 'InputField') && <Field label="Text Color"><input value={selectedElement.textColor || '#ffffff'} onChange={(event) => patchSelected((element) => ({ ...element, textColor: event.target.value }))} /></Field>}
              {(selectedElement.type === 'Text' || selectedElement.type === 'Button' || selectedElement.type === 'InputField') && <>
                <Field label="Font"><select value={selectedElement.font || FONT_OPTIONS[0]} onChange={(event) => patchSelected((element) => ({ ...element, font: event.target.value }))}>{FONT_OPTIONS.map((font) => <option key={font} value={font}>{font}</option>)}</select></Field>
                <Field label="Font Size"><input type="number" value={selectedElement.fontSize || 18} onChange={(event) => patchSelected((element) => ({ ...element, fontSize: toNumber(event.target.value, 18) }))} /></Field>
                <Field label="Align" full><select value={selectedElement.align || 'MiddleCenter'} onChange={(event) => patchSelected((element) => ({ ...element, align: event.target.value }))}>{ALIGN_OPTIONS.map((align) => <option key={align} value={align}>{align}</option>)}</select></Field>
              </>}
              {selectedElement.type === 'Button' && <>
                <Field label="Console Command" full><input value={selectedElement.command || ''} onChange={(event) => patchSelected((element) => ({ ...element, command: event.target.value }))} placeholder="example.openmenu" /></Field>
                <Field label="Close UI"><select value={selectedElement.closeUi ? 'yes' : 'no'} onChange={(event) => patchSelected((element) => ({ ...element, closeUi: event.target.value === 'yes' }))}><option value="no">No</option><option value="yes">Yes</option></select></Field>
              </>}
              {selectedElement.type === 'InputField' && <>
                <Field label="Submit Command" full><input value={selectedElement.command || ''} onChange={(event) => patchSelected((element) => ({ ...element, command: event.target.value }))} placeholder="example.submit" /></Field>
                <Field label="Char Limit"><input type="number" min="0" value={selectedElement.charsLimit || 0} onChange={(event) => patchSelected((element) => ({ ...element, charsLimit: Math.max(0, Math.round(toNumber(event.target.value, 0)) || 0) }))} /></Field>
              </>}
              {selectedElement.type === 'Image' && <Field label="Image URL" full><input value={selectedElement.imageUrl || ''} onChange={(event) => patchSelected((element) => ({ ...element, imageUrl: event.target.value }))} /></Field>}
              <Field label="Anchor Min X (0-1)"><input type="number" min="0" max="1" step="0.01" value={parseAnchor(selectedElement.anchor?.min).x} onChange={(event) => updateAnchorValue('min', 'x', event.target.value)} /></Field>
              <Field label="Anchor Min Y (0-1)"><input type="number" min="0" max="1" step="0.01" value={parseAnchor(selectedElement.anchor?.min).y} onChange={(event) => updateAnchorValue('min', 'y', event.target.value)} /></Field>
              <Field label="Anchor Max X (0-1)"><input type="number" min="0" max="1" step="0.01" value={parseAnchor(selectedElement.anchor?.max).x} onChange={(event) => updateAnchorValue('max', 'x', event.target.value)} /></Field>
              <Field label="Anchor Max Y (0-1)"><input type="number" min="0" max="1" step="0.01" value={parseAnchor(selectedElement.anchor?.max).y} onChange={(event) => updateAnchorValue('max', 'y', event.target.value)} /></Field>
              <Field label="Offset Min X (px)"><input type="number" step="0.1" value={selectedElement.offset?.minX || 0} onChange={(event) => updateOffsetValue('minX', event.target.value)} /></Field>
              <Field label="Offset Min Y (px)"><input type="number" step="0.1" value={selectedElement.offset?.minY || 0} onChange={(event) => updateOffsetValue('minY', event.target.value)} /></Field>
              <Field label="Offset Max X (px)"><input type="number" step="0.1" value={selectedElement.offset?.maxX || 0} onChange={(event) => updateOffsetValue('maxX', event.target.value)} /></Field>
              <Field label="Offset Max Y (px)"><input type="number" step="0.1" value={selectedElement.offset?.maxY || 0} onChange={(event) => updateOffsetValue('maxY', event.target.value)} /></Field>
              <div className="editor-field--full">
                <div className="editor-footer-note">Rust anchors use the `0-1` range: `0` is the start edge, `1` is the far edge, and `0.5` is the center. Offsets are pixel nudges on top of that.</div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default Editor;
