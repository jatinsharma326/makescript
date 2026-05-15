import React, { useRef, useEffect } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface SceneEntry {
  text: string;
  color: string;
  label: string;
  particleType: 'circles' | 'diamonds' | 'stars' | 'hexagons' | 'pixels' | 'petals' | 'lines' | 'geometric';
  particleCount: number;
  backgroundType: 'gradient-tl' | 'gradient-tr' | 'gradient-center' | 'radial' | 'dark';
  animation: 'reveal' | 'slide-up' | 'slide-right' | 'zoom' | 'burst';
}

interface ScenePlan {
  title: string;
  topic: string;
  scenes: SceneEntry[];
  totalFrames: number;
  fps: number;
}

interface TranscriptSceneRendererProps {
  scenePlan: ScenePlan;
  startFrame: number;
  endFrame: number;
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  alpha: number; alphaSpeed: number;
  color: string;
  life: number; maxLife: number;
  rotation: number; rotationSpeed: number;
  shape: string;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function getParticleShape(particleType: string, rand: () => number): string {
  switch (particleType) {
    case 'diamonds': return 'diamond';
    case 'stars': return rand() > 0.5 ? 'star' : 'diamond';
    case 'hexagons': return rand() > 0.3 ? 'hexagon' : 'circle';
    case 'pixels': return 'rect';
    case 'petals': return rand() > 0.5 ? 'petal' : 'circle';
    case 'lines': return 'line';
    case 'geometric': {
      const shapes = ['diamond', 'hexagon', 'rect', 'line'];
      return shapes[Math.floor(rand() * shapes.length)];
    }
    default: return 'circle';
  }
}

function getSceneVibrantColor(baseColor: string, rand: () => number): string {
  const [r, g, b] = hexToRgb(baseColor);
  const hueShift = (rand() - 0.5) * 80;
  const satShift = 0.3 + rand() * 0.7;
  const r2 = Math.min(255, Math.max(0, Math.round(r + hueShift)));
  const g2 = Math.min(255, Math.max(0, Math.round(g + (rand() - 0.5) * 60)));
  const b2 = Math.min(255, Math.max(0, Math.round(b + (rand() - 0.5) * 60)));
  return `rgba(${r2},${g2},${b2},${satShift})`;
}

function createParticle(
  w: number, h: number, color: string, rand: () => number, particleType: string,
): Particle {
  const angle = rand() * Math.PI * 2;
  const speed = 0.2 + rand() * 1.5;
  return {
    x: w * (0.05 + rand() * 0.9),
    y: h * (0.05 + rand() * 0.9),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 0.3,
    size: 2 + rand() * 6,
    alpha: 0.15 + rand() * 0.5,
    alphaSpeed: 0.003 + rand() * 0.012,
    color: getSceneVibrantColor(color, rand),
    life: 0,
    maxLife: 50 + rand() * 100,
    rotation: rand() * Math.PI * 2,
    rotationSpeed: (rand() - 0.5) * 0.06,
    shape: getParticleShape(particleType, rand),
  };
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle, frameRate: number) {
  ctx.save();
  ctx.globalAlpha = p.alpha;
  ctx.fillStyle = p.color;
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation * frameRate * 0.02);

  switch (p.shape) {
    case 'diamond': {
      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.lineTo(p.size * 0.6, 0);
      ctx.lineTo(0, p.size);
      ctx.lineTo(-p.size * 0.6, 0);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'star': {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const outerX = Math.cos(a) * p.size;
        const outerY = Math.sin(a) * p.size;
        const innerA = a + Math.PI / 5;
        const innerX = Math.cos(innerA) * p.size * 0.4;
        const innerY = Math.sin(innerA) * p.size * 0.4;
        if (i === 0) ctx.moveTo(outerX, outerY);
        else ctx.lineTo(outerX, outerY);
        ctx.lineTo(innerX, innerY);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'hexagon': {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI * 2) / 6;
        const hx = Math.cos(a) * p.size;
        const hy = Math.sin(a) * p.size;
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'rect': {
      ctx.fillRect(-p.size * 0.7, -p.size * 0.7, p.size * 1.4, p.size * 1.4);
      break;
    }
    case 'petal': {
      ctx.beginPath();
      ctx.ellipse(0, -p.size * 0.6, p.size * 0.6, p.size * 1.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(p.size * 0.4, p.size * 0.2, p.size * 0.5, p.size * 0.9, Math.PI * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-p.size * 0.4, p.size * 0.2, p.size * 0.5, p.size * 0.9, -Math.PI * 0.3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'line': {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-p.size * 0.8, 0);
      ctx.lineTo(p.size * 0.8, 0);
      ctx.stroke();
      break;
    }
    default: {
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawBackground(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  bgType: string, color: string, progress: number,
) {
  const [r, g, b] = hexToRgb(color);

  switch (bgType) {
    case 'gradient-tl': {
      const gr = ctx.createLinearGradient(0, 0, w, h);
      gr.addColorStop(0, `rgba(${r},${g},${b},0.18)`);
      gr.addColorStop(0.4, `rgba(${r},${g},${b},0.06)`);
      gr.addColorStop(1, '#08080c');
      ctx.fillStyle = gr;
      break;
    }
    case 'gradient-tr': {
      const gr = ctx.createLinearGradient(w, 0, 0, h);
      gr.addColorStop(0, `rgba(${r},${g},${b},0.18)`);
      gr.addColorStop(0.4, `rgba(${r},${g},${b},0.06)`);
      gr.addColorStop(1, '#08080c');
      ctx.fillStyle = gr;
      break;
    }
    case 'gradient-center': {
      const gr = ctx.createLinearGradient(0, h * 0.3, 0, h * 0.9);
      gr.addColorStop(0, `rgba(${r},${g},${b},0.15)`);
      gr.addColorStop(0.5, `rgba(${Math.round(r*0.7)},${Math.round(g*0.7)},${Math.round(b*0.7)},0.08)`);
      gr.addColorStop(1, '#06060a');
      ctx.fillStyle = gr;
      break;
    }
    case 'radial': {
      const gr = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
      gr.addColorStop(0, `rgba(${r},${g},${b},0.2)`);
      gr.addColorStop(0.5, `rgba(${r},${g},${b},0.06)`);
      gr.addColorStop(1, '#08080c');
      ctx.fillStyle = gr;
      break;
    }
    default: {
      ctx.fillStyle = '#08080c';
    }
  }
  ctx.fillRect(0, 0, w, h);

  if (bgType !== 'dark') {
    const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.9);
    vignette.addColorStop(0, 'transparent');
    vignette.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  }
}

export const TranscriptSceneRenderer: React.FC<TranscriptSceneRendererProps> = ({
  scenePlan,
  startFrame,
  endFrame,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const localFrame = frame - startFrame;
  const totalDuration = endFrame - startFrame;

  if (!scenePlan || !scenePlan.scenes || scenePlan.scenes.length === 0) return null;

  const scenes = scenePlan.scenes;
  const sceneCount = scenes.length;
  const totalFrames = Math.max(1, endFrame - startFrame);
  const framesPerScene = Math.floor(totalFrames / sceneCount);
  const sceneIndex = Math.min(sceneCount - 1, Math.floor(localFrame / framesPerScene));
  const sceneLocalFrame = localFrame - sceneIndex * framesPerScene;

  const scene = scenes[sceneIndex] || scenes[0];
  const nextScene = scenes[Math.min(sceneCount - 1, sceneIndex + 1)];

  const particleRef = useRef<{ index: number; particles: Particle[]; seed: number }>({
    index: -1,
    particles: [],
    seed: 0,
  });

  const enterOpacity = interpolate(localFrame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
  const exitOpacity = interpolate(localFrame, [totalDuration - 10, totalDuration], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const containerOpacity = Math.min(enterOpacity, exitOpacity);

  const showPrev = sceneIndex > 0 && sceneLocalFrame < 24;
  const prevOpacity = showPrev
    ? interpolate(sceneLocalFrame, [0, 24], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 0;
  const currentOpacity = interpolate(sceneLocalFrame, [0, 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  useEffect(() => {
    if (particleRef.current.index !== sceneIndex) {
      const seed = sceneIndex * 7919 + scene.text.length * 31;
      const rand = seededRandom(seed);
      const pType = scene.particleType || 'circles';
      const count = scene.particleCount || 100;
      particleRef.current = {
        index: sceneIndex,
        particles: Array.from({ length: count }, () =>
          createParticle(width, height, scene.color || '#6366f1', rand, pType),
        ),
        seed,
      };
    }
  }, [sceneIndex, scene, width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    const activeScene = scene;
    const progress = sceneLocalFrame / framesPerScene;

    drawBackground(ctx, width, height, activeScene.backgroundType || 'dark', activeScene.color || '#6366f1', progress);

    const particles = particleRef.current.particles;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life++;
      p.rotation += p.rotationSpeed;
      p.alpha = Math.max(0, p.alpha + p.alphaSpeed * (p.life < p.maxLife * 0.7 ? 1 : -2));

      if (p.life > p.maxLife || p.alpha <= 0 || p.x < -20 || p.x > width + 20 || p.y < -20 || p.y > height + 20) {
        const rand = seededRandom(particleRef.current.seed + i + frame);
        const pType = activeScene.particleType || 'circles';
        particles[i] = createParticle(width, height, activeScene.color || '#6366f1', rand, pType);
      }

      drawParticle(ctx, particles[i], fps);
    }

    const glowGrad = ctx.createRadialGradient(width / 2, height * 0.4, 0, width / 2, height * 0.4, width * 0.5);
    glowGrad.addColorStop(0, `rgba(${hexToRgb(activeScene.color || '#6366f1').join(',')},0.06)`);
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, width, height);
  }, [frame, scene, sceneLocalFrame, fps, width, height, framesPerScene, sceneIndex]);

  const prevScene = sceneIndex > 0 ? scenes[sceneIndex - 1] : null;

  const textSpring = spring({
    frame: sceneLocalFrame,
    fps,
    config: { damping: 15, stiffness: 90, mass: 0.9 },
  });

  const prevTextSpring = spring({
    frame: sceneLocalFrame + framesPerScene,
    fps,
    config: { damping: 15, stiffness: 90, mass: 0.9 },
  });

  const textOpacity = Math.min(1, interpolate(sceneLocalFrame, [0, 15], [0, 1], { extrapolateRight: 'clamp' }));

  const getTextTransform = (anim: string, springVal: number, localF: number, totalF: number) => {
    switch (anim) {
      case 'slide-up':
        return `translateY(${(1 - springVal) * 40}px)`;
      case 'slide-right':
        return `translateX(${(1 - springVal) * -30}px)`;
      case 'zoom':
        return `scale(${0.85 + springVal * 0.15})`;
      case 'burst':
        return `scale(${0.7 + springVal * 0.3})`;
      default:
        return `scale(${0.95 + springVal * 0.05}) translateY(${(1 - springVal) * 10}px)`;
    }
  };

  return (
    <AbsoluteFill style={{ opacity: containerOpacity, pointerEvents: 'none', zIndex: 20 }}>
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      />

      {showPrev && prevScene && (
        <div
          style={{
            opacity: prevOpacity,
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 32px',
          }}
        >
          <div
            style={{
              fontSize: clampFontSize(prevScene.text.length),
              fontWeight: 900,
              color: '#ffffff',
              textAlign: 'center',
              lineHeight: 1.3,
              textShadow: `0 2px 30px rgba(0,0,0,0.8), 0 0 60px ${prevScene.color}80`,
              letterSpacing: '-0.02em',
              transform: getTextTransform(prevScene.animation || 'reveal', prevTextSpring, sceneLocalFrame, framesPerScene),
              maxWidth: '90%',
            }}
          >
            {prevScene.text}
          </div>
          {prevScene.label && (
            <div
              style={{
                marginTop: 24,
                fontSize: 18,
                fontWeight: 700,
                color: prevScene.color,
                textTransform: 'uppercase',
                letterSpacing: 4,
                textShadow: `0 0 30px ${prevScene.color}`,
                opacity: textOpacity,
              }}
            >
              {prevScene.label}
            </div>
          )}
        </div>
      )}

      <div
        style={{
          opacity: currentOpacity,
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 32px',
        }}
      >
        <div
          style={{
            fontSize: clampFontSize(scene.text.length),
            fontWeight: 900,
            color: '#ffffff',
            textAlign: 'center',
            lineHeight: 1.3,
            textShadow: `0 2px 30px rgba(0,0,0,0.8), 0 0 70px ${scene.color}80`,
            letterSpacing: '-0.02em',
            transform: getTextTransform(scene.animation || 'reveal', textSpring, sceneLocalFrame, framesPerScene),
            maxWidth: '90%',
          }}
        >
          {scene.text}
        </div>
        {scene.label && (
          <div
            style={{
              marginTop: 24,
              fontSize: 18,
              fontWeight: 700,
              color: scene.color,
              textTransform: 'uppercase',
              letterSpacing: 4,
              textShadow: `0 0 30px ${scene.color}`,
              opacity: textOpacity,
            }}
          >
            {scene.label}
          </div>
        )}
        <div
          style={{
            marginTop: 28,
            width: 60,
            height: 3,
            background: `linear-gradient(90deg, transparent, ${scene.color}, transparent)`,
            borderRadius: 2,
            transform: `scaleX(${textSpring})`,
            opacity: textOpacity,
          }}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 40,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 6,
          opacity: containerOpacity * 0.7,
        }}
      >
        {scenes.map((s, i) => (
          <div
            key={i}
            style={{
              width: i === sceneIndex ? 20 : 6,
              height: 4,
              borderRadius: 2,
              background: i === sceneIndex ? s.color : `${s.color}40`,
              transition: 'all 0.3s',
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

function clampFontSize(textLength: number): number {
  if (textLength < 40) return 52;
  if (textLength < 80) return 42;
  if (textLength < 130) return 34;
  if (textLength < 200) return 28;
  return 24;
}