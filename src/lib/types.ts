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
  | 'visual-illustration'
  | 'broll-video'
  | 'gif-reaction'
  | 'image-card'
  | 'ai-generated-image'
  | 'transcript-motion'
  | 'dynamic-broll';

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
  {
    type: 'image-card',
    name: 'Image Card',
    description: 'Web image with animated card overlay',
    icon: '🖼️',
    defaultProps: { imageUrl: '', keyword: '', label: '', displayMode: 'card', position: 'center', transition: 'slide-in', cardStyle: 'glass' },
  },
  {
    type: 'ai-generated-image',
    name: 'AI Generated Image',
    description: 'Custom AI-generated image based on your script',
    icon: '🤖',
    defaultProps: { imagePrompt: '', imageUrl: '', displayMode: 'full', transition: 'fade-in', style: 'cinematic' },
  },
  {
    type: 'broll-video',
    name: 'B-Roll Video',
    description: 'Contextual stock video overlay',
    icon: '🎥',
    defaultProps: { url: '', keyword: '', style: 'split-screen' },
  },
  {
    type: 'gif-reaction',
    name: 'GIF Reaction',
    description: 'Animated GIF reaction',
    icon: '🤪',
    defaultProps: { url: '', keyword: '', size: 'medium' },
  },
  {
    type: 'transcript-motion',
    name: 'Transcript Motion',
    description: 'Live word-by-word animated text synced to speech',
    icon: '🎙️',
    defaultProps: { color: '#6366f1', style: 'karaoke', position: 'bottom' },
  },
  {
    type: 'dynamic-broll',
    name: 'Dynamic B-Roll',
    description: 'Animated motion graphics driven by transcript content',
    icon: '🎬',
    defaultProps: { color: '#8b5cf6', style: 'abstract' },
  },
];

export interface VideoFilters {
  brightness: number;   // 0-200, default 100
  contrast: number;     // 0-200, default 100
  saturation: number;   // 0-200, default 100
  blur: number;         // 0-20, default 0
  vignette: number;     // 0-100, default 0
  temperature: number;  // -50 to 50, default 0
}

export const DEFAULT_FILTERS: VideoFilters = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  blur: 0,
  vignette: 0,
  temperature: 0,
};

export interface TrimPoint {
  inPoint: number;   // seconds
  outPoint: number;  // seconds
}

export interface TextOverlay {
  id: string;
  text: string;
  x: number;         // 0-100 percent
  y: number;         // 0-100 percent
  fontSize: number;
  color: string;
  fontWeight: number;
  startTime: number;  // seconds
  endTime: number;    // seconds
}

export type EditorTab = 'filters' | 'trim' | 'speed' | 'text';

export type TranscriptStatus =
  | 'none'           // No transcript yet
  | 'transcribing'   // Whisper is processing
  | 'real'           // Real audio-to-text transcript
  | 'mock-no-audio'  // Fallback: video has no audio track
  | 'mock-error'     // Fallback: transcription failed
  | 'mock-empty';    // Fallback: no speech detected

export interface ProjectState {
  projectId: string | null;
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
  filters: VideoFilters;
  trimPoints: TrimPoint;
  playbackSpeed: number;
  textOverlays: TextOverlay[];
  activeEditorTab: EditorTab;
  showEditorPanel: boolean;
  transcriptStatus: TranscriptStatus;
}

export interface ProjectMeta {
  id: string;
  name: string;
  createdAt: number;
  duration: number;
  segmentCount: number;
  overlayCount: number;
  transcriptStatus: TranscriptStatus;
}

export interface ProjectData {
  meta: ProjectMeta;
  subtitles: SubtitleSegment[];
  filters: VideoFilters;
  trimPoints: TrimPoint;
  playbackSpeed: number;
  textOverlays: TextOverlay[];
  videoWidth: number;
  videoHeight: number;
  fps: number;
  videoBuffer: ArrayBuffer;
  videoType: string;
  videoName: string;
}
