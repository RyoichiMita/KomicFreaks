import { useState } from 'react';
import {
  Film,
  Mic,
  Volume2,
  Image,
  MessageSquare,
  Layout,
  Download,
  Settings,
  Home,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import './App.css';

import useEditorStore from './stores/editorStore';
import Sidebar from './components/Sidebar/Sidebar';
import Preview from './components/Preview/Preview';
import Timeline from './components/Timeline/Timeline';
import NarrationPanel from './components/Narration/NarrationPanel';
import SoundsPanel from './components/Sounds/SoundsPanel';
import ThumbnailPanel from './components/Thumbnail/ThumbnailPanel';
import TemplatesPanel from './components/Templates/TemplatesPanel';
import WelcomeScreen from './components/Welcome/WelcomeScreen';

const NAV_TABS = [
  { id: 'editor', label: 'Editor', icon: Film },
  { id: 'narration', label: 'AI Narration', icon: Mic, badge: 'AI' },
  { id: 'sounds', label: 'Sounds', icon: Volume2 },
  { id: 'thumbnail', label: 'Thumbnails', icon: Image },
  { id: 'templates', label: 'Templates', icon: Layout },
];

function App() {
  const {
    activeTab,
    setActiveTab,
    projectName,
    setProjectName,
    isExporting,
    tracks,
  } = useEditorStore();

  const [isEditingName, setIsEditingName] = useState(false);

  const hasClips = tracks.some((t) => t.clips.length > 0);

  const renderRightPanel = () => {
    switch (activeTab) {
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

  const rightPanel = renderRightPanel();

  if (activeTab === 'welcome') {
    return (
      <div className="app">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <div className="logo">
              <div className="logo-icon">🎬</div>
              <span className="logo-text">Komic Freaks</span>
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

        {/* Status Bar */}
        <div className="status-bar">
          <div className="status-left">
            <div className="status-item">
              <div className="status-indicator" />
              Ready
            </div>
          </div>
          <div className="status-right">
            <span>Komic Freaks Studio v1.0</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <div className="logo" onClick={() => setActiveTab('welcome')} style={{ cursor: 'pointer' }}>
            <div className="logo-icon">🎬</div>
            <span className="logo-text">Komic Freaks</span>
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

        {/* Nav Tabs */}
        <nav className="header-nav">
          {NAV_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={14} />
                {tab.label}
                {tab.badge && <span className="badge badge-ai">{tab.badge}</span>}
              </button>
            );
          })}
        </nav>

        <div className="header-right">
          <button className="btn-icon tooltip" data-tooltip="Settings">
            <Settings size={16} />
          </button>
          <button
            className="export-btn"
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
        {/* Sidebar — always shown */}
        <Sidebar />

        {/* Workspace */}
        <div className="workspace">
          <div className="workspace-top">
            {/* Preview */}
            <Preview />

            {/* Right Panel (conditional) */}
            {rightPanel && (
              <div className="properties-panel" style={{ overflowY: 'auto' }}>
                <div className="properties-header">
                  <div className="properties-title">
                    {activeTab === 'narration' && '🗣️ AI Narration'}
                    {activeTab === 'sounds' && '🎭 Sound Effects'}
                    {activeTab === 'thumbnail' && '🖼️ Thumbnails'}
                    {activeTab === 'templates' && '📐 Templates'}
                  </div>
                </div>
                <div className="properties-content">
                  {rightPanel}
                </div>
              </div>
            )}
          </div>

          {/* Timeline */}
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
          <span>{tracks.reduce((sum, t) => sum + t.clips.length, 0)} clips on timeline</span>
        </div>
        <div className="status-right">
          <span>Komic Freaks Studio v1.0</span>
          <span>
            <Sparkles size={10} style={{ color: 'var(--accent-primary)' }} /> AI Powered
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;
