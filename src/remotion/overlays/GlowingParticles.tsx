import React from 'react';
import {
    AbsoluteFill,
    useCurrentFrame,
    interpolate,
    random,
} from 'remotion';

interface GlowingParticlesProps {
    color?: string;
    count?: number;
    startFrame: number;
    endFrame: number;
    style?: 'ambient' | 'burst' | 'rain';
}

export const GlowingParticles: React.FC<GlowingParticlesProps> = ({
    color = '#6366f1',
    count = 20,
    startFrame,
    endFrame,
    style = 'ambient',
}) => {
    const frame = useCurrentFrame();

    if (frame < startFrame || frame > endFrame) return null;

    const localFrame = frame - startFrame;
    const duration = endFrame - startFrame;

    // Fade in/out
    const containerOpacity = interpolate(
        localFrame,
        [0, 10, duration - 15, duration],
        [0, 1, 1, 0],
        { extrapolateRight: 'clamp' }
    );

    const particles = new Array(count).fill(0).map((_, i) => {
        const seed = i * 31.415;

        if (style === 'burst') {
            const angle = (i / count) * Math.PI * 2 + random(seed) * 0.3;
            const speed = 2 + random(seed + 1) * 4;
            const delay = random(seed + 2) * 8;
            const size = 3 + random(seed + 3) * 7;
            const alpha = 0.3 + random(seed + 4) * 0.5;
            return { id: i, angle, speed, delay, size, alpha, x: 50, y: 50, drift: 0 };
        }

        if (style === 'rain') {
            const x = random(seed) * 100;
            const speed = 1.5 + random(seed + 1) * 3;
            const delay = random(seed + 2) * 20;
            const size = 2 + random(seed + 3) * 5;
            const alpha = 0.2 + random(seed + 4) * 0.4;
            const drift = (random(seed + 5) - 0.5) * 2;
            return { id: i, angle: Math.PI / 2, speed, delay, size, alpha, x, y: -5, drift };
        }

        // Ambient float
        const x = random(seed) * 100;
        const y = random(seed + 1) * 100;
        const size = 2 + random(seed + 2) * 6;
        const alpha = 0.2 + random(seed + 3) * 0.5;
        const speed = 0.3 + random(seed + 4) * 0.7;
        const drift = (random(seed + 5) - 0.5) * 0.5;
        return { id: i, angle: -Math.PI / 2, speed, delay: 0, size, alpha, x, y, drift };
    });

    const colors = [color, '#a78bfa', '#c084fc', '#818cf8', '#e0e7ff'];

    return (
        <AbsoluteFill style={{ pointerEvents: 'none', opacity: containerOpacity }}>
            {particles.map((p) => {
                const pFrame = Math.max(0, localFrame - p.delay);
                if (pFrame <= 0) return null;

                let px: number, py: number;

                if (style === 'burst') {
                    const dist = pFrame * p.speed;
                    px = 50 + Math.cos(p.angle) * dist * 0.8;
                    py = 50 + Math.sin(p.angle) * dist * 0.5;
                } else if (style === 'rain') {
                    px = p.x + Math.sin(pFrame * 0.05 + p.id) * p.drift * 20;
                    py = p.y + pFrame * p.speed * 0.5;
                } else {
                    px = p.x + Math.sin(pFrame * p.drift + p.id) * 15;
                    py = p.y - pFrame * p.speed * 0.3 + Math.cos(pFrame * 0.03 + p.id) * 8;
                }

                const pulse = Math.sin(pFrame * 0.1 + p.id * 2) * 0.3 + 0.7;
                const particleAlpha = p.alpha * pulse;
                const boundsFade = (py < -5 || py > 105 || px < -5 || px > 105) ? 0 : 1;
                const particleColor = colors[p.id % colors.length];

                return (
                    <div
                        key={p.id}
                        style={{
                            position: 'absolute',
                            left: `${px}%`,
                            top: `${py}%`,
                            width: `${p.size}px`,
                            height: `${p.size}px`,
                            borderRadius: '50%',
                            background: `radial-gradient(circle, ${particleColor}, transparent 70%)`,
                            boxShadow: `0 0 ${p.size * 1.5}px ${particleColor}${Math.round(particleAlpha * 80).toString().padStart(2, '0')}`,
                            opacity: particleAlpha * boundsFade,
                            transform: 'translate(-50%, -50%)',
                        }}
                    />
                );
            })}

            {/* Ambient glow spots */}
            {style === 'ambient' && [0, 1, 2].map((i) => {
                const seed = i * 777;
                const gx = 20 + random(seed) * 60;
                const gy = 20 + random(seed + 1) * 60;
                const gSize = 120 + random(seed + 2) * 160;
                const gPulse = Math.sin(localFrame * 0.03 + i * 2) * 0.3 + 0.5;

                return (
                    <div
                        key={`glow-${i}`}
                        style={{
                            position: 'absolute',
                            left: `${gx}%`,
                            top: `${gy}%`,
                            width: `${gSize}px`,
                            height: `${gSize}px`,
                            borderRadius: '50%',
                            background: `radial-gradient(circle, ${colors[i]}12, transparent 70%)`,
                            opacity: gPulse * 0.35,
                            transform: 'translate(-50%, -50%)',
                            filter: 'blur(25px)',
                        }}
                    />
                );
            })}
        </AbsoluteFill>
    );
};
