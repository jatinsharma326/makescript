import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
} from 'remotion';
import type { SegmentEffect } from '../../lib/types';

interface ZoomPanEffectProps {
  effect: SegmentEffect;
  startFrame: number;
  endFrame: number;
  children: React.ReactNode;
}

/**
 * ZoomPanEffect — wraps the video layer to apply zoom/pan/shake effects.
 * 
 * Effects:
 *   zoom-in  — gradual scale 1.0 → intensity (e.g. 1.3)
 *   zoom-out — gradual scale intensity → 1.0
 *   ken-burns — slow pan + zoom (documentary feel)
 *   shake    — subtle camera shake for dramatic moments
 */
export const ZoomPanEffect: React.FC<ZoomPanEffectProps> = ({
  effect,
  startFrame,
  endFrame,
  children,
}) => {
  const frame = useCurrentFrame();

  if (frame < startFrame || frame > endFrame) {
    return <>{children}</>;
  }

  const localFrame = frame - startFrame;
  const duration = endFrame - startFrame;
  const progress = duration > 0 ? localFrame / duration : 0;

  // Smooth easing
  const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const easedProgress = easeInOut(Math.min(1, progress));

  const intensity = effect.intensity || 1.2;

  let transform = '';
  let transformOrigin = 'center center';

  switch (effect.type) {
    case 'zoom-in': {
      const scale = interpolate(easedProgress, [0, 1], [1, intensity]);
      transform = `scale(${scale})`;
      break;
    }

    case 'zoom-out': {
      const scale = interpolate(easedProgress, [0, 1], [intensity, 1]);
      transform = `scale(${scale})`;
      break;
    }

    case 'ken-burns': {
      // Slow pan + subtle zoom
      const scale = interpolate(easedProgress, [0, 1], [1, 1 + (intensity - 1) * 0.5]);
      const panAmount = 3; // percent of movement

      switch (effect.direction) {
        case 'left':
          transform = `scale(${scale}) translateX(${interpolate(easedProgress, [0, 1], [0, -panAmount])}%)`;
          transformOrigin = 'center center';
          break;
        case 'right':
          transform = `scale(${scale}) translateX(${interpolate(easedProgress, [0, 1], [0, panAmount])}%)`;
          transformOrigin = 'center center';
          break;
        case 'up':
          transform = `scale(${scale}) translateY(${interpolate(easedProgress, [0, 1], [0, -panAmount])}%)`;
          transformOrigin = 'center center';
          break;
        case 'down':
        default:
          transform = `scale(${scale}) translateY(${interpolate(easedProgress, [0, 1], [0, panAmount])}%)`;
          transformOrigin = 'center center';
          break;
      }
      break;
    }

    case 'shake': {
      // Subtle camera shake using sine waves at different frequencies
      const shakeIntensity = (effect.intensity || 0.8) * 2;
      const freq1 = localFrame * 0.8;
      const freq2 = localFrame * 1.3;
      const freq3 = localFrame * 0.5;

      // Fade shake in/out smoothly
      const shakeFade = interpolate(
        localFrame,
        [0, 4, duration - 4, duration],
        [0, 1, 1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      );

      const offsetX = Math.sin(freq1) * shakeIntensity * shakeFade;
      const offsetY = Math.cos(freq2) * shakeIntensity * 0.7 * shakeFade;
      const rotation = Math.sin(freq3) * 0.3 * shakeIntensity * shakeFade;

      transform = `translate(${offsetX}px, ${offsetY}px) rotate(${rotation}deg)`;
      break;
    }

    default:
      break;
  }

  return (
    <AbsoluteFill
      style={{
        transform,
        transformOrigin,
        overflow: 'hidden',
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
