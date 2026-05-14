import React, { useRef, useEffect } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface CanvasMotionGraphicProps {
  text: string;
  label?: string;
  color?: string;
  mood?: string;
  startFrame: number;
  endFrame: number;
}

// ─── Particle system ───
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  alphaSpeed: number;
  color: string;
  life: number;
  maxLife: number;
  shape: 'circle' | 'diamond' | 'line';
  rotation: number;
  rotationSpeed: number;
}

function createParticle(w: number, h: number, color: string, frame: number): Particle {
  const angle = Math.random() * Math.PI * 2;
  const speed = 0.3 + Math.random() * 1.2;
  return {
    x: w * (0.1 + Math.random() * 0.8),
    y: h * (0.1 + Math.random() * 0.8),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 0.5,
    size: 1.5 + Math.random() * 4,
    alpha: 0.2 + Math.random() * 0.5,
    alphaSpeed: 0.005 + Math.random() * 0.015,
    color: Math.random() > 0.5 ? color : `hsl(${Math.random() * 60 + 260}, 80%, 60%)`,
    life: 0,
    maxLife: 60 + Math.random() * 120,
    shape: (['circle', 'diamond', 'line'] as const)[Math.floor(Math.random() * 3)],
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.05,
  };
}

// ─── Grid wave points ───
interface GridPoint {
  x: number;
  y: number;
  originX: number;
  originY: number;
  phase: number;
}

function createGrid(cols: number, rows: number, w: number, h: number): GridPoint[] {
  const points: GridPoint[] = [];
  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= cols; c++) {
      points.push({
        x: (c / cols) * w,
        y: (r / rows) * h,
        originX: (c / cols) * w,
        originY: (r / rows) * h,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }
  return points;
}

// ─── Draw rounded rect ───
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export const CanvasMotionGraphic: React.FC<CanvasMotionGraphicProps> = ({
  text,
  label,
  color = '#9d4edd',
  mood = 'energetic',
  startFrame,
  endFrame,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const particlesRef = useRef<Particle[]>([]);
  const gridRef = useRef<GridPoint[]>([]);
  const gridInitRef = useRef(false);

  const localFrame = Math.max(0, frame - startFrame);
  const duration = endFrame - startFrame;

  const enterOpacity = interpolate(localFrame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
  const exitOpacity = interpolate(localFrame, [duration - 12, duration], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const opacity = Math.min(enterOpacity, exitOpacity);

  const scale = spring({ frame: localFrame, fps, config: { damping: 14, stiffness: 100, mass: 0.8 } });

  const cols = 16;
  const rows = 10;

  useEffect(() => {
    if (!gridInitRef.current) {
      gridRef.current = createGrid(cols, rows, width, height);
      gridInitRef.current = true;
    }
    // Init particles on first frame of this segment
    if (localFrame === 0) {
      particlesRef.current = Array.from({ length: 40 }, () => createParticle(width, height, color, frame));
    }
  }, [localFrame, width, height, color, frame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width * 2; // retina
    canvas.height = height * 2;
    ctx.scale(2, 2);

    // ── Draw frame ──
    ctx.clearRect(0, 0, width, height);

    if (localFrame < 0 || localFrame > duration) return;

    const progress = localFrame / duration;

    // ── Background gradient ──
    const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) * 0.6);
    bgGrad.addColorStop(0, `${color}22`);
    bgGrad.addColorStop(0.5, `${color}0e`);
    bgGrad.addColorStop(1, '#0a0a0e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // ── Grid wave ──
    const grid = gridRef.current;
    ctx.strokeStyle = `${color}18`;
    ctx.lineWidth = 1;
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      for (let c = 0; c <= cols; c++) {
        const idx = r * (cols + 1) + c;
        if (idx >= grid.length) break;
        const p = grid[idx];
        const wave = Math.sin(progress * Math.PI * 4 + p.phase + (r / rows) * Math.PI) * 25
                   + Math.sin(progress * Math.PI * 2 + p.phase * 1.5) * 15;
        const x = p.originX + wave * 0.3;
        const y = p.originY + Math.sin(progress * Math.PI * 3 + p.phase + (c / cols) * Math.PI) * 20;
        if (c === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath();
      for (let r = 0; r <= rows; r++) {
        const idx = r * (cols + 1) + c;
        if (idx >= grid.length) break;
        const p = grid[idx];
        const wave = Math.sin(progress * Math.PI * 4 + p.phase + (r / rows) * Math.PI) * 25
                   + Math.sin(progress * Math.PI * 2 + p.phase * 1.5) * 15;
        const x = p.originX + wave * 0.3;
        const y = p.originY + Math.sin(progress * Math.PI * 3 + p.phase + (c / cols) * Math.PI) * 20;
        if (r === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // ── Update & draw particles ──
    const particles = particlesRef.current;
    const newParticles: Particle[] = [];

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.life++;

      // Move
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.01; // gravity
      p.rotation += p.rotationSpeed;

      // Fade
      const lifeRatio = p.life / p.maxLife;
      const currentAlpha = p.alpha * (1 - lifeRatio) * (1 + Math.sin(p.life * 0.05) * 0.3);

      // Draw
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = Math.max(0, currentAlpha);
      ctx.fillStyle = p.color;

      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size * (1 - lifeRatio * 0.5), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'diamond') {
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size, 0);
        ctx.lineTo(0, p.size);
        ctx.lineTo(-p.size, 0);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(-p.size * 2, 0);
        ctx.lineTo(p.size * 2, 0);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.restore();

      // Respawn or keep
      if (p.life < p.maxLife && p.x > -50 && p.x < width + 50 && p.y > -50 && p.y < height + 50) {
        newParticles.push(p);
      }
    }

    // Spawn new particles continuously
    const spawnRate = 1;
    for (let i = 0; i < spawnRate; i++) {
      if (newParticles.length < 80) {
        newParticles.push(createParticle(width, height, color, frame));
      }
    }

    particlesRef.current = newParticles;

    // ── Grid glow points ──
    for (const p of grid) {
      const wave = Math.sin(progress * Math.PI * 4 + p.phase) * 25;
      const x = p.originX + wave * 0.3;
      const y = p.originY + Math.sin(progress * Math.PI * 3 + p.phase) * 20;
      const dotAlpha = 0.1 + Math.sin(progress * Math.PI * 5 + p.phase) * 0.08;
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `${color}${Math.floor(dotAlpha * 255).toString(16).padStart(2, '0')}`;
      ctx.fill();
    }

    // ── Central label text ──
    if (label || text) {
      const displayText = label || text.substring(0, 60);
      const textScale = 0.8 + scale * 0.2;
      const slideUp = interpolate(localFrame, [0, 15], [40, 0], { extrapolateRight: 'clamp' });
      const textOpacity = interpolate(localFrame, [5, 18], [0, 1], { extrapolateRight: 'clamp' });
      const glowIntensity = 0.3 + Math.sin(localFrame * 0.04) * 0.15;

      ctx.save();
      ctx.translate(width / 2, height / 2 - 20 + slideUp);
      ctx.scale(textScale, textScale);
      ctx.globalAlpha = textOpacity;

      // Text shadow / glow layers
      const fontSize = Math.min(52, width * 0.07);
      ctx.font = `900 ${fontSize}px "Space Grotesk", "Inter", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Outer glow
      ctx.shadowColor = color;
      ctx.shadowBlur = 60 * glowIntensity;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(displayText, 0, 0);

      // Inner glow (second pass)
      ctx.shadowBlur = 30 * glowIntensity;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(displayText, 0, 0);

      // Clean shadow for accent bar
      ctx.shadowBlur = 0;

      // ── Accent bar under text ──
      const barWidth = Math.min(displayText.length * 22, width * 0.7);
      const barY = fontSize * 0.7 + 16;
      const barScaleX = spring({ frame: Math.max(0, localFrame - 8), fps, config: { damping: 12, stiffness: 80 } });

      roundRect(ctx, -barWidth / 2, barY, barWidth, 3, 2);
      const barGrad = ctx.createLinearGradient(-barWidth / 2, barY, barWidth / 2, barY);
      barGrad.addColorStop(0, `${color}00`);
      barGrad.addColorStop(0.5, color);
      barGrad.addColorStop(1, `${color}00`);
      ctx.fillStyle = barGrad;
      ctx.globalAlpha = textOpacity * barScaleX;
      ctx.fill();

      // Glow beneath bar
      ctx.beginPath();
      ctx.arc(0, barY + 2, 20, 0, Math.PI * 2);
      ctx.fillStyle = `${color}22`;
      ctx.globalAlpha = textOpacity * barScaleX * 0.5;
      ctx.fill();

      ctx.restore();
    }

    // ── Corner accents ──
    const cornerSize = 24;
    const cornerAlpha = interpolate(localFrame, [5, 15], [0, 0.4], { extrapolateRight: 'clamp' });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = cornerAlpha;

    // Top-left
    ctx.beginPath();
    ctx.moveTo(20, 20 + cornerSize);
    ctx.lineTo(20, 20);
    ctx.lineTo(20 + cornerSize, 20);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(width - 20 - cornerSize, height - 20);
    ctx.lineTo(width - 20, height - 20);
    ctx.lineTo(width - 20, height - 20 - cornerSize);
    ctx.stroke();

    // ── Subtle scan line overlay ──
    if (frame % 2 === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.01)';
      ctx.fillRect(0, 0, width, 1);
    }

    ctx.globalAlpha = 1;

  }, [localFrame, duration, width, height, color, label, text, scale, fps, frame]);

  if (frame < startFrame || frame > endFrame) return null;

  return (
    <AbsoluteFill style={{ opacity, pointerEvents: 'none', zIndex: 20 }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
    </AbsoluteFill>
  );
};
