import { useEffect, useCallback } from 'react';
import useEditorStore from '../stores/editorStore';

/**
 * Global keyboard shortcuts for the editor.
 */
export default function useKeyboardShortcuts() {
  const {
    togglePlay,
    isPlaying,
    activeTab,
    setActiveTab,
    selectedClipId,
    setSelectedClipId,
    tracks,
    removeClipFromTrack,
    setCurrentTime,
    currentTime,
    duration,
  } = useEditorStore();

  const handleKeyDown = useCallback(
    (e) => {
      // Ignore shortcuts when typing in an input/textarea
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable
      ) {
        return;
      }

      switch (e.code) {
        // Play/Pause
        case 'Space': {
          e.preventDefault();
          togglePlay();
          break;
        }

        // Delete selected clip
        case 'Delete':
        case 'Backspace': {
          if (selectedClipId) {
            e.preventDefault();
            tracks.forEach((track) => {
              const clip = track.clips.find((c) => c.id === selectedClipId);
              if (clip) {
                removeClipFromTrack(track.id, selectedClipId);
                setSelectedClipId(null);
              }
            });
          }
          break;
        }

        // Escape — deselect clip
        case 'Escape': {
          setSelectedClipId(null);
          break;
        }

        // Left/Right — seek by 1 second
        case 'ArrowLeft': {
          e.preventDefault();
          setCurrentTime(Math.max(0, currentTime - 1));
          break;
        }
        case 'ArrowRight': {
          e.preventDefault();
          setCurrentTime(Math.min(duration, currentTime + 1));
          break;
        }

        // J/K/L — standard video editor playback
        case 'KeyJ': {
          setCurrentTime(Math.max(0, currentTime - 5));
          break;
        }
        case 'KeyK': {
          togglePlay();
          break;
        }
        case 'KeyL': {
          setCurrentTime(Math.min(duration, currentTime + 5));
          break;
        }

        // Home/End — go to start/end
        case 'Home': {
          e.preventDefault();
          setCurrentTime(0);
          break;
        }
        case 'End': {
          e.preventDefault();
          setCurrentTime(duration);
          break;
        }

        // Number keys — switch tabs
        case 'Digit1': {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setActiveTab('editor');
          }
          break;
        }
        case 'Digit2': {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setActiveTab('narration');
          }
          break;
        }
        case 'Digit3': {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setActiveTab('sounds');
          }
          break;
        }
        case 'Digit4': {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setActiveTab('thumbnail');
          }
          break;
        }
        case 'Digit5': {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setActiveTab('templates');
          }
          break;
        }

        default:
          break;
      }
    },
    [
      togglePlay,
      selectedClipId,
      tracks,
      removeClipFromTrack,
      setSelectedClipId,
      setCurrentTime,
      currentTime,
      duration,
      setActiveTab,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
