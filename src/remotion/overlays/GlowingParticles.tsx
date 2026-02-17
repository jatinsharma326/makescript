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

    // Cinematic fade in/out with ease
    const containerOpacity = interpolate(
        localFrame,
        [0, 15, duration - 20, duration],
        [0, 1, 1, 0],
        { extrapolateRight: 'clamp' }
    );

    const particles = new Array(count).fill(0).map((_, i) => {
        const seed = i * 31.415;

        if (style === 'burst') {
            const angle = (i / count) * Math.PI * 2 + random(seed) * 0.4;
            const speed = 2.5 + random(seed + 1) * 5;
            const delay = random(seed + 2) * 6;
            const size = 4 + random(seed + 3) * 10;
            const alpha = 0.4 + random(seed + 4) * 0.5;
            const rotSpeed = (random(seed + 6) - 0.5) * 4;
            return { id: i, angle, speed, delay, size, alpha, x: 50, y: 50, drift: 0, rotSpeed, depth: random(seed + 7) };
        }

        if (style === 'rain') {
            const x = random(seed) * 100;
            const speed = 1.8 + random(seed + 1) * 3.5;
            const delay = random(seed + 2) * 15;
            const size = 3 + random(seed + 3) * 6;
            const alpha = 0.25 + random(seed + 4) * 0.45;
            const drift = (random(seed + 5) - 0.5) * 2.5;
            return { id: i, angle: Math.PI / 2, speed, delay, size, alpha, x, y: -8, drift, rotSpeed: 0, depth: random(seed + 7) };
        }

        // Ambient float with depth layers
        const x = random(seed) * 100;
        const y = random(seed + 1) * 100;
        const size = 3 + random(seed + 2) * 8;
        const alpha = 0.25 + random(seed + 3) * 0.5;
        const speed = 0.2 + random(seed + 4) * 0.6;
        const drift = (random(seed + 5) - 0.5) * 0.6;
        const depth = random(seed + 7); // 0=far, 1=near for bokeh
        return { id: i, angle: -Math.PI / 2, speed, delay: 0, size, alpha, x, y, drift, rotSpeed: 0, depth };
    });

    const colors = [color, '#a78bfa', '#c084fc', '#818cf8', '#e0e7ff', '#67e8f9'];

    return (
        <AbsoluteFill style={{ pointerEvents: 'none', opacity: containerOpacity }}>
            {/* Deep background ambient glow layer */}
            {style === 'ambient' && (
                <>
                    {[0, 1, 2, 3].map((i) => {
                        const seed = i * 777;
                        const gx = 15 + random(seed) * 70;
                        const gy = 15 + random(seed + 1) * 70;
                        const gSize = 180 + random(seed + 2) * 250;
                        const gPulse = Math.sin(localFrame * 0.025 + i * 1.8) * 0.35 + 0.55;
                        const hue = interpolate(Math.sin(localFrame * 0.008 + i), [-1, 1], [0, 30]);

                        return (
                            <div
                                key={`deep-glow-${i}`}
                                style={{
                                    position: 'absolute',
                                    left: `${gx}%`,
                                    top: `${gy}%`,
                                    width: `${gSize}px`,
                                    height: `${gSize}px`,
                                    borderRadius: '50%',
                                    background: `radial-gradient(circle, ${colors[i % colors.length]}15, ${colors[(i + 1) % colors.length]}08 40%, transparent 70%)`,
                                    opacity: gPulse * 0.4,
                                    transform: `translate(-50%, -50%) rotate(${hue}deg)`,
                                    filter: 'blur(35px)',
                                }}
                            />
                        );
                    })}
                </>
            )}

            {/* Burst center flash */}
            {style === 'burst' && localFrame < 12 && (
                <>
                    <div
                        style={{
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            width: '300px',
                            height: '300px',
                            transform: 'translate(-50%, -50%)',
                            background: `radial-gradient(circle, white, ${color}40 30%, transparent 60%)`,
                            opacity: interpolate(localFrame, [0, 2, 8, 12], [0, 0.5, 0.15, 0], {
                                extrapolateRight: 'clamp',
                            }),
                            filter: 'blur(8px)',
                        }}
                    />
                    {/* Anamorphic streak from burst */}
                    <div
                        style={{
                            position: 'absolute',
                            left: '0',
                            top: '50%',
                            width: '100%',
                            height: '3px',
                            transform: 'translateY(-50%)',
                            background: `linear-gradient(90deg, transparent 10%, ${color}30 30%, white 50%, ${color}30 70%, transparent 90%)`,
                            opacity: interpolate(localFrame, [0, 3, 6, 12], [0, 0.7, 0.3, 0], {
                                extrapolateRight: 'clamp',
                            }),
                            filter: 'blur(1px)',
                            boxShadow: `0 0 20px 4px ${color}20`,
                        }}
                    />
                </>
            )}

            {/* Particles */}
            {particles.map((p) => {
                const pFrame = Math.max(0, localFrame - p.delay);
                if (pFrame <= 0) return null;

                let px: number, py: number;

                if (style === 'burst') {
                    const dist = pFrame * p.speed;
                    // Deceleration for realism
                    const decel = Math.max(0.3, 1 - pFrame * 0.01);
                    px = 50 + Math.cos(p.angle) * dist * 0.8 * decel;
                    py = 50 + Math.sin(p.angle) * dist * 0.5 * decel;
                } else if (style === 'rain') {
                    px = p.x + Math.sin(pFrame * 0.04 + p.id) * p.drift * 25;
                    py = p.y + pFrame * p.speed * 0.5;
                } else {
                    // Ambient: organic floating with figure-8 paths
                    const phase = pFrame * 0.015 + p.id * 0.7;
                    px = p.x + Math.sin(phase * p.drift * 3) * 18 + Math.cos(phase * 0.7) * 8;
                    py = p.y - pFrame * p.speed * 0.25 + Math.sin(phase * 1.3) * 10;
                }

                const pulse = Math.sin(pFrame * 0.08 + p.id * 2.3) * 0.35 + 0.65;
                const particleAlpha = p.alpha * pulse;
                const boundsFade = (py < -8 || py > 108 || px < -8 || px > 108) ? 0 : 1;
                const particleColor = colors[p.id % colors.length];

                // Bokeh depth-of-field effect
                const bokehBlur = style === 'ambient'
                    ? interpolate(p.depth, [0, 0.3, 0.7, 1], [4, 1, 0, 3])
                    : 0;
                const depthScale = style === 'ambient'
                    ? interpolate(p.depth, [0, 1], [0.6, 1.4])
                    : 1;
                const actualSize = p.size * depthScale;

                // Light streak trail for rain
                const showTrail = style === 'rain' && p.speed > 3;

                return (
                    <React.Fragment key={p.id}>
                        {/* Light streak trail */}
                        {showTrail && (
                            <div
                                style={{
                                    position: 'absolute',
                                    left: `${px}%`,
                                    top: `${py - 2}%`,
                                    width: '2px',
                                    height: `${p.speed * 8}px`,
                                    background: `linear-gradient(180deg, transparent, ${particleColor}40, ${particleColor}20)`,
                                    opacity: particleAlpha * boundsFade * 0.5,
                                    transform: 'translate(-50%, -100%)',
                                    borderRadius: '1px',
                                }}
                            />
                        )}
                        {/* Main particle with bokeh */}
                        <div
                            style={{
                                position: 'absolute',
                                left: `${px}%`,
                                top: `${py}%`,
                                width: `${actualSize}px`,
                                height: `${actualSize}px`,
                                borderRadius: '50%',
                                background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.4), ${particleColor} 40%, ${particleColor}60 70%, transparent)`,
                                boxShadow: `
                                    0 0 ${actualSize * 2}px ${particleColor}${Math.round(particleAlpha * 60).toString(16).padStart(2, '0')},
                                    0 0 ${actualSize * 4}px ${particleColor}${Math.round(particleAlpha * 25).toString(16).padStart(2, '0')},
                                    inset 0 0 ${actualSize * 0.3}px rgba(255,255,255,0.2)
                                `,
                                opacity: particleAlpha * boundsFade,
                                transform: 'translate(-50%, -50%)',
                                filter: bokehBlur > 0.5 ? `blur(${bokehBlur}px)` : undefined,
                            }}
                        />
                    </React.Fragment>
                );
            })}

            {/* Light leak overlay for cinematic feel */}
            {style === 'ambient' && (
                <div
                    style={{
                        position: 'absolute',
                        right: '-10%',
                        top: '-10%',
                        width: '50%',
                        height: '50%',
                        background: `radial-gradient(ellipse at 80% 20%, ${color}08, transparent 60%)`,
                        opacity: Math.sin(localFrame * 0.02) * 0.3 + 0.4,
                        filter: 'blur(40px)',
                    }}
                />
            )}

            {/* Rain: ground reflection */}
            {style === 'rain' && (
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: '15%',
                        background: `linear-gradient(180deg, transparent, ${color}06)`,
                        opacity: 0.6,
                    }}
                />
            )}
        </AbsoluteFill>
    );
};
