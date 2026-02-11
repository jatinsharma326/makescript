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
    count = 15,
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
            const size = 3 + random(seed + 3) * 5;
            return { id: i, angle, speed, delay, size, x: 50, y: 50, drift: 0 };
        }

        if (style === 'rain') {
            const x = random(seed) * 100;
            const speed = 1.5 + random(seed + 1) * 2.5;
            const delay = random(seed + 2) * 20;
            const size = 2 + random(seed + 3) * 4;
            const drift = (random(seed + 5) - 0.5) * 1.5;
            return { id: i, angle: Math.PI / 2, speed, delay, size, x, y: -5, drift };
        }

        // Ambient
        const x = random(seed) * 100;
        const y = random(seed + 1) * 100;
        const size = 2 + random(seed + 2) * 5;
        const speed = 0.3 + random(seed + 4) * 0.6;
        const drift = (random(seed + 5) - 0.5) * 0.4;
        return { id: i, angle: -Math.PI / 2, speed, delay: 0, size, x, y, drift };
    });

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
                    px = p.x + Math.sin(pFrame * 0.05 + p.id) * p.drift * 15;
                    py = p.y + pFrame * p.speed * 0.5;
                } else {
                    px = p.x + Math.sin(pFrame * p.drift + p.id) * 12;
                    py = p.y - pFrame * p.speed * 0.3;
                }

                const pulse = Math.sin(pFrame * 0.1 + p.id * 2) * 0.25 + 0.75;
                const boundsFade = (py < -5 || py > 105 || px < -5 || px > 105) ? 0 : 1;

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
                            background: color,
                            opacity: pulse * 0.5 * boundsFade,
                            transform: 'translate(-50%, -50%)',
                        }}
                    />
                );
            })}
        </AbsoluteFill>
    );
};
