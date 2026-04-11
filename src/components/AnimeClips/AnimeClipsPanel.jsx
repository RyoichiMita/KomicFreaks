import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Clapperboard,
  Upload,
  Scissors,
  Play,
  Pause,
  Plus,
  Trash2,
  Search,
  Tag,
  Volume2,
  Clock,
  Link,
  Globe,
} from 'lucide-react';
import useEditorStore from '../../stores/editorStore';
import { storeAnimeClip, getAllAnimeClips, deleteAnimeClip } from '../../services/animeClipsDB';
import { fetchAudioFromUrl, isYouTubeUrl, checkProxyHealth } from '../../services/audioProxy';

// Pre-built character quick-tags for tagging
const POPULAR_CHARACTERS = [
  { name: 'Luffy', series: 'One Piece', emoji: '🏴‍☠️' },
  { name: 'Zoro', series: 'One Piece', emoji: '⚔️' },
  { name: 'Goku', series: 'Dragon Ball', emoji: '🔥' },
  { name: 'Naruto', series: 'Naruto', emoji: '🍥' },
  { name: 'Eren', series: 'Attack on Titan', emoji: '⛓️' },
  { name: 'Tanjiro', series: 'Demon Slayer', emoji: '🌊' },
  { name: 'Gojo', series: 'Jujutsu Kaisen', emoji: '💜' },
  { name: 'Vegeta', series: 'Dragon Ball', emoji: '👑' },
  { name: 'Ichigo', series: 'Bleach', emoji: '🗡️' },
  { name: 'Levi', series: 'Attack on Titan', emoji: '🔪' },
  { name: 'Sukuna', series: 'Jujutsu Kaisen', emoji: '👁️' },
  { name: 'Shanks', series: 'One Piece', emoji: '🎩' },
];

const formatTime = (s) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 10);
  return `${m}:${String(sec).padStart(2, '0')}.${ms}`;
};

export default function AnimeClipsPanel() {
  const { addClipToTrack, showNotification, currentTime } = useEditorStore();

  // Tab: 'extract', 'url', or 'library'
  const [activeMode, setActiveMode] = useState('extract');

  // --- Extractor state ---
  const [episodeFile, setEpisodeFile] = useState(null);
  const [episodeUrl, setEpisodeUrl] = useState(null);
  const [isPlayingEp, setIsPlayingEp] = useState(false);
  const [epCurrentTime, setEpCurrentTime] = useState(0);
  const [epDuration, setEpDuration] = useState(0);
  const [inPoint, setInPoint] = useState(null);
  const [outPoint, setOutPoint] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);

  // --- URL mode state ---
  const [urlInput, setUrlInput] = useState('');
  const [urlStatus, setUrlStatus] = useState(''); // status text
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [proxyAvailable, setProxyAvailable] = useState(null);
  const [demucsAvailable, setDemucsAvailable] = useState(false);
  const [isolateVocals, setIsolateVocals] = useState(false);

  // --- Tagging state ---
  const [clipName, setClipName] = useState('');
  const [character, setCharacter] = useState('');
  const [series, setSeries] = useState('');
  const [arc, setArc] = useState('');

  // --- Library state ---
  const [library, setLibrary] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewingClip, setPreviewingClip] = useState(null);

  const audioRef = useRef(null);
  const previewAudioRef = useRef(null);
  const animFrameRef = useRef(null);

  // Load library and check proxy on mount
  useEffect(() => {
    loadLibrary();
    checkProxyHealth().then((result) => {
      setProxyAvailable(result.online);
      setDemucsAvailable(result.demucs);
    });
  }, []);

  const loadLibrary = async () => {
    const clips = await getAllAnimeClips();
    setLibrary(clips.sort((a, b) => b.createdAt - a.createdAt));
  };

  // --- URL Fetch Handler ---
  const handleFetchUrl = async () => {
    if (!urlInput.trim()) {
      showNotification('Paste a URL first', 'error');
      return;
    }

    setIsFetchingUrl(true);
    setUrlStatus('');

    try {
      const { blob, type } = await fetchAudioFromUrl(urlInput.trim(), setUrlStatus, isolateVocals);

      // Load the fetched audio into the extractor
      if (episodeUrl) URL.revokeObjectURL(episodeUrl);

      const url = URL.createObjectURL(blob);
      setEpisodeFile({ name: type === 'youtube' ? `YouTube: ${urlInput.trim().slice(0, 40)}...` : urlInput.trim().split('/').pop() || 'Remote audio' });
      setEpisodeUrl(url);
      setInPoint(null);
      setOutPoint(null);
      setIsPlayingEp(false);

      // Switch to extract mode so user can set in/out points
      setActiveMode('extract');
      setUrlStatus('');
      showNotification('✅ Audio loaded — set IN/OUT points to extract clips', 'success');
    } catch (err) {
      console.error('URL fetch failed:', err);
      setUrlStatus('');
      showNotification(`Failed: ${err.message}`, 'error');
    } finally {
      setIsFetchingUrl(false);
    }
  };

  // --- Episode File Handling ---
  const handleEpisodeLoad = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Accept video and audio files
    if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
      showNotification('Please load a video or audio file', 'error');
      return;
    }

    if (episodeUrl) URL.revokeObjectURL(episodeUrl);

    const url = URL.createObjectURL(file);
    setEpisodeFile(file);
    setEpisodeUrl(url);
    setInPoint(null);
    setOutPoint(null);
    setIsPlayingEp(false);

    showNotification(`Loaded: ${file.name}`, 'success');
  };

  // --- Playback ---
  const toggleEpPlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlayingEp) {
      audio.pause();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      setIsPlayingEp(false);
    } else {
      audio.play().catch(() => {});
      setIsPlayingEp(true);

      const tick = () => {
        if (audio && !audio.paused) {
          setEpCurrentTime(audio.currentTime);

          // Auto-stop at out point if set
          if (outPoint !== null && audio.currentTime >= outPoint) {
            audio.pause();
            audio.currentTime = outPoint;
            setIsPlayingEp(false);
            return;
          }

          animFrameRef.current = requestAnimationFrame(tick);
        }
      };
      animFrameRef.current = requestAnimationFrame(tick);
    }
  };

  const handleEpSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = (x / rect.width) * epDuration;
    setEpCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  // --- In/Out Points ---
  const setInPointNow = () => {
    setInPoint(epCurrentTime);
    if (outPoint !== null && epCurrentTime >= outPoint) {
      setOutPoint(null);
    }
    showNotification(`In point: ${formatTime(epCurrentTime)}`, 'info');
  };

  const setOutPointNow = () => {
    setOutPoint(epCurrentTime);
    if (inPoint !== null && epCurrentTime <= inPoint) {
      setInPoint(null);
    }
    showNotification(`Out point: ${formatTime(epCurrentTime)}`, 'info');
  };

  const previewSelection = () => {
    if (inPoint === null || outPoint === null || !audioRef.current) return;
    audioRef.current.currentTime = inPoint;
    audioRef.current.play().catch(() => {});
    setIsPlayingEp(true);

    const tick = () => {
      if (audioRef.current && !audioRef.current.paused) {
        setEpCurrentTime(audioRef.current.currentTime);
        if (audioRef.current.currentTime >= outPoint) {
          audioRef.current.pause();
          setIsPlayingEp(false);
          return;
        }
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };
    animFrameRef.current = requestAnimationFrame(tick);
  };

  // --- Extract Audio Clip ---
  const handleExtract = async () => {
    if (inPoint === null || outPoint === null) {
      showNotification('Set in and out points first', 'error');
      return;
    }
    if (!episodeUrl) {
      showNotification('Load an episode first', 'error');
      return;
    }

    setIsExtracting(true);

    try {
      // Use Web Audio API to extract the segment
      const response = await fetch(episodeUrl);
      const arrayBuffer = await response.arrayBuffer();

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

      const sampleRate = audioBuffer.sampleRate;
      const startSample = Math.floor(inPoint * sampleRate);
      const endSample = Math.floor(outPoint * sampleRate);
      const length = endSample - startSample;
      const channels = audioBuffer.numberOfChannels;

      // Create a new buffer for the extracted segment
      const extractedBuffer = audioCtx.createBuffer(channels, length, sampleRate);

      for (let ch = 0; ch < channels; ch++) {
        const sourceData = audioBuffer.getChannelData(ch);
        const destData = extractedBuffer.getChannelData(ch);
        for (let i = 0; i < length; i++) {
          destData[i] = sourceData[startSample + i];
        }
      }

      // Encode to WAV
      const wavBlob = audioBufferToWav(extractedBuffer);
      const clipUrl = URL.createObjectURL(wavBlob);

      const clipId = `anime_${Date.now()}`;
      const name = clipName || `${character || 'Clip'} - ${formatTime(inPoint)} to ${formatTime(outPoint)}`;

      const clipData = {
        id: clipId,
        name,
        character: character || 'Unknown',
        series: series || 'Unknown',
        arc: arc || '',
        blob: wavBlob,
        duration: outPoint - inPoint,
        sourceFile: episodeFile?.name || 'Unknown',
        inPoint,
        outPoint,
        createdAt: Date.now(),
      };

      await storeAnimeClip(clipData);

      showNotification(`✅ Extracted: "${name}" (${formatTime(outPoint - inPoint)})`, 'success');

      // Reset form
      setClipName('');
      setInPoint(null);
      setOutPoint(null);

      // Refresh library
      await loadLibrary();

      audioCtx.close();
    } catch (err) {
      console.error('Extract failed:', err);
      showNotification(`Extract failed: ${err.message}`, 'error');
    } finally {
      setIsExtracting(false);
    }
  };

  // --- Add to Timeline ---
  const addToTimeline = async (clip) => {
    const url = URL.createObjectURL(clip.blob);
    addClipToTrack('sfx', {
      name: `🎬 ${clip.name}`,
      url,
      duration: clip.duration,
      offset: currentTime,
      type: 'anime-clip',
      originalFileName: clip.name,
      character: clip.character,
      series: clip.series,
    });
    showNotification(`Added "${clip.name}" to timeline at ${Math.floor(currentTime)}s`, 'success');
  };

  // --- Preview clip ---
  const handlePreviewClip = (clip) => {
    if (previewingClip === clip.id) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      setPreviewingClip(null);
      return;
    }

    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }

    const url = URL.createObjectURL(clip.blob);
    const audio = new Audio(url);
    audio.play().catch(() => {});
    audio.onended = () => {
      setPreviewingClip(null);
      URL.revokeObjectURL(url);
    };
    previewAudioRef.current = audio;
    setPreviewingClip(clip.id);
  };

  // --- Delete clip ---
  const handleDeleteClip = async (id) => {
    await deleteAnimeClip(id);
    showNotification('Clip deleted', 'info');
    await loadLibrary();
  };

  // --- Quick tag ---
  const applyTag = (char) => {
    setCharacter(char.name);
    setSeries(char.series);
  };

  // --- Filter library ---
  const filteredLibrary = library.filter((clip) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      clip.name.toLowerCase().includes(q) ||
      clip.character.toLowerCase().includes(q) ||
      clip.series.toLowerCase().includes(q) ||
      (clip.arc && clip.arc.toLowerCase().includes(q))
    );
  });

  // --- Selection duration ---
  const selectionDuration = inPoint !== null && outPoint !== null
    ? Math.max(0, outPoint - inPoint)
    : 0;

  return (
    <div className="ai-panel">
      {/* Mode Tabs */}
      <div style={{ display: 'flex', gap: '2px', marginBottom: 'var(--space-sm)' }}>
        <button
          className={`btn ${activeMode === 'extract' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ flex: 1, justifyContent: 'center', fontSize: '0.625rem', padding: '6px 4px' }}
          onClick={() => setActiveMode('extract')}
        >
          <Scissors size={12} />
          File
        </button>
        <button
          className={`btn ${activeMode === 'url' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ flex: 1, justifyContent: 'center', fontSize: '0.625rem', padding: '6px 4px' }}
          onClick={() => setActiveMode('url')}
        >
          <Link size={12} />
          URL
        </button>
        <button
          className={`btn ${activeMode === 'library' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ flex: 1, justifyContent: 'center', fontSize: '0.625rem', padding: '6px 4px' }}
          onClick={() => setActiveMode('library')}
        >
          <Clapperboard size={12} />
          Library ({library.length})
        </button>
      </div>

      {/* ======== EXTRACT MODE ======== */}
      {activeMode === 'extract' && (
        <div className="ai-card">
          <div className="ai-card-header">
            <div
              className="ai-card-icon"
              style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)' }}
            >
              <Scissors size={20} color="white" />
            </div>
            <div>
              <div className="ai-card-title">Clip Extractor</div>
              <div className="ai-card-description">
                Extract dialogue from anime episodes
              </div>
            </div>
          </div>

          {/* Load Episode */}
          {!episodeUrl ? (
            <label className="anime-load-zone">
              <input
                type="file"
                accept="video/*,audio/*"
                style={{ display: 'none' }}
                onChange={handleEpisodeLoad}
              />
              <Upload size={24} style={{ color: 'var(--accent-primary-light)' }} />
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Load Anime Episode
              </div>
              <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                MP4, MKV, MP3, WAV — stays on your device
              </div>
            </label>
          ) : (
            <>
              {/* Hidden audio element */}
              <audio
                ref={audioRef}
                src={episodeUrl}
                onLoadedMetadata={() => {
                  if (audioRef.current) setEpDuration(audioRef.current.duration);
                }}
                onEnded={() => setIsPlayingEp(false)}
              />

              {/* Episode info */}
              <div className="anime-episode-info">
                <Clapperboard size={12} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {episodeFile?.name}
                </span>
                <button
                  className="btn-icon"
                  style={{ width: '18px', height: '18px' }}
                  onClick={() => {
                    URL.revokeObjectURL(episodeUrl);
                    setEpisodeFile(null);
                    setEpisodeUrl(null);
                    setInPoint(null);
                    setOutPoint(null);
                  }}
                  title="Remove episode"
                >
                  <Trash2 size={10} />
                </button>
              </div>

              {/* Scrubber */}
              <div className="anime-scrubber" onClick={handleEpSeek}>
                <div
                  className="anime-scrubber-fill"
                  style={{ width: `${epDuration > 0 ? (epCurrentTime / epDuration) * 100 : 0}%` }}
                />
                {/* In/out markers */}
                {inPoint !== null && (
                  <div
                    className="anime-marker anime-marker-in"
                    style={{ left: `${(inPoint / epDuration) * 100}%` }}
                    title={`In: ${formatTime(inPoint)}`}
                  />
                )}
                {outPoint !== null && (
                  <div
                    className="anime-marker anime-marker-out"
                    style={{ left: `${(outPoint / epDuration) * 100}%` }}
                    title={`Out: ${formatTime(outPoint)}`}
                  />
                )}
                {/* Selection highlight */}
                {inPoint !== null && outPoint !== null && (
                  <div
                    className="anime-selection"
                    style={{
                      left: `${(inPoint / epDuration) * 100}%`,
                      width: `${((outPoint - inPoint) / epDuration) * 100}%`,
                    }}
                  />
                )}
              </div>

              {/* Time + controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', marginTop: '4px' }}>
                <span className="anime-timecode">{formatTime(epCurrentTime)}</span>
                <button className="btn-icon" onClick={toggleEpPlayback} style={{ width: '28px', height: '28px' }}>
                  {isPlayingEp ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <span className="anime-timecode">{formatTime(epDuration)}</span>
              </div>

              {/* In/Out Point Buttons */}
              <div style={{ display: 'flex', gap: '4px', marginTop: 'var(--space-sm)' }}>
                <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: '0.625rem' }} onClick={setInPointNow}>
                  [ IN {inPoint !== null ? formatTime(inPoint) : '—'}
                </button>
                <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: '0.625rem' }} onClick={setOutPointNow}>
                  OUT ] {outPoint !== null ? formatTime(outPoint) : '—'}
                </button>
                {selectionDuration > 0 && (
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: '0.625rem' }}
                    onClick={previewSelection}
                    title="Preview selection"
                  >
                    <Play size={10} /> {formatTime(selectionDuration)}
                  </button>
                )}
              </div>

              {/* Quick Character Tags */}
              <div className="property-group" style={{ marginTop: 'var(--space-md)' }}>
                <div className="property-group-title">Quick Tag</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {POPULAR_CHARACTERS.map((char) => (
                    <button
                      key={char.name}
                      className={`sticker-btn ${character === char.name ? 'selected' : ''}`}
                      onClick={() => applyTag(char)}
                      title={`${char.name} — ${char.series}`}
                      style={{ width: 'auto', padding: '2px 8px', fontSize: '0.625rem' }}
                    >
                      {char.emoji} {char.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tag Fields */}
              <div className="property-group">
                <div className="property-group-title">Clip Details</div>
                <input
                  className="input"
                  placeholder="Clip name (e.g. Luffy - Gear Fifth!)"
                  value={clipName}
                  onChange={(e) => setClipName(e.target.value)}
                  style={{ marginBottom: '4px' }}
                />
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input
                    className="input"
                    placeholder="Character"
                    value={character}
                    onChange={(e) => setCharacter(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <input
                    className="input"
                    placeholder="Series"
                    value={series}
                    onChange={(e) => setSeries(e.target.value)}
                    style={{ flex: 1 }}
                  />
                </div>
                <input
                  className="input"
                  placeholder="Arc (e.g. Wano, Marineford)"
                  value={arc}
                  onChange={(e) => setArc(e.target.value)}
                  style={{ marginTop: '4px' }}
                />
              </div>

              {/* Extract Button */}
              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: 'var(--space-sm)' }}
                onClick={handleExtract}
                disabled={inPoint === null || outPoint === null || isExtracting}
              >
                {isExtracting ? (
                  <>
                    <div className="spinner" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Scissors size={14} />
                    Extract Clip ({selectionDuration > 0 ? formatTime(selectionDuration) : 'Set points'})
                  </>
                )}
              </button>
            </>
          )}
        </div>
      )}

      {/* ======== URL MODE ======== */}
      {activeMode === 'url' && (
        <div className="ai-card">
          <div className="ai-card-header">
            <div
              className="ai-card-icon"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
            >
              <Globe size={20} color="white" />
            </div>
            <div>
              <div className="ai-card-title">From URL</div>
              <div className="ai-card-description">
                YouTube or direct video/audio links
              </div>
            </div>
          </div>

          {/* Proxy status */}
          <div className="anime-proxy-status">
            <div
              className="anime-proxy-dot"
              style={{ background: proxyAvailable === true ? 'var(--accent-success)' : proxyAvailable === false ? 'var(--accent-error)' : 'var(--text-muted)' }}
            />
            <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
              {proxyAvailable === true ? 'Proxy connected' : proxyAvailable === false ? 'Proxy offline — deploy worker first' : 'Checking proxy...'}
            </span>
          </div>

          {/* URL Input */}
          <div style={{ marginTop: 'var(--space-sm)' }}>
            <div className="anime-url-input-row">
              <input
                className="input"
                placeholder="Paste YouTube or video URL..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFetchUrl()}
                style={{ flex: 1 }}
              />
            </div>

            {/* URL type indicator */}
            {urlInput.trim() && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                {isYouTubeUrl(urlInput) ? (
                  <>
                    <Play size={14} style={{ color: '#ef4444' }} />
                    <span style={{ fontSize: '0.625rem', color: 'var(--text-secondary)' }}>YouTube — audio will be extracted</span>
                  </>
                ) : (
                  <>
                    <Globe size={14} style={{ color: 'var(--accent-primary-light)' }} />
                    <span style={{ fontSize: '0.625rem', color: 'var(--text-secondary)' }}>Direct URL — will try direct + proxy</span>
                  </>
                )}
              </div>
            )}

            {/* Status */}
            {urlStatus && (
              <div className="anime-url-status">
                <div className="spinner" style={{ width: '12px', height: '12px' }} />
                {urlStatus}
              </div>
            )}

            {/* Vocal Isolation Toggle */}
            {demucsAvailable && (
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: 'var(--space-sm)',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: isolateVocals ? 'rgba(139, 92, 246, 0.12)' : 'var(--bg-deep)',
                  border: `1px solid ${isolateVocals ? 'rgba(139, 92, 246, 0.3)' : 'var(--border-default)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <input
                  type="checkbox"
                  checked={isolateVocals}
                  onChange={(e) => setIsolateVocals(e.target.checked)}
                  style={{ accentColor: 'var(--accent-primary)' }}
                />
                <div>
                  <div style={{ fontSize: '0.688rem', fontWeight: 600, color: isolateVocals ? 'var(--accent-primary-light)' : 'var(--text-primary)' }}>
                    🎤 Isolate Vocals
                  </div>
                  <div style={{ fontSize: '0.563rem', color: 'var(--text-muted)' }}>
                    Removes background music & SFX (takes ~60s)
                  </div>
                </div>
              </label>
            )}

            {/* Fetch Button */}
            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 'var(--space-md)' }}
              onClick={handleFetchUrl}
              disabled={!urlInput.trim() || isFetchingUrl || proxyAvailable === false}
            >
              {isFetchingUrl ? (
                <>
                  <div className="spinner" />
                  {isolateVocals ? 'Extracting vocals...' : 'Fetching...'}
                </>
              ) : (
                <>
                  <Link size={14} />
                  {isolateVocals ? 'Fetch & Isolate Vocals' : 'Fetch Audio'}
                </>
              )}
            </button>
          </div>

          {/* How it works */}
          <div className="anime-url-help">
            <div style={{ fontSize: '0.688rem', fontWeight: 600, marginBottom: '4px' }}>How it works</div>
            <div className="anime-url-step">1. Paste a YouTube or video URL above</div>
            <div className="anime-url-step">2. Audio is fetched via your Cloudflare Worker</div>
            <div className="anime-url-step">3. Loaded into the scrubber — set IN/OUT points</div>
            <div className="anime-url-step">4. Extract and tag your clips</div>
          </div>
        </div>
      )}

      {/* ======== LIBRARY MODE ======== */}
      {activeMode === 'library' && (
        <div className="ai-card">
          <div className="ai-card-header">
            <div
              className="ai-card-icon"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}
            >
              <Clapperboard size={20} color="white" />
            </div>
            <div>
              <div className="ai-card-title">Anime Clips Library</div>
              <div className="ai-card-description">
                {library.length} clip{library.length !== 1 ? 's' : ''} saved
              </div>
            </div>
          </div>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              className="input"
              placeholder="Search by character, series, arc..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '30px' }}
            />
          </div>

          {/* Clips List */}
          {filteredLibrary.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '24px 12px',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
            }}>
              {library.length === 0 ? (
                <>
                  <Clapperboard size={24} style={{ opacity: 0.3, marginBottom: '8px' }} />
                  <div>No clips yet</div>
                  <div style={{ fontSize: '0.625rem', marginTop: '4px' }}>
                    Switch to Extract to clip audio from your anime episodes
                  </div>
                </>
              ) : (
                'No clips match your search'
              )}
            </div>
          ) : (
            <div className="anime-clips-list">
              {filteredLibrary.map((clip) => (
                <div key={clip.id} className="anime-clip-card">
                  <div className="anime-clip-meta">
                    <div className="anime-clip-name">{clip.name}</div>
                    <div className="anime-clip-tags">
                      <span className="anime-clip-tag">{clip.character}</span>
                      <span className="anime-clip-tag series">{clip.series}</span>
                      {clip.arc && <span className="anime-clip-tag arc">{clip.arc}</span>}
                    </div>
                    <div className="anime-clip-duration">
                      <Clock size={10} /> {formatTime(clip.duration)}
                    </div>
                  </div>
                  <div className="anime-clip-actions">
                    <button
                      className={`btn-icon ${previewingClip === clip.id ? 'active' : ''}`}
                      onClick={() => handlePreviewClip(clip)}
                      title="Preview"
                    >
                      {previewingClip === clip.id ? <Pause size={12} /> : <Volume2 size={12} />}
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => addToTimeline(clip)}
                      title="Add to timeline"
                      style={{ color: 'var(--accent-primary-light)' }}
                    >
                      <Plus size={12} />
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => handleDeleteClip(clip.id)}
                      title="Delete"
                      style={{ color: 'var(--accent-danger)' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Convert AudioBuffer to WAV Blob.
 * Pure JavaScript — no external dependencies.
 */
function audioBufferToWav(buffer) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataLength = buffer.length * blockAlign;
  const headerLength = 44;
  const totalLength = headerLength + dataLength;

  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);

  // WAV Header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalLength - 8, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // Interleave channels
  let offset = headerLength;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = buffer.getChannelData(ch)[i];
      const clamped = Math.max(-1, Math.min(1, sample));
      view.setInt16(offset, clamped * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view, offset, str) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
