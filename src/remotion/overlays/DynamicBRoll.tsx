'use client';

import React from 'react';
import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    spring,
    interpolate,
} from 'remotion';

interface DynamicBRollProps {
    text: string;
    keywords: string;
    color: string;
    style: 'abstract' | 'geometric' | 'wave' | 'particles' | 'data';
    startFrame: number;
    endFrame: number;
}

// Seeded random for deterministic procedural generation
function hash(str: string): number {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = ((h << 5) - h) + str.charCodeAt(i);
        h |= 0;
    }
    return Math.abs(h);
}

function srand(seed: number, i: number): number {
    const x = Math.sin(seed + i * 9301 + 49297) * 49979;
    return x - Math.floor(x);
}

export const DynamicBRoll: React.FC<DynamicBRollProps> = ({
    text,
    keywords,
    color,
    style,
    startFrame,
    endFrame,
}) => {
    const frame = useCurrentFrame();
    const { width, height, fps } = useVideoConfig();

    if (frame < startFrame || frame > endFrame) return null;

    const f = frame - startFrame;
    const dur = endFrame - startFrame;
    const seed = hash(keywords + text);

    // Colors — unique per segment
    const hue = seed % 360;
    const hue2 = (hue + 40 + seed % 50) % 360;

    const enter = spring({ frame: f, fps, config: { damping: 12, stiffness: 80, mass: 0.8 } });
    const exitOp = interpolate(f, [dur - 10, dur], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const vis = Math.min(enter, exitOp);

    const words = keywords.split(/[,\s]+/).map(w => w.trim()).filter(w => w.length > 0);
    const cx = width / 2;
    const cy = height / 2;

    return (
        <AbsoluteFill style={{ opacity: vis, pointerEvents: 'none' }}>
            {/* ═══ SOLID OPAQUE BACKGROUND ═══ */}
            <div style={{
                position: 'absolute', inset: 0,
                background: `linear-gradient(${130 + seed % 60}deg, hsl(${hue},30%,5%) 0%, hsl(${hue2},20%,8%) 50%, hsl(${hue},25%,3%) 100%)`,
            }} />

            {/* Center glow */}
            <div style={{
                position: 'absolute', inset: 0,
                background: `radial-gradient(circle at 50% 45%, hsla(${hue},60%,25%,0.4) 0%, transparent 55%)`,
            }} />

            {/* ═══ LARGE SPINNING RINGS (SVG) ═══ */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                {/* Ring 1 — large, dashed, spinning clockwise */}
                {(() => {
                    const r1 = Math.min(width, height) * 0.35;
                    const dashLen = 40 + seed % 30;
                    const s1 = spring({ frame: Math.max(0, f - 3), fps, config: { damping: 14, stiffness: 50, mass: 0.8 } });
                    return (
                        <g style={{ transformOrigin: `${cx}px ${cy}px`, transform: `rotate(${f * 0.5}deg)` }}>
                            <circle
                                cx={cx} cy={cy} r={r1 * s1}
                                fill="none"
                                stroke={`hsla(${hue}, 70%, 55%, 0.7)`}
                                strokeWidth={3}
                                strokeDasharray={`${dashLen} ${dashLen * 1.5}`}
                                strokeLinecap="round"
                            />
                        </g>
                    );
                })()}

                {/* Ring 2 — medium, spinning counter-clockwise */}
                {(() => {
                    const r2 = Math.min(width, height) * 0.25;
                    const dashLen2 = 25 + seed % 20;
                    const s2 = spring({ frame: Math.max(0, f - 6), fps, config: { damping: 14, stiffness: 50, mass: 0.8 } });
                    return (
                        <g style={{ transformOrigin: `${cx}px ${cy}px`, transform: `rotate(${-f * 0.7}deg)` }}>
                            <circle
                                cx={cx} cy={cy} r={r2 * s2}
                                fill="none"
                                stroke={`hsla(${hue2}, 65%, 50%, 0.5)`}
                                strokeWidth={2}
                                strokeDasharray={`${dashLen2} ${dashLen2 * 2}`}
                                strokeLinecap="round"
                            />
                        </g>
                    );
                })()}

                {/* Ring 3 — outer thin ring */}
                {(() => {
                    const r3 = Math.min(width, height) * 0.42;
                    const s3 = spring({ frame: Math.max(0, f - 8), fps, config: { damping: 16, stiffness: 40, mass: 1 } });
                    return (
                        <g style={{ transformOrigin: `${cx}px ${cy}px`, transform: `rotate(${f * 0.3}deg)` }}>
                            <circle
                                cx={cx} cy={cy} r={r3 * s3}
                                fill="none"
                                stroke={`hsla(${hue}, 50%, 45%, 0.3)`}
                                strokeWidth={1.5}
                                strokeDasharray="10 30"
                                strokeLinecap="round"
                            />
                        </g>
                    );
                })()}

                {/* ═══ RADIAL LINES from center ═══ */}
                {Array.from({ length: 8 + seed % 6 }, (_, i) => {
                    const count = 8 + seed % 6;
                    const angle = (i * 360 / count + seed % 30) * Math.PI / 180;
                    const innerR = 60 + srand(seed, i * 7) * 40;
                    const outerR = 150 + srand(seed, i * 7 + 1) * 200;
                    const lineDelay = 4 + i * 1.5;
                    const ls = spring({ frame: Math.max(0, f - lineDelay), fps, config: { damping: 12, stiffness: 90, mass: 0.4 } });
                    const actualOuter = innerR + (outerR - innerR) * ls;

                    return (
                        <line
                            key={`rl-${i}`}
                            x1={cx + Math.cos(angle) * innerR}
                            y1={cy + Math.sin(angle) * innerR}
                            x2={cx + Math.cos(angle) * actualOuter}
                            y2={cy + Math.sin(angle) * actualOuter}
                            stroke={`hsla(${hue + i * 15}, 60%, 55%, ${0.4 + srand(seed, i * 3) * 0.3})`}
                            strokeWidth={2}
                            strokeLinecap="round"
                        />
                    );
                })}

                {/* ═══ ORBITING DOTS on rings ═══ */}
                {Array.from({ length: 6 }, (_, i) => {
                    const orbitR = Math.min(width, height) * (0.2 + i * 0.05);
                    const speed = 1.2 + i * 0.3;
                    const orbitAngle = ((f * speed + i * 60 + seed % 90) % 360) * Math.PI / 180;
                    const dotSize = 5 + srand(seed, 800 + i) * 5;
                    const ds = spring({ frame: Math.max(0, f - 5 - i * 2), fps, config: { damping: 10, stiffness: 80, mass: 0.3 } });
                    const dx = cx + Math.cos(orbitAngle) * orbitR;
                    const dy = cy + Math.sin(orbitAngle) * orbitR;

                    return (
                        <g key={`od-${i}`} opacity={ds * exitOp}>
                            {/* Glow */}
                            <circle cx={dx} cy={dy} r={dotSize * 2.5}
                                fill={`hsla(${hue + i * 40}, 70%, 55%, 0.15)`} />
                            {/* Dot */}
                            <circle cx={dx} cy={dy} r={dotSize * ds}
                                fill={`hsla(${hue + i * 40}, 75%, 60%, 0.9)`} />
                            {/* Bright center */}
                            <circle cx={dx} cy={dy} r={dotSize * 0.4 * ds}
                                fill="rgba(255,255,255,0.8)" />
                        </g>
                    );
                })}

                {/* ═══ EXPANDING PULSE CIRCLES ═══ */}
                {Array.from({ length: 3 }, (_, i) => {
                    const pulseInterval = 40;
                    const pulsePhase = (f + i * (pulseInterval / 3)) % pulseInterval;
                    const pulseR = (pulsePhase / pulseInterval) * Math.min(width, height) * 0.4;
                    const pulseOp = 1 - pulsePhase / pulseInterval;
                    return (
                        <circle
                            key={`pulse-${i}`}
                            cx={cx} cy={cy} r={pulseR}
                            fill="none"
                            stroke={`hsla(${hue}, 60%, 55%, ${pulseOp * 0.5})`}
                            strokeWidth={2}
                        />
                    );
                })}

                {/* ═══ CORNER BRACKETS ═══ */}
                {[
                    { x: 40, y: 40, sx: 1, sy: 1 },
                    { x: width - 40, y: 40, sx: -1, sy: 1 },
                    { x: width - 40, y: height - 40, sx: -1, sy: -1 },
                    { x: 40, y: height - 40, sx: 1, sy: -1 },
                ].map((c, i) => {
                    const cs = spring({ frame: Math.max(0, f - 10 - i * 2), fps, config: { damping: 12, stiffness: 80, mass: 0.4 } });
                    const bLen = 35 + seed % 20;
                    return (
                        <g key={`cb-${i}`} opacity={0.6 * cs * exitOp}>
                            <line x1={c.x} y1={c.y} x2={c.x + bLen * c.sx * cs} y2={c.y}
                                stroke={`hsla(${hue}, 60%, 55%, 0.8)`} strokeWidth={2.5} strokeLinecap="round" />
                            <line x1={c.x} y1={c.y} x2={c.x} y2={c.y + bLen * c.sy * cs}
                                stroke={`hsla(${hue}, 60%, 55%, 0.8)`} strokeWidth={2.5} strokeLinecap="round" />
                        </g>
                    );
                })}
            </svg>

            {/* ═══ ANIMATED WAVE BARS at bottom ═══ */}
            <svg style={{
                position: 'absolute', bottom: 30, left: '15%', width: '70%', height: 80,
            }}>
                {Array.from({ length: 40 }, (_, i) => {
                    const barSeed = srand(seed, 900 + i);
                    const maxH = 20 + barSeed * 55;
                    const barH = maxH * (0.3 + 0.7 * Math.abs(Math.sin(f * 0.12 + i * 0.4 + barSeed * 6)));
                    const barW = (width * 0.7) / 40;
                    const bs = spring({ frame: Math.max(0, f - i * 0.3), fps, config: { damping: 15, stiffness: 100, mass: 0.3 } });
                    return (
                        <rect
                            key={`wb-${i}`}
                            x={i * barW + 1}
                            y={80 - barH * bs}
                            width={Math.max(1, barW - 2)}
                            height={barH * bs}
                            rx={1}
                            fill={`hsla(${hue + i * 3}, 65%, 55%, ${0.6 * bs * exitOp})`}
                        />
                    );
                })}
            </svg>

            {/* ═══ FLOATING PARTICLE FIELD ═══ */}
            {Array.from({ length: 15 }, (_, i) => {
                const px = srand(seed, 400 + i) * width;
                const py = srand(seed, 450 + i) * height;
                const pSize = 3 + srand(seed, 500 + i) * 5;
                const speed = 0.015 + srand(seed, 550 + i) * 0.02;
                const ps = spring({ frame: Math.max(0, f - i * 1.5), fps, config: { damping: 15, stiffness: 60, mass: 0.3 } });
                const ax = px + Math.sin(f * speed + i) * 40;
                const ay = py + Math.cos(f * speed * 0.7 + i * 2) * 30;
                const particleHue = hue + i * 25;

                return (
                    <div
                        key={`p-${i}`}
                        style={{
                            position: 'absolute',
                            left: ax - pSize,
                            top: ay - pSize,
                            width: pSize * 2,
                            height: pSize * 2,
                            borderRadius: '50%',
                            background: `hsla(${particleHue}, 70%, 60%, 0.8)`,
                            opacity: ps * exitOp,
                            boxShadow: `0 0 ${pSize * 4}px hsla(${particleHue}, 70%, 55%, 0.6), 0 0 ${pSize * 8}px hsla(${particleHue}, 70%, 55%, 0.3)`,
                            transform: `scale(${ps})`,
                        }}
                    />
                );
            })}

            {/* ═══ KEYWORD TEXT — BIG and CENTERED ═══ */}
            {words.length > 0 && (
                <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    zIndex: 10,
                }}>
                    {words.slice(0, 2).map((word, i) => {
                        const ws = spring({
                            frame: Math.max(0, f - 6 - i * 5),
                            fps,
                            config: { damping: 10, stiffness: 90, mass: 0.6 },
                        });
                        const slideY = interpolate(ws, [0, 1], [40, 0]);
                        const isMain = i === 0;
                        const fontSize = isMain ? Math.round(width * 0.1) : Math.round(width * 0.055);

                        return (
                            <div
                                key={i}
                                style={{
                                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                                    fontSize,
                                    fontWeight: 900,
                                    color: '#fff',
                                    textTransform: 'uppercase',
                                    letterSpacing: isMain ? '0.2em' : '0.12em',
                                    opacity: ws * exitOp,
                                    transform: `translateY(${slideY}px)`,
                                    textShadow: `0 0 30px hsla(${hue},70%,55%,0.8), 0 0 60px hsla(${hue},70%,45%,0.4), 0 4px 20px rgba(0,0,0,0.9)`,
                                    lineHeight: 1.15,
                                    textAlign: 'center',
                                }}
                            >
                                {word}
                            </div>
                        );
                    })}
                    {/* Underline bar */}
                    {(() => {
                        const us = spring({ frame: Math.max(0, f - 6 - words.length * 5), fps, config: { damping: 12, stiffness: 80, mass: 0.5 } });
                        return (
                            <div style={{
                                width: width * 0.2 * us,
                                height: 3,
                                background: `linear-gradient(90deg, transparent, hsla(${hue},70%,55%,0.9), transparent)`,
                                marginTop: 14,
                                opacity: us * exitOp,
                                boxShadow: `0 0 15px hsla(${hue},70%,55%,0.5)`,
                            }} />
                        );
                    })()}
                </div>
            )}
        </AbsoluteFill>
    );
};
