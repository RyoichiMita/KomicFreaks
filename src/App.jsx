import { useState, useEffect } from 'react';
import {
  Film,
  Mic,
  Volume2,
  Image,
  Layout,
  Download,
  Settings,
  Sparkles,
  ChevronDown,
  Keyboard,
  X,
  Save,
} from 'lucide-react';
import './App.css';

import useEditorStore from './stores/editorStore';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import Sidebar from './components/Sidebar/Sidebar';
import Preview from './components/Preview/Preview';
import Timeline from './components/Timeline/Timeline';
import NarrationPanel from './components/Narration/NarrationPanel';
import SoundsPanel from './components/Sounds/SoundsPanel';
import ThumbnailPanel from './components/Thumbnail/ThumbnailPanel';
import TemplatesPanel from './components/Templates/TemplatesPanel';
import WelcomeScreen from './components/Welcome/WelcomeScreen';
import ExportModal from './components/Export/ExportModal';

// Tools available in the right tool strip inside the editor
const TOOLS = [
  { id: 'narration', label: 'AI Narration', icon: Mic, badge: 'AI', title: '🗣️ AI Narration' },
  { id: 'sounds', label: 'Sounds', icon: Volume2, title: '🎭 Sound Effects' },
  { id: 'thumbnail', label: 'Thumbnails', icon: Image, title: '🖼️ Thumbnails' },
  { id: 'templates', label: 'Templates', icon: Layout, title: '📐 Templates' },
];

function App() {
  const {
    activeTab,
    setActiveTab,
    projectName,
    setProjectName,
    isExporting,
    tracks,
    notification,
    lastSavedAt,
    saveProject,
    initAutoSave,
  } = useEditorStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [activeTool, setActiveTool] = useState(null);

  // Register keyboard shortcuts
  useKeyboardShortcuts();

  // Start auto-save
  useEffect(() => {
    const cleanup = initAutoSave();
    return cleanup;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Manual save with Cmd+S
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveProject();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveProject]);

  const hasClips = tracks.some((t) => t.clips.length > 0);
  const clipCount = tracks.reduce((sum, t) => sum + t.clips.length, 0);

  const toggleTool = (toolId) => {
    setActiveTool(activeTool === toolId ? null : toolId);
  };

  const renderToolPanel = () => {
    switch (activeTool) {
      case 'narration':
        return <NarrationPanel />;
      case 'sounds':
        return <SoundsPanel />;
      case 'thumbnail':
        return <ThumbnailPanel />;
      case 'templates':
        return <TemplatesPanel />;
      default:
        return null;
    }
  };

  const toolPanel = renderToolPanel();
  const activeToolData = TOOLS.find((t) => t.id === activeTool);

  // --- Welcome screen ---
  if (activeTab === 'welcome') {
    return (
      <div className="app">
        <header className="header">
          <div className="header-left">
            <div className="logo">
              <img src="/logo.png" alt="Komic Freaks" className="logo-img" />
              <span className="logo-studio">Studio</span>
            </div>
          </div>
          <div className="header-right">
            <button className="btn btn-ghost" onClick={() => setActiveTab('editor')}>
              <Film size={14} />
              Open Editor
            </button>
          </div>
        </header>

        <div style={{ flex: 1, overflow: 'auto' }}>
          <WelcomeScreen />
        </div>

        <div className="status-bar">
          <div className="status-left">
            <div className="status-item">
              <div className="status-indicator" />
              Ready
            </div>
          </div>
          <div className="status-right">
            <span>v1.0</span>
          </div>
        </div>
      </div>
    );
  }

  // --- Editor (unified — everything lives here) ---
  return (
    <div className="app">
      {/* Header — clean, no tabs */}
      <header className="header">
        <div className="header-left">
          <div
            className="logo"
            onClick={() => setActiveTab('welcome')}
            style={{ cursor: 'pointer' }}
          >
            <img src="/logo.png" alt="Komic Freaks" className="logo-img" />
            <span className="logo-studio">Studio</span>
          </div>

          {/* Project Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
            {isEditingName ? (
              <input
                className="input"
                style={{ width: '200px', height: '28px', fontSize: '0.813rem' }}
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                autoFocus
              />
            ) : (
              <button
                className="btn btn-ghost"
                style={{ fontSize: '0.813rem', padding: '4px 8px' }}
                onClick={() => setIsEditingName(true)}
              >
                {projectName}
                <ChevronDown size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Center — just a label showing the mode */}
        <div className="header-center">
          <div className="header-mode">
            <Film size={14} />
            <span>Editor</span>
          </div>
        </div>

        <div className="header-right">
          <button
            className="btn-icon tooltip"
            data-tooltip="Save (⌘S)"
            onClick={saveProject}
          >
            <Save size={16} />
          </button>
          <button
            className="btn-icon tooltip"
            data-tooltip="Keyboard Shortcuts"
            onClick={() => setShowShortcuts(!showShortcuts)}
          >
            <Keyboard size={16} />
          </button>
          <button
            className="btn-icon tooltip"
            data-tooltip="Settings"
          >
            <Settings size={16} />
          </button>
          <button
            className="export-btn"
            onClick={() => setShowExport(true)}
            disabled={!hasClips || isExporting}
          >
            {isExporting ? (
              <>
                <div className="spinner" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={14} />
                Export
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="main-content">
        <Sidebar />

        <div className="workspace">
          <div className="workspace-top">
            <Preview />

            {/* Tool Panel — slides open when a tool is active */}
            {toolPanel && (
              <div className="properties-panel" style={{ overflowY: 'auto' }}>
                <div className="properties-header">
                  <div className="properties-title">
                    {activeToolData?.title}
                  </div>
                  <button
                    className="btn-icon"
                    style={{ width: '24px', height: '24px' }}
                    onClick={() => setActiveTool(null)}
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="properties-content">
                  {toolPanel}
                </div>
              </div>
            )}

            {/* Tool Strip — vertical icon bar on the right edge */}
            <div className="tool-strip">
              {TOOLS.map((tool) => {
                const Icon = tool.icon;
                const isActive = activeTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    className={`tool-strip-btn ${isActive ? 'active' : ''}`}
                    onClick={() => toggleTool(tool.id)}
                    title={tool.label}
                  >
                    <Icon size={16} />
                    {tool.badge && (
                      <span className="tool-strip-badge">{tool.badge}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <Timeline />
        </div>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-left">
          <div className="status-item">
            <div className="status-indicator" />
            Ready
          </div>
          <span>{clipCount} clip{clipCount !== 1 ? 's' : ''} on timeline</span>
        </div>
        <div className="status-right">
          {lastSavedAt && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Save size={10} />
              Saved {new Date(lastSavedAt).toLocaleTimeString()}
            </span>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={10} style={{ color: 'var(--accent-primary)' }} /> AI Powered
          </span>
          <span>⌘S = Save</span>
        </div>
      </div>

      {/* Export Modal */}
      {showExport && <ExportModal onClose={() => setShowExport(false)} />}

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="modal-overlay" onClick={() => setShowShortcuts(false)}>
          <div className="modal-content shortcuts-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                <Keyboard size={20} />
                Keyboard Shortcuts
              </h2>
              <button className="btn-icon" onClick={() => setShowShortcuts(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="shortcuts-grid">
                <div className="shortcut-group">
                  <div className="property-group-title">Playback</div>
                  <ShortcutRow keys={['Space']} desc="Play / Pause" />
                  <ShortcutRow keys={['J']} desc="Rewind 5s" />
                  <ShortcutRow keys={['K']} desc="Play / Pause" />
                  <ShortcutRow keys={['L']} desc="Forward 5s" />
                  <ShortcutRow keys={['←']} desc="Back 1s" />
                  <ShortcutRow keys={['→']} desc="Forward 1s" />
                  <ShortcutRow keys={['Home']} desc="Go to start" />
                  <ShortcutRow keys={['End']} desc="Go to end" />
                </div>
                <div className="shortcut-group">
                  <div className="property-group-title">Editing</div>
                  <ShortcutRow keys={['Del']} desc="Delete selected clip" />
                  <ShortcutRow keys={['Esc']} desc="Deselect clip" />
                  <ShortcutRow keys={['⌘', '1']} desc="AI Narration" />
                  <ShortcutRow keys={['⌘', '2']} desc="Sounds" />
                  <ShortcutRow keys={['⌘', '3']} desc="Thumbnails" />
                  <ShortcutRow keys={['⌘', '4']} desc="Templates" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
}

function ShortcutRow({ keys, desc }) {
  return (
    <div className="shortcut-row">
      <div className="shortcut-keys">
        {keys.map((key, i) => (
          <span key={i}>
            <kbd className="shortcut-key">{key}</kbd>
            {i < keys.length - 1 && <span style={{ margin: '0 2px', color: 'var(--text-muted)' }}>+</span>}
          </span>
        ))}
      </div>
      <span className="shortcut-desc">{desc}</span>
    </div>
  );
}

export default App;
