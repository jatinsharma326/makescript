import React, { useRef, useEffect } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface ProTextGraphicProps {
  text: string;
  color?: string;
  startFrame: number;
  endFrame: number;
  style?: 'pop' | 'slide' | 'typewriter' | 'highlight';
  position?: 'center' | 'top' | 'bottom';
}

// ─── Particles ───
interface Particle {
  x: number; y: number; vx: number; vy: number;
  size: number; alpha: number; life: number; maxLife: number;
  color: string; shape: 'circle' | 'spark' | 'trail';
  trail: { x: number; y: number }[];
}

function createParticle(w: number, h: number, color: string): Particle {
  return {
    x: w * (0.2 + Math.random() * 0.6),
    y: h * (0.3 + Math.random() * 0.4),
    vx: (Math.random() - 0.5) * 4,
    vy: (Math.random() - 0.5) * 4 - 2,
    size: 1 + Math.random() * 3,
    alpha: 0.3 + Math.random() * 0.7,
    life: 0,
    maxLife: 30 + Math.random() * 60,
    color: Math.random() > 0.5 ? color : `hsl(${Math.random() * 60 + 260}, 80%, 60%)`,
    shape: (['circle', 'spark', 'trail'] as const)[Math.floor(Math.random() * 3)],
    trail: [],
  };
}

// ─── Draw rounded rect helper ───
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

// ─── Measure text width ───
function measureText(ctx: CanvasRenderingContext2D, text: string, fontSize: number): number {
  ctx.font = `900 ${fontSize}px "Space Grotesk", "Inter", sans-serif`;
  return ctx.measureText(text).width;
}

export const ProTextGraphic: React.FC<ProTextGraphicProps> = ({
  text,
  color = '#9d4edd',
  startFrame,
  endFrame,
  style = 'pop',
  position = 'center',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const localFrame = Math.max(0, frame - startFrame);
  const duration = endFrame - startFrame;
  const words = text.split(' ');

  const enterOpacity = interpolate(localFrame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
  const exitProgress = interpolate(localFrame, [duration - 15, duration], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const exitOpacity = 1 - exitProgress;

  const posY = position === 'top' ? height * 0.2 : position === 'bottom' ? height * 0.78 : height * 0.48;

  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    // Init particles
    if (localFrame === 0) {
      particlesRef.current = Array.from({ length: 30 }, () => createParticle(width, height, color));
    }
  }, [localFrame, width, height, color]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width * 2;
    canvas.height = height * 2;
    ctx.scale(2, 2);

    ctx.clearRect(0, 0, width, height);
    if (localFrame < 0 || localFrame > duration) return;

    const progress = localFrame / duration;
    const opacity = Math.min(enterOpacity, exitOpacity) * exitOpacity;

    // ── Update & draw particles ──
    const particles = particlesRef.current;
    const live: Particle[] = [];

    for (const p of particles) {
      p.life++;
      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > 8) p.trail.shift();
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.02;
      p.vx *= 0.98;
      p.alpha *= 0.99;

      const lifeRatio = p.life / p.maxLife;
      const currentAlpha = p.alpha * (1 - lifeRatio) * opacity;

      // Trail
      if (p.shape === 'trail' && p.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(p.trail[0].x, p.trail[0].y);
        for (let t = 1; t < p.trail.length; t++) {
          ctx.lineTo(p.trail[t].x, p.trail[t].y);
        }
        ctx.strokeStyle = `${p.color}${Math.floor(currentAlpha * 80).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = p.size * 0.5;
        ctx.stroke();
      }

      // Draw
      ctx.save();
      ctx.globalAlpha = Math.max(0, currentAlpha);
      ctx.fillStyle = p.color;

      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - lifeRatio * 0.5), 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Spark: rotating star
        ctx.translate(p.x, p.y);
        ctx.rotate(p.life * 0.1);
        ctx.beginPath();
        for (let s = 0; s < 4; s++) {
          const angle = (s / 4) * Math.PI * 2;
          ctx.lineTo(Math.cos(angle) * p.size, Math.sin(angle) * p.size);
          ctx.lineTo(Math.cos(angle + 0.4) * p.size * 0.3, Math.sin(angle + 0.4) * p.size * 0.3);
        }
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      if (p.life < p.maxLife && p.x > -50 && p.x < width + 50 && p.y > -50 && p.y < height + 50) {
        live.push(p);
      }
    }

    // Spawn new particles
    if (particles.length < 60) {
      for (let i = 0; i < 2; i++) {
        if (live.length < 60) live.push(createParticle(width, height, color));
      }
    }
    particlesRef.current = live;

    // ── Draw text based on style ──
    const fontSize = Math.min(72, width * 0.08);
    const lineHeight = fontSize * 1.2;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (style === 'pop') {
      // Background glow
      const glowRadius = 250 + Math.sin(localFrame * 0.03) * 30;
      const glow = ctx.createRadialGradient(width / 2, posY, 0, width / 2, posY, glowRadius);
      glow.addColorStop(0, `${color}${Math.floor(opacity * 25).toString(16).padStart(2, '0')}`);
      glow.addColorStop(0.5, `${color}10`);
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(0, posY - glowRadius, width, glowRadius * 2);

      // Words with staggered spring entrances
      const totalWidth = words.reduce((s, w) => s + measureText(ctx, w, fontSize) + 18, 0) - 18;
      let xOffset = (width - totalWidth) / 2;

      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const wordWidth = measureText(ctx, word, fontSize);
        const wordX = xOffset + wordWidth / 2;
        xOffset += wordWidth + 18;

        const delay = i * 3;
        const popSpring = spring({ frame: Math.max(0, localFrame - delay), fps, config: { damping: 9, stiffness: 250, mass: 0.6 } });
        const scale = interpolate(popSpring, [0, 0.4, 1], [0.1, 1.3, 1]);
        const wordOpacity = interpolate(popSpring, [0, 0.5, 1], [0, 1, 1]) * opacity;
        const rotateX = interpolate(popSpring, [0, 1], [90, 0]);
        const translateY = interpolate(popSpring, [0, 1], [80, 0]);

        if (wordOpacity > 0.01) {
          ctx.save();
          ctx.translate(wordX, posY + translateY);
          ctx.scale(scale, scale);
          ctx.rotate(rotateX * Math.PI / 180 * 0.3);

          // Text glow layers
          ctx.font = `900 ${fontSize}px "Space Grotesk", "Inter", sans-serif`;
          
          // Outer glow
          ctx.shadowColor = color;
          ctx.shadowBlur = 40 * popSpring;
          ctx.fillStyle = '#ffffff';
          ctx.fillText(word, 0, 0);

          // Inner bright core
          ctx.shadowBlur = 20 * popSpring;
          const grad = ctx.createLinearGradient(-wordWidth / 2, -fontSize, wordWidth / 2, fontSize);
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.6, '#ffffff');
          grad.addColorStop(1, color);
          ctx.fillStyle = grad;
          ctx.fillText(word, 0, 0);

          ctx.restore();
        }
      }
    } else if (style === 'slide') {
      // Glass backplate
      const slideProgress = spring({ frame: localFrame, fps, config: { damping: 16, stiffness: 90, mass: 0.8 } });
      const plateW = Math.min(width * 0.85, words.length * fontSize * 0.6 + 80);
      const plateH = Math.min(words.length <= 3 ? lineHeight + 60 : lineHeight * 2 + 60, height * 0.5);
      const plateX = (width - plateW * slideProgress) / 2;
      const plateY = posY - plateH / 2;

      ctx.save();
      ctx.globalAlpha = opacity * (0.3 + slideProgress * 0.7);
      roundRect(ctx, plateX, plateY, plateW * slideProgress, plateH, 20);
      
      const bgGrad = ctx.createLinearGradient(plateX, plateY, plateX, plateY + plateH);
      bgGrad.addColorStop(0, `rgba(10,10,14,0.85)`);
      bgGrad.addColorStop(1, `rgba(18,18,22,0.75)`);
      ctx.fillStyle = bgGrad;
      ctx.fill();

      // Border
      ctx.strokeStyle = `${color}25`;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();

      // Sweep line
      const sweepX = interpolate(slideProgress, [0, 1], [-20, plateW + 20]) + plateX;
      ctx.save();
      ctx.globalAlpha = (1 - interpolate(localFrame, [0, 20], [0, 1])) * opacity;
      ctx.beginPath();
      ctx.moveTo(sweepX, plateY);
      ctx.lineTo(sweepX, plateY + plateH);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.shadowColor = color;
      ctx.shadowBlur = 20;
      ctx.stroke();
      ctx.restore();

      // Text words with slide-up
      const lineWords = Math.ceil(words.length / 2);
      const cols = words.length <= 3 ? words.length : lineWords;
      const rows = words.length <= 3 ? 1 : 2;
      const cellW = plateW / cols;
      const cellH = plateH / rows;
      let wordIdx = 0;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols && wordIdx < words.length; c++) {
          const w = words[wordIdx];
          const wd = wordIdx * 2;
          const s = spring({ frame: Math.max(0, localFrame - wd - 5), fps, config: { damping: 14, stiffness: 120 } });
          const wy = interpolate(s, [0, 1], [40, 0]);
          const wo = interpolate(s, [0, 0.5, 1], [0, 1, 1]) * opacity;

          if (wo > 0.01) {
            const cx = plateX + (c + 0.5) * cellW;
            const cy = plateY + (r + 0.5) * cellH;
            ctx.save();
            ctx.globalAlpha = wo;
            ctx.font = `800 ${fontSize * 0.7}px "Space Grotesk", "Inter", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 10;
            ctx.fillText(w, cx, cy + wy);
            ctx.restore();
          }
          wordIdx++;
        }
      }
    } else if (style === 'typewriter') {
      // Cyber terminal
      const totalChars = text.length;
      const charsPerFrame = totalChars / Math.max(duration * 0.4, 1);
      const visibleChars = Math.min(totalChars, Math.floor(localFrame * charsPerFrame));
      const cursorBlink = Math.sin(localFrame * 0.4) > 0;

      const boxProgress = spring({ frame: localFrame, fps, config: { damping: 12, stiffness: 140 } });
      const boxScale = interpolate(boxProgress, [0, 1], [0.85, 1]);
      
      const displayText = text.substring(0, visibleChars);
      const tw = measureText(ctx, displayText, fontSize * 0.6) + 60;

      // Terminal box
      const bx = (width - tw * boxScale) / 2;
      const by = posY - 30;
      const bw = tw * boxScale;
      const bh = 70;

      ctx.save();
      ctx.globalAlpha = opacity;
      roundRect(ctx, bx, by, bw, bh, 14);
      ctx.fillStyle = 'rgba(5,5,10,0.92)';
      ctx.fill();
      ctx.strokeStyle = `${color}30`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // Left accent bar
      ctx.save();
      ctx.globalAlpha = opacity * 0.8;
      roundRect(ctx, bx + 3, by + 8, 3, bh - 16, 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();

      // Prompt character
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.font = `700 ${fontSize * 0.5}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.fillText('> ', bx + 24, by + bh / 2);
      ctx.restore();

      // Text
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.font = `600 ${fontSize * 0.5}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = `${color}60`;
      ctx.shadowBlur = 8;
      ctx.fillText(displayText, bx + 58, by + bh / 2 + 2);
      ctx.restore();

      // Cursor
      if (visibleChars < totalChars && cursorBlink) {
        const cursorX = bx + 58 + measureText(ctx, displayText, fontSize * 0.5) + 4;
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.fillRect(cursorX, by + 18, 10, bh - 36);
        ctx.restore();
      }
    } else if (style === 'highlight') {
      // Premium highlight box with animated glow
      const cardReveal = spring({ frame: localFrame, fps, config: { damping: 12, stiffness: 180, mass: 0.5 } });
      const accentWidth = spring({ frame: Math.max(0, localFrame - 3), fps, config: { damping: 18, stiffness: 90, mass: 0.5 } });
      const textReveal = spring({ frame: Math.max(0, localFrame - 8), fps, config: { damping: 14, stiffness: 100 } });
      const glowPulse = 0.75 + Math.sin(localFrame * 0.06) * 0.25;
      const borderAngle = localFrame * 1.2 * Math.PI / 180;

      const cardW = Math.min(width * 0.5, measureText(ctx, text, fontSize * 0.7) + 80);
      const cardH = fontSize * 1.5 + 60;
      const cx = (width - cardW * cardReveal) / 2;
      const cy = posY - cardH / 2;

      ctx.save();
      ctx.globalAlpha = cardReveal * opacity;
      
      // Card shadow glow
      ctx.shadowColor = color;
      ctx.shadowBlur = 60 * glowPulse * 0.5;

      // Card background
      roundRect(ctx, cx, cy, cardW * cardReveal, cardH, 18);
      const cardGrad = ctx.createLinearGradient(cx, cy, cx, cy + cardH);
      cardGrad.addColorStop(0, `rgba(12,14,28,0.92)`);
      cardGrad.addColorStop(0.5, `rgba(18,20,40,0.85)`);
      cardGrad.addColorStop(1, `rgba(8,10,25,0.88)`);
      ctx.fillStyle = cardGrad;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Animated gradient border
      roundRect(ctx, cx, cy, cardW * cardReveal, cardH, 18);
      ctx.strokeStyle = `hsla(${borderAngle * 180 / Math.PI}, 70%, 60%, 0.15)`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Top glass highlight
      ctx.beginPath();
      ctx.moveTo(cx + 20, cy + 1);
      ctx.lineTo(cx + cardW * cardReveal - 20, cy + 1);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Accent dot + line
      ctx.save();
      ctx.globalAlpha = accentWidth * opacity;
      ctx.beginPath();
      ctx.arc(cx + 24, cy + 26, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 15 * glowPulse;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Accent line
      ctx.beginPath();
      ctx.moveTo(cx + 36, cy + 26);
      ctx.lineTo(cx + 36 + accentWidth * 60, cy + 26);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.restore();

      // "KEY POINT" label
      ctx.save();
      ctx.globalAlpha = accentWidth * 0.8 * opacity;
      ctx.font = `700 ${fontSize * 0.2}px "Inter", sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = color;
      ctx.fillText('KEY POINT', cx + 100 + accentWidth * 60, cy + 26);
      ctx.restore();

      // Main text
      ctx.save();
      ctx.globalAlpha = textReveal * opacity;
      ctx.font = `700 ${fontSize * 0.7}px "Space Grotesk", "Inter", sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = `${color}40`;
      ctx.shadowBlur = 20;
      ctx.fillText(text, cx + 24, cy + cardH / 2 + 8);
      ctx.restore();

      // Bottom accent bar
      ctx.save();
      ctx.globalAlpha = textReveal * 0.6 * opacity;
      const barGrad = ctx.createLinearGradient(cx + 24, 0, cx + cardW * cardReveal - 24, 0);
      barGrad.addColorStop(0, `${color}80`);
      barGrad.addColorStop(0.3, `${color}30`);
      barGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = barGrad;
      roundRect(ctx, cx + 24, cy + cardH - 14, (cardW - 48) * accentWidth, 2, 1);
      ctx.fill();
      ctx.restore();

      // Corner accent
      ctx.save();
      ctx.globalAlpha = accentWidth * 0.5 * opacity;
      ctx.beginPath();
      ctx.moveTo(cx + cardW - 18, cy + cardH - 28);
      ctx.lineTo(cx + cardW - 10, cy + cardH - 28);
      ctx.lineTo(cx + cardW - 10, cy + cardH - 18);
      ctx.strokeStyle = `${color}50`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      ctx.restore();
    }

    // ── Scan line overlay ──
    if (frame % 3 === 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.015)';
      ctx.fillRect(0, 0, width, 1.5);
      ctx.restore();
    }

    ctx.globalAlpha = 1;
  }, [localFrame, duration, width, height, color, text, words, style, position, fps, frame, posY, enterOpacity, exitOpacity]);

  if (frame < startFrame || frame > endFrame) return null;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 15 }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </AbsoluteFill>
  );
};
