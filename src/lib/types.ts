// Shared TypeScript types for AI Video Factory

export interface SubtitleSegment {
  id: string;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  text: string;
  overlay?: OverlayConfig;
}

export interface OverlayConfig {
  type: OverlayType;
  props: Record<string, unknown>;
}

export type OverlayType =
  | 'animated-subtitles'
  | 'lower-third'
  | 'highlight-box'
  | 'emoji-reaction'
  | 'zoom-effect'
  | 'scene-transition'
  | 'glowing-particles'
  | 'kinetic-text'
  | 'visual-illustration';

export interface OverlayTemplate {
  type: OverlayType;
  name: string;
  description: string;
  icon: string;
  defaultProps: Record<string, unknown>;
}

export const OVERLAY_TEMPLATES: OverlayTemplate[] = [
  {
    type: 'lower-third',
    name: 'Lower Third',
    description: 'Animated name/title bar',
    icon: '📛',
    defaultProps: { name: 'Your Name', title: 'Title', color: '#6366f1' },
  },
  {
    type: 'highlight-box',
    name: 'Highlight Box',
    description: 'Highlight key words',
    icon: '🔲',
    defaultProps: { color: '#f59e0b', style: 'glow' },
  },
  {
    type: 'emoji-reaction',
    name: 'Emoji Reaction',
    description: 'Pop-up emoji animation',
    icon: '🔥',
    defaultProps: { emoji: '🔥', size: 80 },
  },
  {
    type: 'zoom-effect',
    name: 'Zoom Emphasis',
    description: 'Zoom-in on key moment',
    icon: '🔍',
    defaultProps: { scale: 1.3 },
  },
  {
    type: 'scene-transition',
    name: 'Scene Transition',
    description: 'Animated scene break',
    icon: '✨',
    defaultProps: { style: 'fade', color: '#6366f1' },
  },
  {
    type: 'glowing-particles',
    name: 'Particles',
    description: 'Floating glow particles',
    icon: '🌟',
    defaultProps: { color: '#6366f1', count: 20, style: 'ambient' },
  },
  {
    type: 'kinetic-text',
    name: 'Kinetic Text',
    description: 'Animated text pop-in',
    icon: '💫',
    defaultProps: { color: '#6366f1', style: 'pop', position: 'center' },
  },
  {
    type: 'visual-illustration',
    name: 'Visual Illustration',
    description: 'Animated SVG scene matching content',
    icon: '🎨',
    defaultProps: { scene: 'solar-system', label: '', color: '#6366f1', displayMode: 'overlay', transition: 'fade-in', soundEffect: 'none' },
  },
];

export interface ProjectState {
  videoSrc: string | null;
  videoFile: File | null;
  subtitles: SubtitleSegment[];
  selectedSegmentId: string | null;
  isTranscribing: boolean;
  isGenerating: boolean;
  videoDuration: number;
  videoWidth: number;
  videoHeight: number;
  fps: number;
}
