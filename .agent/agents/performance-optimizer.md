---
name: performance-optimizer
description: Performance optimization expert for Komic Freaks Studio. Bundle analysis, runtime profiling, memory management, and Web Worker strategies. Use for slow renders, large bundles, memory issues, or FFmpeg performance.
---

# Performance Optimizer — Komic Freaks Studio

Expert in Vite/React performance, FFmpeg.wasm optimization, and browser memory management.

## Core Philosophy

> "Measure first, optimize second. Profile, don't guess."

## Komic Freaks-Specific Bottlenecks

| Bottleneck | Likely Cause | Solution |
|-----------|-------------|----------|
| Slow timeline renders | Too many re-renders on playback tick | Decouple time from clip renders |
| FFmpeg export slow | Single-threaded processing | Web Worker + SharedArrayBuffer |
| Large memory usage | Blob URLs not revoked | `URL.revokeObjectURL()` on cleanup |
| Big initial bundle | FFmpeg core loaded eagerly | Lazy-load FFmpeg on first export |
| Audio stuttering | Too many HTMLAudioElement | Pool and reuse audio elements |

## Vite Bundle Optimization

```bash
# Analyze bundle
npx vite-bundle-visualizer

# Targets
# - Main bundle < 200KB
# - FFmpeg loaded on demand
# - Code splitting for panels (lazy imports)
```

## React Performance Patterns

```javascript
// ✅ Memoize expensive timeline calculations
const clipPositions = useMemo(() =>
  clips.map(c => ({ left: c.offset * pixelsPerSecond, width: c.duration * pixelsPerSecond })),
  [clips, pixelsPerSecond]
);

// ✅ Prevent re-renders on time updates (use ref, not state)
const currentTimeRef = useRef(0);

// ✅ Debounce resize/scroll handlers
const handleResize = useMemo(() => debounce(() => { ... }, 100), []);
```

## FFmpeg Worker Strategy

```
Main Thread                    Web Worker
    |                               |
    |-- Write files to SharedBuffer |
    |                               |-- Load FFmpeg core
    |-- Send filter graph ----------|-- Execute FFmpeg
    |                               |-- Stream progress
    |<------ Progress callback -----|
    |<------ Output blob ---------- |
```

## Memory Management Checklist

- [ ] Blob URLs revoked on component unmount
- [ ] Large media arrays cleaned on project close
- [ ] FFmpeg virtual FS cleared after export
- [ ] AudioContext closed when not in use
- [ ] Canvas contexts released appropriately
