/**
 * TransitionEngine — manages visual transitions between video clips.
 *
 * Transitions are stored on each clip as a `transition` property:
 * {
 *   type: 'fade' | 'crossfade' | 'wipe-left' | 'wipe-right' | 'zoom' | 'none',
 *   duration: 0.5  // seconds
 * }
 *
 * The transition is applied as an INTRO to the clip (how it enters).
 */

export const TRANSITION_TYPES = [
  {
    id: 'none',
    name: 'None',
    icon: '⊘',
    description: 'Hard cut',
    css: null,
  },
  {
    id: 'fade',
    name: 'Fade',
    icon: '🌓',
    description: 'Fade from black',
    css: (progress) => ({
      opacity: Math.min(1, progress),
    }),
  },
  {
    id: 'crossfade',
    name: 'Crossfade',
    icon: '🔀',
    description: 'Blend between clips',
    css: (progress) => ({
      opacity: Math.min(1, progress),
    }),
  },
  {
    id: 'wipe-left',
    name: 'Wipe Left',
    icon: '◀️',
    description: 'Wipe from right to left',
    css: (progress) => ({
      clipPath: `inset(0 0 0 ${(1 - progress) * 100}%)`,
    }),
  },
  {
    id: 'wipe-right',
    name: 'Wipe Right',
    icon: '▶️',
    description: 'Wipe from left to right',
    css: (progress) => ({
      clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)`,
    }),
  },
  {
    id: 'zoom',
    name: 'Zoom In',
    icon: '🔍',
    description: 'Zoom reveal',
    css: (progress) => ({
      opacity: Math.min(1, progress),
      transform: `scale(${0.5 + progress * 0.5})`,
    }),
  },
  {
    id: 'slide-up',
    name: 'Slide Up',
    icon: '⬆️',
    description: 'Slide up from bottom',
    css: (progress) => ({
      transform: `translateY(${(1 - progress) * 100}%)`,
    }),
  },
];

/**
 * Get the CSS style for a transition at a given progress (0-1).
 */
export function getTransitionStyle(transitionType, progress) {
  const transition = TRANSITION_TYPES.find((t) => t.id === transitionType);
  if (!transition || !transition.css) return {};
  return transition.css(Math.max(0, Math.min(1, progress)));
}

/**
 * Calculate transition progress for a clip at a given timeline time.
 * Returns 0-1 during transition, 1 after transition completes.
 */
export function getTransitionProgress(clip, currentTime) {
  if (!clip.transition || clip.transition.type === 'none') return 1;

  const clipStart = clip.offset || 0;
  const transitionDuration = clip.transition.duration || 0.5;
  const elapsed = currentTime - clipStart;

  if (elapsed < 0) return 0;
  if (elapsed >= transitionDuration) return 1;
  return elapsed / transitionDuration;
}

/**
 * Generate FFmpeg filter arguments for a transition.
 * Used during export to bake transitions into the final video.
 */
export function getFFmpegTransitionFilter(transitionType, duration) {
  switch (transitionType) {
    case 'fade':
      return `fade=t=in:st=0:d=${duration}`;
    case 'crossfade':
      return `xfade=transition=fade:duration=${duration}`;
    case 'wipe-left':
      return `xfade=transition=wipeleft:duration=${duration}`;
    case 'wipe-right':
      return `xfade=transition=wiperight:duration=${duration}`;
    case 'zoom':
      return `fade=t=in:st=0:d=${duration},zoompan=z='min(zoom+0.0015,1.5)':d=${Math.round(duration * 25)}`;
    case 'slide-up':
      return `xfade=transition=slideup:duration=${duration}`;
    default:
      return null;
  }
}
