import React, { useId } from 'react';
import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    spring,
    interpolate,
} from 'remotion';

interface VisualIllustrationProps {
    scene: string;
    label?: string;
    color?: string;
    displayMode?: string;
    transition?: string;
    startFrame: number;
    endFrame: number;
}

// ==================== SCENE COMPONENTS ====================

const SolarSystemScene: React.FC<{ frame: number; fps: number; color: string }> = ({ frame, fps, color }) => {
    const id = useId();
    const orbitAngle = (frame * 3) % 360;
    const moonAngle = (frame * 8) % 360;
    const sunPulse = 1 + Math.sin(frame * 0.08) * 0.05;
    const sunGlow = 0.4 + Math.sin(frame * 0.06) * 0.15;

    return (
        <svg viewBox="0 0 300 300" width="100%" height="100%">
            {/* Star field */}
            {[...Array(20)].map((_, i) => (
                <circle
                    key={`star-${i}`}
                    cx={30 + (i * 67) % 270}
                    cy={20 + (i * 43) % 270}
                    r={0.5 + (i % 3) * 0.5}
                    fill="#fff"
                    opacity={0.3 + Math.sin(frame * 0.1 + i) * 0.3}
                />
            ))}
            {/* Sun glow */}
            <defs>
                <radialGradient id={`${id}-sunGlow`}>
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity={sunGlow} />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
                </radialGradient>
                <radialGradient id={`${id}-sunCore`}>
                    <stop offset="0%" stopColor="#fef3c7" />
                    <stop offset="50%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#f59e0b" />
                </radialGradient>
            </defs>
            <circle cx="150" cy="150" r="70" fill={`url(#${id}-sunGlow)`} />
            {/* Sun */}
            <circle cx="150" cy="150" r={30 * sunPulse} fill={`url(#${id}-sunCore)`} />
            {/* Sun corona rays */}
            {[...Array(8)].map((_, i) => {
                const rayAngle = (i * 45 + frame * 0.5) * (Math.PI / 180);
                return (
                    <line
                        key={`ray-${i}`}
                        x1={150 + Math.cos(rayAngle) * 35}
                        y1={150 + Math.sin(rayAngle) * 35}
                        x2={150 + Math.cos(rayAngle) * 48}
                        y2={150 + Math.sin(rayAngle) * 48}
                        stroke="#fbbf24"
                        strokeWidth="2"
                        opacity={0.5 + Math.sin(frame * 0.15 + i) * 0.3}
                        strokeLinecap="round"
                    />
                );
            })}
            {/* Orbit path */}
            <ellipse cx="150" cy="150" rx="95" ry="60" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4,4" />
            {/* Earth */}
            {(() => {
                const ex = 150 + Math.cos(orbitAngle * Math.PI / 180) * 95;
                const ey = 150 + Math.sin(orbitAngle * Math.PI / 180) * 60;
                const mx = ex + Math.cos(moonAngle * Math.PI / 180) * 18;
                const my = ey + Math.sin(moonAngle * Math.PI / 180) * 18;
                return (
                    <>
                        {/* Earth shadow for depth */}
                        <ellipse cx={ex + 2} cy={ey + 8} rx="10" ry="3" fill="rgba(0,0,0,0.2)" />
                        {/* Earth */}
                        <circle cx={ex} cy={ey} r="12" fill="#3b82f6" />
                        <circle cx={ex - 3} cy={ey - 2} r="4" fill="#22c55e" opacity="0.7" />
                        <circle cx={ex + 4} cy={ey + 3} r="3" fill="#22c55e" opacity="0.5" />
                        {/* Earth atmosphere */}
                        <circle cx={ex} cy={ey} r="14" fill="none" stroke="#60a5fa" strokeWidth="1" opacity="0.3" />
                        {/* Moon orbit */}
                        <circle cx={ex} cy={ey} r="18" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                        {/* Moon */}
                        <circle cx={mx} cy={my} r="4" fill="#d1d5db" />
                        <circle cx={mx - 1} cy={my - 1} r="1" fill="#9ca3af" opacity="0.5" />
                    </>
                );
            })()}
        </svg>
    );
};

const GrowthChartScene: React.FC<{ frame: number; fps: number; color: string }> = ({ frame, fps, color }) => {
    const id = useId();
    const progress = Math.min(1, frame / 40);
    const bars = [0.3, 0.45, 0.35, 0.6, 0.55, 0.75, 0.9];

    return (
        <svg viewBox="0 0 300 250" width="100%" height="100%">
            {/* Grid lines */}
            {[0.25, 0.5, 0.75].map((y, i) => (
                <line key={`grid-${i}`} x1="40" y1={200 * (1 - y) + 20} x2="280" y2={200 * (1 - y) + 20} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            ))}
            {/* Bars */}
            {bars.map((h, i) => {
                const barDelay = i * 4;
                const barProgress = Math.max(0, Math.min(1, (frame - barDelay) / 20));
                const barHeight = h * 170 * barProgress;
                const x = 50 + i * 34;
                return (
                    <g key={`bar-${i}`}>
                        <defs>
                            <linearGradient id={`${id}-barGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={color} stopOpacity="0.9" />
                                <stop offset="100%" stopColor={color} stopOpacity="0.4" />
                            </linearGradient>
                        </defs>
                        <rect x={x} y={220 - barHeight} width="24" height={barHeight} rx="4" fill={`url(#${id}-barGrad-${i})`} />
                        {/* Bar glow */}
                        <rect x={x} y={220 - barHeight} width="24" height="2" rx="1" fill="#fff" opacity={0.5 * barProgress} />
                    </g>
                );
            })}
            {/* Trend line */}
            {progress > 0.3 && (
                <polyline
                    points={bars.map((h, i) => {
                        const lineProgress = Math.max(0, Math.min(1, (frame - 20) / 30));
                        const visibleBars = Math.floor(lineProgress * bars.length);
                        if (i > visibleBars) return '';
                        return `${62 + i * 34},${220 - h * 170}`;
                    }).filter(Boolean).join(' ')}
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.8"
                />
            )}
            {/* Arrow up indicator */}
            {progress > 0.7 && (
                <g opacity={Math.min(1, (frame - 40) / 10)}>
                    <polygon points="265,35 275,55 255,55" fill="#22c55e" />
                    <line x1="265" y1="55" x2="265" y2="75" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
                </g>
            )}
        </svg>
    );
};

const GlobeScene: React.FC<{ frame: number; fps: number; color: string }> = ({ frame, fps, color }) => {
    const id = useId();
    const rotation = (frame * 2) % 360;
    const pulse = 1 + Math.sin(frame * 0.05) * 0.02;

    return (
        <svg viewBox="0 0 300 300" width="100%" height="100%">
            <defs>
                <radialGradient id={`${id}-globeGrad`} cx="40%" cy="35%">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="60%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1e3a5f" />
                </radialGradient>
                <clipPath id={`${id}-globeClip`}>
                    <circle cx="150" cy="150" r={90 * pulse} />
                </clipPath>
            </defs>
            {/* Globe glow */}
            <circle cx="150" cy="155" r="95" fill={color} opacity="0.08" filter="blur(8px)" />
            {/* Globe body */}
            <circle cx="150" cy="150" r={90 * pulse} fill={`url(#${id}-globeGrad)`} />
            {/* Meridian lines */}
            <g clipPath={`url(#${id}-globeClip)`}>
                {[-60, -20, 20, 60].map((offset, i) => {
                    const x = 150 + offset + Math.sin(rotation * Math.PI / 180) * 30;
                    return (
                        <ellipse
                            key={`meridian-${i}`}
                            cx={x}
                            cy="150"
                            rx="15"
                            ry="90"
                            fill="none"
                            stroke="rgba(255,255,255,0.15)"
                            strokeWidth="1"
                        />
                    );
                })}
                {/* Latitude lines */}
                {[-40, 0, 40].map((offset, i) => (
                    <line
                        key={`lat-${i}`}
                        x1="60"
                        y1={150 + offset}
                        x2="240"
                        y2={150 + offset}
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="1"
                    />
                ))}
                {/* Continents (stylized) */}
                {[
                    { cx: 130 + Math.sin(rotation * Math.PI / 180) * 40, cy: 120, r: 20 },
                    { cx: 160 + Math.sin(rotation * Math.PI / 180) * 40, cy: 155, r: 15 },
                    { cx: 175 + Math.sin(rotation * Math.PI / 180) * 40, cy: 130, r: 12 },
                ].map((c, i) => (
                    <circle key={`cont-${i}`} cx={c.cx} cy={c.cy} r={c.r} fill="#22c55e" opacity="0.35" />
                ))}
            </g>
            {/* Specular highlight */}
            <ellipse cx="125" cy="120" rx="30" ry="40" fill="rgba(255,255,255,0.08)" />
            {/* Orbit ring */}
            <ellipse cx="150" cy="150" rx="120" ry="25" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="3,5" transform={`rotate(${-20}, 150, 150)`} />
            {/* Orbiting dot */}
            {(() => {
                const dotAngle = (frame * 3) * Math.PI / 180;
                return (
                    <circle
                        cx={150 + Math.cos(dotAngle) * 120}
                        cy={150 + Math.sin(dotAngle) * 25}
                        r="3"
                        fill="#f59e0b"
                        opacity="0.8"
                    />
                );
            })()}
        </svg>
    );
};

const RocketScene: React.FC<{ frame: number; fps: number; color: string }> = ({ frame, fps, color }) => {
    const launchProgress = Math.min(1, frame / 35);
    const rocketY = 220 - launchProgress * 160;
    const shake = launchProgress < 1 ? Math.sin(frame * 2) * 2 : 0;
    const flameFlicker = Math.sin(frame * 0.8) * 0.3 + 0.7;

    return (
        <svg viewBox="0 0 300 300" width="100%" height="100%">
            {/* Stars */}
            {[...Array(15)].map((_, i) => (
                <circle
                    key={`star-${i}`}
                    cx={20 + (i * 53) % 270}
                    cy={10 + (i * 37) % 270}
                    r={0.5 + (i % 2)}
                    fill="#fff"
                    opacity={0.2 + Math.sin(frame * 0.1 + i * 2) * 0.2}
                />
            ))}
            {/* Smoke trail */}
            {launchProgress > 0.1 && [...Array(8)].map((_, i) => {
                const smokeDelay = i * 3;
                const smokeFrame = Math.max(0, frame - smokeDelay);
                const smokeY = rocketY + 40 + i * 20;
                const smokeOpacity = Math.max(0, 0.3 - i * 0.035);
                const smokeR = 8 + smokeFrame * 0.3 + i * 4;
                return (
                    <circle
                        key={`smoke-${i}`}
                        cx={150 + Math.sin(smokeFrame * 0.2 + i) * 8 + shake}
                        cy={Math.min(280, smokeY)}
                        r={smokeR}
                        fill="rgba(200,200,200,0.15)"
                        opacity={smokeOpacity}
                    />
                );
            })}
            {/* Rocket body */}
            <g transform={`translate(${150 + shake}, ${rocketY})`}>
                {/* Flame */}
                {launchProgress > 0 && (
                    <>
                        <ellipse cx="0" cy="40" rx={8 * flameFlicker} ry={20 + flameFlicker * 10} fill="#f97316" opacity="0.8" />
                        <ellipse cx="0" cy="38" rx={5 * flameFlicker} ry={14 + flameFlicker * 6} fill="#fbbf24" opacity="0.9" />
                        <ellipse cx="0" cy="35" rx={3 * flameFlicker} ry={8} fill="#fef3c7" opacity="0.9" />
                    </>
                )}
                {/* Fins */}
                <polygon points="-8,25 -20,38 -8,30" fill="#ef4444" />
                <polygon points="8,25 20,38 8,30" fill="#dc2626" />
                {/* Body */}
                <rect x="-10" y="-15" width="20" height="45" rx="3" fill="linear-gradient(#e5e7eb, #d1d5db)" />
                <rect x="-10" y="-15" width="20" height="45" rx="3" fill="#e5e7eb" />
                <rect x="-10" y="5" width="20" height="8" fill="#3b82f6" />
                {/* Nose cone */}
                <polygon points="0,-35 -10,-15 10,-15" fill="#ef4444" />
                {/* Window */}
                <circle cx="0" cy="-2" r="5" fill="#1e3a5f" />
                <circle cx="0" cy="-2" r="4" fill="#60a5fa" opacity="0.6" />
                <circle cx="-1" cy="-3" r="1.5" fill="rgba(255,255,255,0.4)" />
            </g>
            {/* Speed lines */}
            {launchProgress > 0.3 && [...Array(5)].map((_, i) => {
                const lineY = rocketY + 50 + i * 15;
                return (
                    <line
                        key={`speed-${i}`}
                        x1={120 + i * 8}
                        y1={lineY}
                        x2={120 + i * 8}
                        y2={lineY + 12 + i * 3}
                        stroke="rgba(255,255,255,0.15)"
                        strokeWidth="1"
                        strokeLinecap="round"
                    />
                );
            })}
        </svg>
    );
};

const BrainIdeaScene: React.FC<{ frame: number; fps: number; color: string }> = ({ frame, fps, color }) => {
    const bulbGlow = Math.sin(frame * 0.12) * 0.3 + 0.7;
    const pulseRing = (frame * 2) % 60;
    const sparkle = frame > 20;

    return (
        <svg viewBox="0 0 300 300" width="100%" height="100%">
            {/* Brain (simplified, stylized) */}
            <g transform="translate(100, 110)">
                {/* Left hemisphere */}
                <path
                    d="M50,80 C20,80 0,60 0,40 C0,15 15,0 35,0 C42,0 48,2 53,5"
                    fill="none"
                    stroke="#f0abfc"
                    strokeWidth="3"
                    opacity="0.7"
                />
                <path
                    d="M5,50 C15,55 25,45 35,50"
                    fill="none"
                    stroke="#f0abfc"
                    strokeWidth="2"
                    opacity="0.4"
                />
                <path
                    d="M10,30 C20,25 30,35 40,30"
                    fill="none"
                    stroke="#f0abfc"
                    strokeWidth="2"
                    opacity="0.4"
                />
                {/* Right hemisphere */}
                <path
                    d="M50,80 C80,80 100,60 100,40 C100,15 85,0 65,0 C58,0 52,2 47,5"
                    fill="none"
                    stroke="#c084fc"
                    strokeWidth="3"
                    opacity="0.7"
                />
                <path
                    d="M60,50 C70,55 80,45 95,50"
                    fill="none"
                    stroke="#c084fc"
                    strokeWidth="2"
                    opacity="0.4"
                />
                <path
                    d="M60,30 C70,25 80,35 90,30"
                    fill="none"
                    stroke="#c084fc"
                    strokeWidth="2"
                    opacity="0.4"
                />
                {/* Neural connections */}
                {[...Array(6)].map((_, i) => {
                    const nx = 20 + (i * 15) % 70;
                    const ny = 15 + (i * 20) % 55;
                    return (
                        <circle
                            key={`node-${i}`}
                            cx={nx}
                            cy={ny}
                            r="2"
                            fill="#e9d5ff"
                            opacity={0.4 + Math.sin(frame * 0.15 + i) * 0.3}
                        />
                    );
                })}
            </g>
            {/* Lightbulb above brain */}
            <g transform="translate(150, 70)">
                {/* Glow */}
                <circle cx="0" cy="0" r={30 + bulbGlow * 10} fill="#fbbf24" opacity={bulbGlow * 0.15} />
                <circle cx="0" cy="0" r={20 + bulbGlow * 5} fill="#fbbf24" opacity={bulbGlow * 0.2} />
                {/* Bulb body */}
                <circle cx="0" cy="0" r="18" fill="#fef3c7" opacity="0.9" />
                <circle cx="0" cy="0" r="14" fill="#fbbf24" opacity={bulbGlow} />
                {/* Filament */}
                <path d="M-4,5 C-2,-2 2,-2 4,5" fill="none" stroke="#f59e0b" strokeWidth="2" />
                {/* Base */}
                <rect x="-6" y="16" width="12" height="8" rx="2" fill="#9ca3af" />
                <line x1="-5" y1="19" x2="5" y2="19" stroke="#6b7280" strokeWidth="1" />
                <line x1="-5" y1="22" x2="5" y2="22" stroke="#6b7280" strokeWidth="1" />
            </g>
            {/* Pulse rings */}
            {sparkle && (
                <>
                    <circle cx="150" cy="70" r={pulseRing} fill="none" stroke="#fbbf24" strokeWidth="1.5" opacity={Math.max(0, 1 - pulseRing / 60)} />
                    <circle cx="150" cy="70" r={Math.max(0, pulseRing - 15)} fill="none" stroke="#fbbf24" strokeWidth="1" opacity={Math.max(0, 0.6 - pulseRing / 60)} />
                </>
            )}
            {/* Sparkles */}
            {sparkle && [...Array(4)].map((_, i) => {
                const sAngle = (i * 90 + frame * 3) * Math.PI / 180;
                const sR = 50 + Math.sin(frame * 0.1 + i) * 10;
                return (
                    <text
                        key={`sparkle-${i}`}
                        x={150 + Math.cos(sAngle) * sR}
                        y={70 + Math.sin(sAngle) * sR}
                        fontSize="12"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        opacity={0.5 + Math.sin(frame * 0.2 + i) * 0.3}
                    >
                        ✦
                    </text>
                );
            })}
        </svg>
    );
};

const ConnectionsScene: React.FC<{ frame: number; fps: number; color: string }> = ({ frame, fps, color }) => {
    const nodes = [
        { x: 150, y: 80 }, { x: 80, y: 140 }, { x: 220, y: 140 },
        { x: 60, y: 220 }, { x: 150, y: 200 }, { x: 240, y: 220 },
        { x: 110, y: 260 }, { x: 190, y: 260 },
    ];
    const edges = [
        [0, 1], [0, 2], [1, 3], [1, 4], [2, 4], [2, 5], [3, 6], [4, 6], [4, 7], [5, 7],
    ];

    return (
        <svg viewBox="0 0 300 300" width="100%" height="100%">
            {/* Edges */}
            {edges.map(([a, b], i) => {
                const edgeProgress = Math.max(0, Math.min(1, (frame - i * 3) / 12));
                return (
                    <line
                        key={`edge-${i}`}
                        x1={nodes[a].x}
                        y1={nodes[a].y}
                        x2={nodes[a].x + (nodes[b].x - nodes[a].x) * edgeProgress}
                        y2={nodes[a].y + (nodes[b].y - nodes[a].y) * edgeProgress}
                        stroke={color}
                        strokeWidth="1.5"
                        opacity={0.3 + edgeProgress * 0.3}
                        strokeLinecap="round"
                    />
                );
            })}
            {/* Data pulse along edges */}
            {edges.map(([a, b], i) => {
                const pulsePos = ((frame * 0.04 + i * 0.15) % 1);
                const px = nodes[a].x + (nodes[b].x - nodes[a].x) * pulsePos;
                const py = nodes[a].y + (nodes[b].y - nodes[a].y) * pulsePos;
                return (
                    <circle
                        key={`pulse-${i}`}
                        cx={px}
                        cy={py}
                        r="2"
                        fill="#22d3ee"
                        opacity={0.6}
                    />
                );
            })}
            {/* Nodes */}
            {nodes.map((node, i) => {
                const nodeProgress = Math.max(0, Math.min(1, (frame - i * 2) / 10));
                const nodePulse = 1 + Math.sin(frame * 0.1 + i) * 0.1;
                return (
                    <g key={`node-${i}`}>
                        <circle cx={node.x} cy={node.y} r={12 * nodePulse} fill={color} opacity={0.15 * nodeProgress} />
                        <circle cx={node.x} cy={node.y} r={8 * nodeProgress} fill={color} opacity={0.7} />
                        <circle cx={node.x} cy={node.y} r={5 * nodeProgress} fill="#fff" opacity={0.3} />
                    </g>
                );
            })}
        </svg>
    );
};

const ClockScene: React.FC<{ frame: number; fps: number; color: string }> = ({ frame, fps, color }) => {
    const hourAngle = (frame * 1.5) % 360;
    const minuteAngle = (frame * 6) % 360;
    const secondAngle = (frame * 12) % 360;
    const tickPulse = Math.sin(frame * 0.5) * 0.1 + 0.9;

    return (
        <svg viewBox="0 0 300 300" width="100%" height="100%">
            {/* Clock face glow */}
            <circle cx="150" cy="150" r="115" fill={color} opacity="0.06" />
            {/* Clock face */}
            <circle cx="150" cy="150" r="105" fill="rgba(15,23,42,0.6)" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
            <circle cx="150" cy="150" r="100" fill="none" stroke={color} strokeWidth="1" opacity="0.3" />
            {/* Hour markers */}
            {[...Array(12)].map((_, i) => {
                const angle = (i * 30 - 90) * Math.PI / 180;
                const isMain = i % 3 === 0;
                return (
                    <line
                        key={`mark-${i}`}
                        x1={150 + Math.cos(angle) * (isMain ? 82 : 88)}
                        y1={150 + Math.sin(angle) * (isMain ? 82 : 88)}
                        x2={150 + Math.cos(angle) * 95}
                        y2={150 + Math.sin(angle) * 95}
                        stroke={isMain ? '#e2e8f0' : 'rgba(255,255,255,0.3)'}
                        strokeWidth={isMain ? 3 : 1.5}
                        strokeLinecap="round"
                    />
                );
            })}
            {/* Hour hand */}
            <line
                x1="150" y1="150"
                x2={150 + Math.cos((hourAngle - 90) * Math.PI / 180) * 50}
                y2={150 + Math.sin((hourAngle - 90) * Math.PI / 180) * 50}
                stroke="#e2e8f0" strokeWidth="4" strokeLinecap="round"
            />
            {/* Minute hand */}
            <line
                x1="150" y1="150"
                x2={150 + Math.cos((minuteAngle - 90) * Math.PI / 180) * 70}
                y2={150 + Math.sin((minuteAngle - 90) * Math.PI / 180) * 70}
                stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round"
            />
            {/* Second hand */}
            <line
                x1={150 - Math.cos((secondAngle - 90) * Math.PI / 180) * 15}
                y1={150 - Math.sin((secondAngle - 90) * Math.PI / 180) * 15}
                x2={150 + Math.cos((secondAngle - 90) * Math.PI / 180) * 80}
                y2={150 + Math.sin((secondAngle - 90) * Math.PI / 180) * 80}
                stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"
            />
            {/* Center dot */}
            <circle cx="150" cy="150" r="5" fill="#e2e8f0" />
            <circle cx="150" cy="150" r="3" fill="#ef4444" />
        </svg>
    );
};

const HeartbeatScene: React.FC<{ frame: number; fps: number; color: string }> = ({ frame, fps, color }) => {
    const id = useId();
    const heartScale = 1 + Math.sin(frame * 0.3) * 0.15;
    const lineOffset = (frame * 4) % 300;

    // Generate EKG-like waveform
    const generatePath = (xOffset: number) => {
        let path = `M ${-50 + xOffset} 150`;
        const segments = 40;
        for (let i = 0; i < segments; i++) {
            const x = -50 + xOffset + i * 10;
            let y = 150;
            const pos = (i + xOffset / 10) % 20;
            if (pos === 8) y = 150;
            else if (pos === 9) y = 110;
            else if (pos === 10) y = 180;
            else if (pos === 11) y = 90;
            else if (pos === 12) y = 160;
            else if (pos === 13) y = 150;
            path += ` L ${x} ${y}`;
        }
        return path;
    };

    return (
        <svg viewBox="0 0 300 300" width="100%" height="100%">
            {/* Background pulse */}
            <circle cx="150" cy="120" r={50 * heartScale} fill="#ef4444" opacity="0.06" />
            <circle cx="150" cy="120" r={35 * heartScale} fill="#ef4444" opacity="0.1" />
            {/* Heart */}
            <g transform={`translate(150, 115) scale(${heartScale * 0.4})`}>
                <path
                    d="M0,30 C0,30 -60,-20 -60,-50 C-60,-80 -20,-90 0,-60 C20,-90 60,-80 60,-50 C60,-20 0,30 0,30Z"
                    fill="#ef4444"
                    opacity="0.85"
                />
                <path
                    d="M-15,-45 C-15,-55 -5,-60 0,-50"
                    fill="none"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="3"
                    strokeLinecap="round"
                />
            </g>
            {/* EKG line */}
            <g>
                <clipPath id={`${id}-ekgClip`}>
                    <rect x="20" y="70" width="260" height="160" />
                </clipPath>
                <g clipPath={`url(#${id}-ekgClip)`}>
                    <path
                        d={generatePath(-lineOffset)}
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.8"
                    />
                    {/* Glow effect */}
                    <path
                        d={generatePath(-lineOffset)}
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.15"
                    />
                </g>
            </g>
            {/* BPM text */}
            <text x="240" y="250" fill="#22c55e" fontSize="14" fontFamily="monospace" opacity="0.7" textAnchor="end">
                {72 + Math.floor(Math.sin(frame * 0.05) * 5)} BPM
            </text>
        </svg>
    );
};

const MoneyFlowScene: React.FC<{ frame: number; fps: number; color: string }> = ({ frame, fps, color }) => {
    const coins = [...Array(8)].map((_, i) => ({
        x: 50 + (i * 37) % 220,
        startY: -20 - i * 25,
        speed: 1.5 + (i % 3) * 0.5,
        wobble: Math.sin(frame * 0.1 + i * 1.5) * 15,
        rotation: (frame * 3 + i * 45) % 360,
        size: 18 + (i % 3) * 4,
    }));

    return (
        <svg viewBox="0 0 300 300" width="100%" height="100%">
            {/* Background glow */}
            <circle cx="150" cy="150" r="100" fill="#22c55e" opacity="0.04" />
            {/* Coins falling */}
            {coins.map((coin, i) => {
                const y = (coin.startY + frame * coin.speed * 2) % 340;
                const opacity = y < 20 ? y / 20 : y > 280 ? (300 - y) / 20 : 0.85;
                const scaleX = Math.cos(coin.rotation * Math.PI / 180);
                return (
                    <g key={`coin-${i}`} transform={`translate(${coin.x + coin.wobble}, ${y})`} opacity={Math.max(0, opacity)}>
                        {/* Coin shadow */}
                        <ellipse cx="2" cy={coin.size + 5} rx={coin.size * 0.4} ry="3" fill="rgba(0,0,0,0.15)" />
                        {/* Coin body */}
                        <ellipse cx="0" cy="0" rx={coin.size * Math.abs(scaleX)} ry={coin.size} fill="#fbbf24" />
                        {Math.abs(scaleX) > 0.3 && (
                            <>
                                <ellipse cx="0" cy="0" rx={coin.size * Math.abs(scaleX) * 0.7} ry={coin.size * 0.7} fill="none" stroke="#f59e0b" strokeWidth="1.5" />
                                <text x="0" y="5" textAnchor="middle" fontSize={coin.size * 0.7} fill="#92400e" fontWeight="bold" transform={`scale(${Math.abs(scaleX)}, 1)`}>$</text>
                            </>
                        )}
                        {/* Shine */}
                        <ellipse cx={-coin.size * 0.2 * scaleX} cy={-coin.size * 0.3} rx={coin.size * 0.15 * Math.abs(scaleX)} ry={coin.size * 0.2} fill="rgba(255,255,255,0.3)" />
                    </g>
                );
            })}
            {/* Dollar signs floating up */}
            {[...Array(3)].map((_, i) => {
                const floatY = 280 - ((frame * 1.2 + i * 60) % 200);
                return (
                    <text
                        key={`dollar-${i}`}
                        x={80 + i * 70 + Math.sin(frame * 0.05 + i) * 10}
                        y={floatY}
                        fontSize="24"
                        fill="#22c55e"
                        opacity={Math.max(0, Math.min(0.4, (280 - floatY) / 100))}
                        textAnchor="middle"
                        fontWeight="bold"
                    >
                        $
                    </text>
                );
            })}
        </svg>
    );
};

const LightningScene: React.FC<{ frame: number; fps: number; color: string }> = ({ frame, fps, color }) => {
    const strikePhase = (frame % 50);
    const isStriking = strikePhase < 8;
    const flashOpacity = isStriking ? Math.max(0, 1 - strikePhase / 8) * 0.3 : 0;
    const boltOpacity = isStriking ? Math.max(0, 1 - strikePhase / 12) : 0.1;
    const glowPulse = 0.3 + Math.sin(frame * 0.15) * 0.15;

    return (
        <svg viewBox="0 0 300 300" width="100%" height="100%">
            {/* Flash background */}
            <rect x="0" y="0" width="300" height="300" fill="#fbbf24" opacity={flashOpacity} />
            {/* Cloud */}
            <g opacity="0.5">
                <ellipse cx="150" cy="60" rx="80" ry="30" fill="#64748b" />
                <ellipse cx="110" cy="55" rx="40" ry="25" fill="#475569" />
                <ellipse cx="190" cy="55" rx="45" ry="28" fill="#475569" />
                <ellipse cx="150" cy="50" rx="60" ry="22" fill="#94a3b8" />
            </g>
            {/* Main lightning bolt */}
            <g opacity={isStriking ? 1 : 0.2 + glowPulse}>
                {/* Bolt glow */}
                <path
                    d="M150,80 L135,140 L155,140 L130,210 L175,150 L150,150 L170,80Z"
                    fill="#fbbf24"
                    opacity={isStriking ? 0.4 : 0.1}
                    filter="blur(6px)"
                />
                {/* Bolt */}
                <path
                    d="M150,80 L135,140 L155,140 L130,210 L175,150 L150,150 L170,80Z"
                    fill="#fbbf24"
                    stroke="#f59e0b"
                    strokeWidth="1"
                />
                {/* Inner bright line */}
                <path
                    d="M155,85 L143,135 L158,138 L140,195"
                    fill="none"
                    stroke="#fef3c7"
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity={isStriking ? 0.8 : 0.3}
                />
            </g>
            {/* Branch bolts */}
            {isStriking && (
                <>
                    <path d="M145,130 L110,165" fill="none" stroke="#fbbf24" strokeWidth="2" opacity={boltOpacity * 0.6} />
                    <path d="M160,145 L200,170 L185,190" fill="none" stroke="#fbbf24" strokeWidth="1.5" opacity={boltOpacity * 0.4} />
                </>
            )}
            {/* Electric sparks */}
            {[...Array(6)].map((_, i) => {
                const sparkAngle = (frame * 5 + i * 60) * Math.PI / 180;
                const sparkR = 15 + Math.sin(frame * 0.3 + i) * 8;
                return (
                    <circle
                        key={`spark-${i}`}
                        cx={150 + Math.cos(sparkAngle) * sparkR}
                        cy={210 + Math.sin(sparkAngle) * sparkR * 0.5}
                        r="1.5"
                        fill="#fbbf24"
                        opacity={isStriking ? 0.8 : 0}
                    />
                );
            })}
            {/* Ground impact glow */}
            {isStriking && (
                <ellipse cx="150" cy="220" rx={30 + strikePhase * 3} ry={5 + strikePhase} fill="#fbbf24" opacity={boltOpacity * 0.3} />
            )}
            {/* Energy text */}
            <text x="150" y="270" textAnchor="middle" fontSize="16" fill="#fbbf24" fontWeight="bold" fontFamily="monospace" opacity={0.3 + glowPulse}>
                ⚡ POWER
            </text>
        </svg>
    );
};

// ==================== NEW B-ROLL SCENE COMPONENTS ====================

const ShoppingCartScene: React.FC<{ frame: number; fps: number; color: string }> = ({ frame, fps, color }) => {
    const cartBounce = Math.sin(frame * 0.15) * 3;
    const wheelRotation = (frame * 8) % 360;
    const itemDrop = Math.min(1, frame / 25);

    return (
        <svg viewBox="0 0 400 400" width="100%" height="100%">
            <rect x="0" y="0" width="400" height="400" fill="#0f172a" />
            {/* Floor line */}
            <line x1="40" y1="320" x2="360" y2="320" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
            {/* Cart body */}
            <g transform={`translate(200, ${280 + cartBounce})`}>
                {/* Cart basket */}
                <path d="M-50,-80 L-60,-10 L60,-10 L50,-80Z" fill="none" stroke={color} strokeWidth="3" opacity="0.8" />
                <path d="M-55,-45 L55,-45" fill="none" stroke={color} strokeWidth="1" opacity="0.3" />
                {/* Handle */}
                <path d="M50,-80 L70,-95 L75,-80" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
                {/* Wheels */}
                <circle cx="-35" cy="-5" r="12" fill="none" stroke={color} strokeWidth="2.5" />
                <line x1="-35" y1="-17" x2="-35" y2="7" stroke={color} strokeWidth="1.5" transform={`rotate(${wheelRotation}, -35, -5)`} />
                <circle cx="35" cy="-5" r="12" fill="none" stroke={color} strokeWidth="2.5" />
                <line x1="35" y1="-17" x2="35" y2="7" stroke={color} strokeWidth="1.5" transform={`rotate(${wheelRotation}, 35, -5)`} />
                {/* Items in cart */}
                {itemDrop > 0.3 && <rect x="-30" y={-70 + (1 - Math.min(1, (itemDrop - 0.3) * 3)) * -40} width="25" height="20" rx="3" fill="#f59e0b" opacity={Math.min(1, (itemDrop - 0.3) * 3)} />}
                {itemDrop > 0.5 && <circle cx="10" cy={-60 + (1 - Math.min(1, (itemDrop - 0.5) * 3)) * -40} r="12" fill="#22c55e" opacity={Math.min(1, (itemDrop - 0.5) * 3)} />}
                {itemDrop > 0.7 && <rect x="-10" y={-45 + (1 - Math.min(1, (itemDrop - 0.7) * 3)) * -40} width="30" height="15" rx="3" fill="#3b82f6" opacity={Math.min(1, (itemDrop - 0.7) * 3)} />}
            </g>
            {/* Price tags floating */}
            {[...Array(3)].map((_, i) => {
                const floatY = 100 + Math.sin(frame * 0.08 + i * 2) * 20;
                return (
                    <text key={`price-${i}`} x={100 + i * 100} y={floatY} fontSize="18" fill={color} opacity={0.3 + Math.sin(frame * 0.1 + i) * 0.15} textAnchor="middle" fontFamily="monospace">
                        ${(9.99 + i * 5).toFixed(2)}
                    </text>
                );
            })}
        </svg>
    );
};

const CookingScene: React.FC<{ frame: number; fps: number; color: string }> = ({ frame, fps, color }) => {
    const steamWave = Math.sin(frame * 0.1);
    const stirAngle = Math.sin(frame * 0.12) * 25;
    const flameDance = Math.sin(frame * 0.4) * 0.3 + 0.7;

    return (
        <svg viewBox="0 0 400 400" width="100%" height="100%">
            <rect x="0" y="0" width="400" height="400" fill="#1a0f0a" />
            {/* Stove burner glow */}
            <ellipse cx="200" cy="310" rx="80" ry="15" fill="#ef4444" opacity={flameDance * 0.3} />
            {/* Flames */}
            {[...Array(5)].map((_, i) => (
                <ellipse key={`flame-${i}`} cx={170 + i * 15} cy={295 - Math.sin(frame * 0.3 + i) * 8} rx={6 + Math.sin(frame * 0.5 + i) * 2} ry={15 + Math.sin(frame * 0.4 + i) * 5} fill="#f97316" opacity={flameDance * 0.6} />
            ))}
            {/* Pan */}
            <ellipse cx="200" cy="280" rx="85" ry="20" fill="#44403c" />
            <ellipse cx="200" cy="275" rx="80" ry="18" fill="#57534e" />
            <line x1="280" y1="278" x2="340" y2="265" stroke="#78716c" strokeWidth="8" strokeLinecap="round" />
            {/* Food items in pan */}
            <circle cx="175" cy="272" r="10" fill="#ef4444" opacity="0.8" />
            <circle cx="200" cy="268" r="8" fill="#22c55e" opacity="0.7" />
            <circle cx="220" cy="273" r="9" fill="#eab308" opacity="0.75" />
            {/* Spatula */}
            <g transform={`translate(200, 250) rotate(${stirAngle})`}>
                <line x1="0" y1="0" x2="-30" y2="-60" stroke="#a8a29e" strokeWidth="4" strokeLinecap="round" />
                <rect x="-38" y="-75" width="16" height="20" rx="3" fill="#d6d3d1" />
            </g>
            {/* Steam */}
            {[...Array(4)].map((_, i) => {
                const steamY = 200 - ((frame * 1.5 + i * 20) % 120);
                const steamX = 175 + i * 20 + Math.sin(frame * 0.05 + i) * 15;
                return (
                    <ellipse key={`steam-${i}`} cx={steamX} cy={steamY} rx={8 + Math.sin(frame * 0.1 + i) * 3} ry={12 + Math.sin(frame * 0.08 + i) * 4} fill="rgba(255,255,255,0.08)" opacity={Math.max(0, 1 - (200 - steamY) / 120)} />
                );
            })}
        </svg>
    );
};

const NatureTreeScene: React.FC<{ frame: number; fps: number; color: string }> = ({ frame, fps, color }) => {
    const id = useId();
    const windSway = Math.sin(frame * 0.06) * 5;
    const leafDrift = (frame * 0.8) % 400;
    const sunGlow = 0.5 + Math.sin(frame * 0.04) * 0.2;

    return (
        <svg viewBox="0 0 400 400" width="100%" height="100%">
            {/* Sky gradient */}
            <defs>
                <linearGradient id={`${id}-skyGrad`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0c4a6e" />
                    <stop offset="100%" stopColor="#164e63" />
                </linearGradient>
            </defs>
            <rect x="0" y="0" width="400" height="400" fill={`url(#${id}-skyGrad)`} />
            {/* Sun */}
            <circle cx="320" cy="80" r={40 + sunGlow * 5} fill="#fbbf24" opacity={sunGlow * 0.15} />
            <circle cx="320" cy="80" r="25" fill="#fbbf24" opacity="0.6" />
            {/* Ground */}
            <ellipse cx="200" cy="380" rx="250" ry="60" fill="#166534" opacity="0.6" />
            {/* Tree trunk */}
            <rect x="185" y="220" width="30" height="140" rx="5" fill="#78350f" />
            <rect x="190" y="220" width="8" height="140" fill="#92400e" opacity="0.5" />
            {/* Tree canopy layers */}
            <g transform={`translate(${windSway}, 0)`}>
                <ellipse cx="200" cy="180" rx="90" ry="70" fill="#15803d" opacity="0.9" />
                <ellipse cx="180" cy="160" rx="60" ry="50" fill="#16a34a" opacity="0.7" />
                <ellipse cx="220" cy="170" rx="55" ry="45" fill="#22c55e" opacity="0.5" />
                {/* Highlights */}
                <ellipse cx="195" cy="140" rx="25" ry="20" fill="#4ade80" opacity="0.3" />
            </g>
            {/* Birds */}
            {[...Array(3)].map((_, i) => {
                const bx = (100 + i * 80 + frame * 0.5) % 420 - 10;
                const by = 60 + i * 25 + Math.sin(frame * 0.15 + i) * 10;
                return (
                    <path key={`bird-${i}`} d={`M${bx},${by} Q${bx + 5},${by - 5} ${bx + 10},${by} Q${bx + 15},${by - 5} ${bx + 20},${by}`} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
                );
            })}
            {/* Falling leaves */}
            {[...Array(3)].map((_, i) => {
                const lx = 150 + i * 50 + Math.sin(frame * 0.07 + i * 3) * 30 + windSway;
                const ly = (leafDrift + i * 100) % 350;
                return <ellipse key={`leaf-${i}`} cx={lx} cy={ly} rx="4" ry="6" fill="#22c55e" opacity={Math.max(0.1, 0.5 - ly / 600)} transform={`rotate(${frame * 2 + i * 60}, ${lx}, ${ly})`} />;
            })}
        </svg>
    );
};

const CitySkylineScene: React.FC<{ frame: number; fps: number; color: string }> = ({ frame, fps, color }) => {
    const windowBlink = (i: number) => Math.sin(frame * 0.1 + i * 1.7) > 0.3 ? 0.7 : 0.15;
    const carX = (frame * 2) % 440 - 20;

    return (
        <svg viewBox="0 0 400 400" width="100%" height="100%">
            <rect x="0" y="0" width="400" height="400" fill="#0f172a" />
            {/* Stars */}
            {[...Array(15)].map((_, i) => (
                <circle key={`star-${i}`} cx={20 + (i * 67) % 380} cy={10 + (i * 31) % 120} r={0.8 + (i % 2)} fill="#fff" opacity={0.2 + Math.sin(frame * 0.08 + i) * 0.15} />
            ))}
            {/* Moon */}
            <circle cx="340" cy="60" r="20" fill="#e2e8f0" opacity="0.7" />
            <circle cx="348" cy="55" r="18" fill="#0f172a" />
            {/* Buildings */}
            {[
                { x: 30, w: 50, h: 180, color: '#1e293b' },
                { x: 90, w: 40, h: 220, color: '#1e3a5f' },
                { x: 140, w: 60, h: 260, color: '#172554' },
                { x: 210, w: 55, h: 200, color: '#1e293b' },
                { x: 275, w: 45, h: 240, color: '#1e3a5f' },
                { x: 330, w: 50, h: 190, color: '#172554' },
            ].map((b, bi) => (
                <g key={`bld-${bi}`}>
                    <rect x={b.x} y={350 - b.h} width={b.w} height={b.h} fill={b.color} />
                    {/* Windows */}
                    {[...Array(Math.floor(b.h / 25))].map((_, wi) => (
                        [...Array(Math.floor(b.w / 15))].map((_, wj) => (
                            <rect key={`win-${bi}-${wi}-${wj}`} x={b.x + 5 + wj * 14} y={355 - b.h + 8 + wi * 24} width="8" height="12" rx="1" fill="#fbbf24" opacity={windowBlink(bi * 10 + wi * 3 + wj)} />
                        ))
                    ))}
                </g>
            ))}
            {/* Ground */}
            <rect x="0" y="345" width="400" height="55" fill="#1e293b" />
            <line x1="0" y1="350" x2="400" y2="350" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            {/* Car */}
            <g transform={`translate(${carX}, 335)`}>
                <rect x="0" y="0" width="30" height="10" rx="4" fill="#ef4444" opacity="0.8" />
                <circle cx="7" cy="12" r="3" fill="#fbbf24" opacity="0.5" />
                <circle cx="23" cy="12" r="3" fill="#fbbf24" opacity="0.5" />
                {/* Headlights */}
                <circle cx="30" cy="5" r="2" fill="#fff" opacity="0.8" />
            </g>
        </svg>
    );
};

const PersonWalkingScene: React.FC<{ frame: number; fps: number; color: string }> = ({ frame, fps, color }) => {
    const walkCycle = Math.sin(frame * 0.2);
    const legSwing = walkCycle * 20;
    const armSwing = -walkCycle * 15;
    const bodyBob = Math.abs(Math.sin(frame * 0.2)) * 3;

    return (
        <svg viewBox="0 0 400 400" width="100%" height="100%">
            <rect x="0" y="0" width="400" height="400" fill="#0f172a" />
            {/* Walking path */}
            <line x1="40" y1="320" x2="360" y2="320" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="8,4" />
            {/* Person */}
            <g transform={`translate(200, ${260 - bodyBob})`}>
                {/* Shadow */}
                <ellipse cx="0" cy="62" rx="25" ry="5" fill="rgba(0,0,0,0.3)" />
                {/* Head */}
                <circle cx="0" cy="-30" r="18" fill={color} opacity="0.85" />
                <circle cx="-4" cy="-33" r="3" fill="rgba(255,255,255,0.3)" />
                {/* Body */}
                <line x1="0" y1="-12" x2="0" y2="25" stroke={color} strokeWidth="5" strokeLinecap="round" />
                {/* Arms */}
                <line x1="0" y1="0" x2={-15 + armSwing * 0.5} y2={20 + Math.abs(armSwing) * 0.3} stroke={color} strokeWidth="3.5" strokeLinecap="round" transform={`rotate(${armSwing}, 0, 0)`} />
                <line x1="0" y1="0" x2={15 - armSwing * 0.5} y2={20 + Math.abs(armSwing) * 0.3} stroke={color} strokeWidth="3.5" strokeLinecap="round" transform={`rotate(${-armSwing}, 0, 0)`} />
                {/* Legs */}
                <line x1="0" y1="25" x2={-8} y2={55} stroke={color} strokeWidth="4" strokeLinecap="round" transform={`rotate(${legSwing}, 0, 25)`} />
                <line x1="0" y1="25" x2={8} y2={55} stroke={color} strokeWidth="4" strokeLinecap="round" transform={`rotate(${-legSwing}, 0, 25)`} />
            </g>
            {/* Footstep dots behind */}
            {[...Array(5)].map((_, i) => (
                <circle key={`step-${i}`} cx={80 + i * 25} cy={322} r="2" fill={color} opacity={0.1 + i * 0.05} />
            ))}
        </svg>
    );
};

const CelebrationScene: React.FC<{ frame: number; fps: number; color: string }> = ({ frame, fps, color }) => {
    const confettiPieces = [...Array(20)].map((_, i) => ({
        x: 30 + (i * 47) % 340,
        startY: -20 - (i * 23) % 100,
        speed: 1.2 + (i % 4) * 0.4,
        wobble: Math.sin(frame * 0.08 + i * 1.5) * 20,
        rotation: (frame * (3 + i % 5)) % 360,
        color: ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ec4899'][i % 6],
        size: 6 + (i % 3) * 3,
    }));

    return (
        <svg viewBox="0 0 400 400" width="100%" height="100%">
            <rect x="0" y="0" width="400" height="400" fill="#0f172a" />
            {/* Trophy */}
            <g transform="translate(200, 220)">
                {/* Base */}
                <rect x="-20" y="40" width="40" height="12" rx="3" fill="#f59e0b" opacity="0.7" />
                <rect x="-8" y="25" width="16" height="18" rx="2" fill="#f59e0b" opacity="0.8" />
                {/* Cup */}
                <path d="M-30,-20 C-30,25 30,25 30,-20Z" fill="#fbbf24" />
                <path d="M-25,-15 C-25,18 25,18 25,-15" fill="#f59e0b" opacity="0.4" />
                {/* Handles */}
                <path d="M-30,-10 C-45,-10 -45,10 -30,10" fill="none" stroke="#fbbf24" strokeWidth="4" />
                <path d="M30,-10 C45,-10 45,10 30,10" fill="none" stroke="#fbbf24" strokeWidth="4" />
                {/* Star */}
                <text x="0" y="-2" textAnchor="middle" fontSize="20" fill="#92400e">★</text>
                {/* Glow */}
                <circle cx="0" cy="0" r={60 + Math.sin(frame * 0.1) * 10} fill="#fbbf24" opacity={0.05 + Math.sin(frame * 0.08) * 0.03} />
            </g>
            {/* Confetti */}
            {confettiPieces.map((c, i) => {
                const y = (c.startY + frame * c.speed * 2) % 440;
                return (
                    <rect key={`conf-${i}`} x={c.x + c.wobble} y={y} width={c.size} height={c.size * 0.6} rx="1" fill={c.color} opacity={0.7} transform={`rotate(${c.rotation}, ${c.x + c.wobble + c.size / 2}, ${y + c.size * 0.3})`} />
                );
            })}
        </svg>
    );
};

const MusicNotesScene: React.FC<{ frame: number; fps: number; color: string }> = ({ frame, fps, color }) => {
    const barBounce = (i: number) => Math.sin(frame * 0.2 + i * 0.8) * 0.5 + 0.5;
    const noteFloat = (i: number) => Math.sin(frame * 0.08 + i * 2) * 15;

    return (
        <svg viewBox="0 0 400 400" width="100%" height="100%">
            <rect x="0" y="0" width="400" height="400" fill="#0f172a" />
            {/* Equalizer bars */}
            {[...Array(12)].map((_, i) => {
                const h = 30 + barBounce(i) * 120;
                return (
                    <rect key={`bar-${i}`} x={80 + i * 22} y={320 - h} width="14" height={h} rx="3" fill={color} opacity={0.4 + barBounce(i) * 0.4} />
                );
            })}
            {/* Floating musical notes */}
            {['♪', '♫', '♩', '♬'].map((note, i) => {
                const ny = 80 + noteFloat(i) + i * 30;
                const nx = 60 + i * 90 + Math.cos(frame * 0.05 + i) * 20;
                return (
                    <text key={`note-${i}`} x={nx} y={ny} fontSize={24 + i * 4} fill={color} opacity={0.3 + Math.sin(frame * 0.1 + i) * 0.2} textAnchor="middle">
                        {note}
                    </text>
                );
            })}
            {/* Sound wave circle */}
            <circle cx="200" cy="180" r={50 + Math.sin(frame * 0.15) * 10} fill="none" stroke={color} strokeWidth="1.5" opacity="0.15" />
            <circle cx="200" cy="180" r={70 + Math.sin(frame * 0.12) * 15} fill="none" stroke={color} strokeWidth="1" opacity="0.1" />
        </svg>
    );
};

const BookReadingScene: React.FC<{ frame: number; fps: number; color: string }> = ({ frame, fps, color }) => {
    const pageFlip = Math.sin(frame * 0.08) * 10;
    const glowPulse = 0.3 + Math.sin(frame * 0.06) * 0.15;

    return (
        <svg viewBox="0 0 400 400" width="100%" height="100%">
            <rect x="0" y="0" width="400" height="400" fill="#0f172a" />
            {/* Book glow */}
            <ellipse cx="200" cy="250" rx="120" ry="30" fill={color} opacity={glowPulse * 0.1} />
            {/* Book */}
            <g transform="translate(200, 230)">
                {/* Left page */}
                <path d={`M0,0 L-80,${10 + pageFlip * 0.3} L-80,${-70 + pageFlip * 0.3} L0,-60Z`} fill="#fef3c7" stroke="#e5e7eb" strokeWidth="1" />
                {/* Right page */}
                <path d={`M0,0 L80,${10 - pageFlip * 0.3} L80,${-70 - pageFlip * 0.3} L0,-60Z`} fill="#fefce8" stroke="#e5e7eb" strokeWidth="1" />
                {/* Text lines on left */}
                {[...Array(5)].map((_, i) => (
                    <line key={`tl-${i}`} x1="-70" y1={-50 + i * 12 + pageFlip * 0.2} x2="-10" y2={-50 + i * 12 + pageFlip * 0.2} stroke="#9ca3af" strokeWidth="1.5" opacity="0.3" />
                ))}
                {/* Text lines on right */}
                {[...Array(5)].map((_, i) => (
                    <line key={`tr-${i}`} x1="10" y1={-50 + i * 12 - pageFlip * 0.2} x2="70" y2={-50 + i * 12 - pageFlip * 0.2} stroke="#9ca3af" strokeWidth="1.5" opacity="0.3" />
                ))}
                {/* Spine shadow */}
                <line x1="0" y1="-60" x2="0" y2="0" stroke="rgba(0,0,0,0.2)" strokeWidth="3" />
            </g>
            {/* Knowledge particles rising */}
            {[...Array(6)].map((_, i) => {
                const py = 160 - ((frame * 0.8 + i * 30) % 150);
                const px = 160 + i * 20 + Math.sin(frame * 0.06 + i) * 15;
                return <circle key={`kp-${i}`} cx={px} cy={py} r="2" fill={color} opacity={Math.max(0, 0.5 - (160 - py) / 200)} />;
            })}
            {/* Lightbulb above */}
            <circle cx="200" cy="100" r={15 + Math.sin(frame * 0.1) * 3} fill="#fbbf24" opacity={glowPulse * 0.4} />
            <circle cx="200" cy="100" r="8" fill="#fbbf24" opacity={glowPulse * 0.7} />
        </svg>
    );
};

const CameraScene: React.FC<{ frame: number; fps: number; color: string }> = ({ frame, fps, color }) => {
    const shutterCycle = (frame % 60);
    const isFlashing = shutterCycle < 4;
    const lensZoom = 1 + Math.sin(frame * 0.06) * 0.05;
    const flashOpacity = isFlashing ? Math.max(0, 1 - shutterCycle / 4) * 0.3 : 0;

    return (
        <svg viewBox="0 0 400 400" width="100%" height="100%">
            <rect x="0" y="0" width="400" height="400" fill="#0f172a" />
            {/* Flash */}
            <rect x="0" y="0" width="400" height="400" fill="#fff" opacity={flashOpacity} />
            {/* Camera body */}
            <g transform="translate(200, 200)">
                <rect x="-80" y="-45" width="160" height="90" rx="10" fill="#374151" />
                <rect x="-75" y="-40" width="150" height="80" rx="8" fill="#1f2937" />
                {/* Lens */}
                <circle cx="0" cy="0" r={40 * lensZoom} fill="#111827" stroke="#4b5563" strokeWidth="3" />
                <circle cx="0" cy="0" r={32 * lensZoom} fill="#1e293b" stroke="#374151" strokeWidth="2" />
                <circle cx="0" cy="0" r={20 * lensZoom} fill="#0f172a" />
                {/* Lens reflection */}
                <circle cx={-8 * lensZoom} cy={-8 * lensZoom} r={6 * lensZoom} fill="rgba(255,255,255,0.1)" />
                {/* Aperture blades hint */}
                <circle cx="0" cy="0" r={14 * lensZoom} fill="none" stroke={color} strokeWidth="1" opacity="0.3" />
                {/* Flash unit */}
                <rect x="-30" y="-55" width="20" height="12" rx="3" fill={isFlashing ? '#fbbf24' : '#6b7280'} opacity={isFlashing ? 0.9 : 0.6} />
                {/* Viewfinder */}
                <rect x="50" y="-55" width="18" height="12" rx="2" fill="#374151" />
                {/* Shutter button */}
                <circle cx="45" cy="-50" r="6" fill="#4b5563" />
            </g>
            {/* Photo frames floating */}
            {[...Array(3)].map((_, i) => {
                const px = 60 + i * 120;
                const py = 320 + Math.sin(frame * 0.07 + i * 2) * 8;
                return (
                    <g key={`photo-${i}`}>
                        <rect x={px} y={py} width="40" height="30" rx="2" fill="#374151" opacity="0.4" />
                        <rect x={px + 3} y={py + 3} width="34" height="24" rx="1" fill={['#3b82f6', '#22c55e', '#f59e0b'][i]} opacity="0.2" />
                    </g>
                );
            })}
        </svg>
    );
};

const CodeTerminalScene: React.FC<{ frame: number; fps: number; color: string }> = ({ frame, fps, color }) => {
    const cursorBlink = Math.sin(frame * 0.3) > 0;
    const typedChars = Math.min(30, Math.floor(frame / 2));
    const codeLines = [
        'const app = createApp();',
        'app.use(router);',
        'app.listen(3000);',
        'console.log("Running!");',
    ];
    const currentLine = Math.min(3, Math.floor(frame / 20));
    const lineProgress = (frame % 20) / 20;

    return (
        <svg viewBox="0 0 400 400" width="100%" height="100%">
            {/* Terminal window */}
            <rect x="40" y="40" width="320" height="320" rx="10" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            {/* Title bar */}
            <rect x="40" y="40" width="320" height="30" rx="10" fill="#1e293b" />
            <rect x="40" y="60" width="320" height="10" fill="#1e293b" />
            {/* Traffic lights */}
            <circle cx="60" cy="55" r="5" fill="#ef4444" opacity="0.8" />
            <circle cx="78" cy="55" r="5" fill="#fbbf24" opacity="0.8" />
            <circle cx="96" cy="55" r="5" fill="#22c55e" opacity="0.8" />
            {/* Terminal title */}
            <text x="200" y="59" textAnchor="middle" fontSize="11" fill="#94a3b8" fontFamily="monospace">terminal</text>
            {/* Code lines */}
            {codeLines.map((line, i) => {
                if (i > currentLine) return null;
                const visibleChars = i < currentLine ? line.length : Math.floor(line.length * lineProgress);
                const displayText = line.substring(0, visibleChars);
                return (
                    <g key={`code-${i}`}>
                        {/* Line number */}
                        <text x="58" y={100 + i * 28} fontSize="12" fill="#475569" fontFamily="monospace">{i + 1}</text>
                        {/* Prompt */}
                        <text x="78" y={100 + i * 28} fontSize="12" fill="#22c55e" fontFamily="monospace">{'>'}</text>
                        {/* Code */}
                        <text x="92" y={100 + i * 28} fontSize="12" fill={color} fontFamily="monospace" opacity="0.9">{displayText}</text>
                    </g>
                );
            })}
            {/* Cursor */}
            {cursorBlink && (
                <rect x={92 + Math.min(codeLines[currentLine]?.length || 0, Math.floor((codeLines[currentLine]?.length || 0) * (currentLine < Math.floor(frame / 20) ? 1 : lineProgress))) * 7} y={88 + currentLine * 28} width="7" height="14" fill={color} opacity="0.7" />
            )}
            {/* Output area */}
            {currentLine >= 3 && (
                <g opacity={Math.min(1, (frame - 60) / 10)}>
                    <line x1="55" y1="200" x2="345" y2="200" stroke="#334155" strokeWidth="1" />
                    <text x="78" y="225" fontSize="12" fill="#22c55e" fontFamily="monospace" opacity="0.8">✓ Server running on port 3000</text>
                    <text x="78" y="250" fontSize="12" fill="#94a3b8" fontFamily="monospace" opacity="0.5">Ready for connections...</text>
                </g>
            )}
        </svg>
    );
};

// ==================== NEW ANIMATED SVG SCENE COMPONENTS ====================

const FireBlazeScene: React.FC<{ frame: number; fps: number; color: string }> = ({ frame, fps, color }) => {
    const id = useId();
    const flicker = Math.sin(frame * 0.4) * 0.3 + 0.7;
    const heatWave = Math.sin(frame * 0.08) * 3;

    return (
        <svg viewBox="0 0 300 300" width="100%" height="100%">
            <defs>
                <radialGradient id={`${id}-heatGlow`} cx="50%" cy="80%">
                    <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
                    <stop offset="60%" stopColor="#ef4444" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </radialGradient>
                <linearGradient id={`${id}-fireGrad`} x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#dc2626" />
                    <stop offset="40%" stopColor="#f97316" />
                    <stop offset="70%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#fef3c7" />
                </linearGradient>
                <filter id={`${id}-glow`}>
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            {/* Heat distortion glow */}
            <ellipse cx="150" cy="220" rx="130" ry="100" fill={`url(#${id}-heatGlow)`} />
            {/* Main flames */}
            {[...Array(7)].map((_, i) => {
                const baseX = 90 + i * 25;
                const flameH = 60 + Math.sin(frame * 0.3 + i * 1.2) * 25 + (i % 2 === 0 ? 20 : 0);
                const sway = Math.sin(frame * 0.15 + i * 0.8) * 12;
                const flameW = 18 + Math.sin(frame * 0.25 + i) * 5;
                return (
                    <g key={`flame-${i}`} filter={`url(#${id}-glow)`}>
                        {/* Outer flame */}
                        <ellipse
                            cx={baseX + sway}
                            cy={280 - flameH / 2}
                            rx={flameW}
                            ry={flameH}
                            fill="#dc2626"
                            opacity={flicker * 0.6}
                        />
                        {/* Mid flame */}
                        <ellipse
                            cx={baseX + sway * 0.7}
                            cy={280 - flameH * 0.35}
                            rx={flameW * 0.65}
                            ry={flameH * 0.7}
                            fill="#f97316"
                            opacity={flicker * 0.8}
                        />
                        {/* Inner flame */}
                        <ellipse
                            cx={baseX + sway * 0.4}
                            cy={280 - flameH * 0.2}
                            rx={flameW * 0.35}
                            ry={flameH * 0.45}
                            fill="#fbbf24"
                            opacity={flicker}
                        />
                        {/* Core */}
                        <ellipse
                            cx={baseX + sway * 0.2}
                            cy={280 - flameH * 0.1}
                            rx={flameW * 0.15}
                            ry={flameH * 0.2}
                            fill="#fef3c7"
                            opacity={flicker * 0.9}
                        />
                    </g>
                );
            })}
            {/* Ember particles */}
            {[...Array(12)].map((_, i) => {
                const progress = ((frame * 1.5 + i * 25) % 200) / 200;
                const startX = 100 + (i * 31) % 120;
                const x = startX + Math.sin(frame * 0.1 + i * 2) * 25 + heatWave;
                const y = 280 - progress * 260;
                const emberSize = 1.5 + (i % 3) * 0.8;
                return (
                    <circle
                        key={`ember-${i}`}
                        cx={x}
                        cy={y}
                        r={emberSize * (1 - progress * 0.5)}
                        fill={i % 3 === 0 ? '#fbbf24' : i % 3 === 1 ? '#f97316' : '#ef4444'}
                        opacity={Math.max(0, (1 - progress) * 0.9)}
                    />
                );
            })}
            {/* Base embers / coals */}
            <ellipse cx="150" cy="285" rx="80" ry="12" fill="#dc2626" opacity="0.4" />
            <ellipse cx="150" cy="285" rx="50" ry="8" fill="#f97316" opacity="0.3" />
        </svg>
    );
};

const WaterWaveScene: React.FC<{ frame: number; fps: number; color: string }> = ({ frame, fps, color }) => {
    const id = useId();
    const waveOffset = frame * 2;

    return (
        <svg viewBox="0 0 300 300" width="100%" height="100%">
            <defs>
                <linearGradient id={`${id}-oceanGrad`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0c4a6e" />
                    <stop offset="50%" stopColor="#1e3a5f" />
                    <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
                <linearGradient id={`${id}-waveGrad`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0.3" />
                </linearGradient>
                <radialGradient id={`${id}-moonGlow`} cx="50%" cy="50%">
                    <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0" />
                </radialGradient>
            </defs>
            {/* Sky / ocean background */}
            <rect x="0" y="0" width="300" height="300" fill={`url(#${id}-oceanGrad)`} />
            {/* Moon */}
            <circle cx="240" cy="40" r="25" fill="#e2e8f0" opacity="0.85" />
            <circle cx="248" cy="35" r="22" fill="#0c4a6e" />
            <circle cx="240" cy="40" r="50" fill={`url(#${id}-moonGlow)`} />
            {/* Moonlight reflection on water */}
            {[...Array(6)].map((_, i) => {
                const refY = 150 + i * 15;
                const refW = 30 - i * 3;
                return (
                    <ellipse
                        key={`ref-${i}`}
                        cx={240 + Math.sin(frame * 0.08 + i) * 8}
                        cy={refY}
                        rx={refW + Math.sin(frame * 0.12 + i) * 5}
                        ry={2}
                        fill="#e2e8f0"
                        opacity={0.15 - i * 0.02}
                    />
                );
            })}
            {/* Wave layers */}
            {[0, 1, 2, 3].map((waveIdx) => {
                const waveY = 130 + waveIdx * 30;
                const amplitude = 8 + waveIdx * 3;
                const speed = 0.03 - waveIdx * 0.005;
                const phase = waveIdx * 1.2;
                const points: string[] = [];
                for (let x = -10; x <= 310; x += 5) {
                    const y = waveY + Math.sin((x + waveOffset * (1 - waveIdx * 0.15)) * speed + phase) * amplitude
                        + Math.sin((x + waveOffset * 0.7) * speed * 2 + phase) * (amplitude * 0.3);
                    points.push(`${x},${y}`);
                }
                points.push('310,310', '-10,310');
                return (
                    <polygon
                        key={`wave-${waveIdx}`}
                        points={points.join(' ')}
                        fill={`url(#${id}-waveGrad)`}
                        opacity={0.35 + waveIdx * 0.1}
                    />
                );
            })}
            {/* Foam particles on top wave */}
            {[...Array(10)].map((_, i) => {
                const foamX = (i * 35 + frame * 0.8) % 320 - 10;
                const foamY = 125 + Math.sin((foamX + waveOffset) * 0.03) * 8 + Math.sin(frame * 0.1 + i) * 3;
                return (
                    <circle
                        key={`foam-${i}`}
                        cx={foamX}
                        cy={foamY}
                        r={1.5 + Math.sin(frame * 0.2 + i) * 0.5}
                        fill="#fff"
                        opacity={0.3 + Math.sin(frame * 0.15 + i * 1.5) * 0.2}
                    />
                );
            })}
            {/* Deep water particles */}
            {[...Array(5)].map((_, i) => (
                <circle
                    key={`deep-${i}`}
                    cx={40 + i * 60 + Math.sin(frame * 0.04 + i) * 10}
                    cy={220 + i * 12 + Math.sin(frame * 0.06 + i * 2) * 5}
                    r={2 + Math.sin(frame * 0.08 + i) * 1}
                    fill="#38bdf8"
                    opacity={0.1 + Math.sin(frame * 0.1 + i) * 0.05}
                />
            ))}
        </svg>
    );
};

const ShieldProtectScene: React.FC<{ frame: number; fps: number; color: string }> = ({ frame, fps, color }) => {
    const id = useId();
    const materializeProgress = Math.min(1, frame / 25);
    const pulseRing1 = (frame * 2.5) % 80;
    const pulseRing2 = ((frame - 15) * 2.5) % 80;
    const auraGlow = 0.3 + Math.sin(frame * 0.08) * 0.15;
    const shieldScale = materializeProgress * (1 + Math.sin(frame * 0.06) * 0.03);

    return (
        <svg viewBox="0 0 300 300" width="100%" height="100%">
            <defs>
                <linearGradient id={`${id}-shieldGrad`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.9" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.5" />
                </linearGradient>
                <radialGradient id={`${id}-aura`}>
                    <stop offset="0%" stopColor={color} stopOpacity={auraGlow} />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </radialGradient>
                <filter id={`${id}-shieldGlow`}>
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            {/* Protective aura */}
            <circle cx="150" cy="145" r={90 + Math.sin(frame * 0.07) * 8} fill={`url(#${id}-aura)`} />
            {/* Energy pulse rings */}
            {pulseRing1 < 80 && (
                <circle cx="150" cy="145" r={40 + pulseRing1 * 1.2} fill="none" stroke={color} strokeWidth={2 - pulseRing1 / 60} opacity={Math.max(0, 0.6 - pulseRing1 / 80)} />
            )}
            {pulseRing2 > 0 && pulseRing2 < 80 && (
                <circle cx="150" cy="145" r={40 + pulseRing2 * 1.2} fill="none" stroke={color} strokeWidth={2 - pulseRing2 / 60} opacity={Math.max(0, 0.5 - pulseRing2 / 80)} />
            )}
            {/* Shield shape */}
            <g transform={`translate(150, 145) scale(${shieldScale})`} filter={`url(#${id}-shieldGlow)`} opacity={materializeProgress}>
                <path
                    d="M0,-70 L55,-50 L55,10 C55,50 0,80 0,80 C0,80 -55,50 -55,10 L-55,-50 Z"
                    fill={`url(#${id}-shieldGrad)`}
                    stroke={color}
                    strokeWidth="2"
                />
                {/* Shield inner border */}
                <path
                    d="M0,-58 L44,-42 L44,8 C44,42 0,66 0,66 C0,66 -44,42 -44,8 L-44,-42 Z"
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="1.5"
                />
                {/* Checkmark on shield */}
                <path
                    d="M-18,0 L-6,14 L20,-14"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={Math.min(1, Math.max(0, (frame - 20) / 10))}
                />
                {/* Shield highlight */}
                <path
                    d="M-10,-55 L-40,-40 L-40,0 C-40,10 -20,20 -10,25"
                    fill="rgba(255,255,255,0.08)"
                />
            </g>
            {/* Floating energy particles */}
            {[...Array(8)].map((_, i) => {
                const angle = (i * 45 + frame * 1.5) * Math.PI / 180;
                const r = 75 + Math.sin(frame * 0.1 + i) * 10;
                return (
                    <circle
                        key={`particle-${i}`}
                        cx={150 + Math.cos(angle) * r}
                        cy={145 + Math.sin(angle) * r}
                        r={2 + Math.sin(frame * 0.2 + i) * 0.8}
                        fill={color}
                        opacity={0.4 + Math.sin(frame * 0.15 + i * 2) * 0.3}
                    />
                );
            })}
        </svg>
    );
};

const TargetBullseyeScene: React.FC<{ frame: number; fps: number; color: string }> = ({ frame, fps, color }) => {
    const id = useId();
    const arrowArrival = Math.min(1, frame / 20);
    const arrowX = 300 - arrowArrival * 150;
    const arrowY = 50 + arrowArrival * 100;
    const hitFrame = frame - 20;
    const impactRipple = hitFrame > 0 ? hitFrame * 3 : 0;
    const springBounce = hitFrame > 0 ? Math.sin(hitFrame * 0.5) * Math.max(0, 15 - hitFrame) * 0.5 : 0;
    const targetPulse = hitFrame > 0 ? 1 + Math.sin(hitFrame * 0.4) * Math.max(0, 0.08 - hitFrame * 0.002) : 1;

    return (
        <svg viewBox="0 0 300 300" width="100%" height="100%">
            <defs>
                <radialGradient id={`${id}-targetGlow`}>
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </radialGradient>
            </defs>
            {/* Target glow */}
            <circle cx="150" cy="150" r="120" fill={`url(#${id}-targetGlow)`} />
            {/* Target rings */}
            <g transform={`scale(${targetPulse})`} style={{ transformOrigin: '150px 150px' }}>
                <circle cx="150" cy="150" r="85" fill="#fff" opacity="0.9" stroke="#e5e7eb" strokeWidth="1" />
                <circle cx="150" cy="150" r="85" fill="#ef4444" opacity="0.85" />
                <circle cx="150" cy="150" r="68" fill="#fff" opacity="0.9" />
                <circle cx="150" cy="150" r="50" fill="#ef4444" opacity="0.85" />
                <circle cx="150" cy="150" r="33" fill="#fff" opacity="0.9" />
                <circle cx="150" cy="150" r="18" fill="#ef4444" opacity="0.9" />
                <circle cx="150" cy="150" r="5" fill="#fbbf24" />
            </g>
            {/* Impact ripples */}
            {hitFrame > 0 && impactRipple < 60 && (
                <>
                    <circle cx="150" cy="150" r={10 + impactRipple} fill="none" stroke={color} strokeWidth={2 - impactRipple / 40} opacity={Math.max(0, 0.7 - impactRipple / 60)} />
                    <circle cx="150" cy="150" r={5 + impactRipple * 0.7} fill="none" stroke={color} strokeWidth={1.5 - impactRipple / 60} opacity={Math.max(0, 0.5 - impactRipple / 60)} />
                </>
            )}
            {/* Arrow */}
            {arrowArrival < 1 ? (
                <g transform={`translate(${arrowX}, ${arrowY}) rotate(135)`}>
                    {/* Arrow shaft */}
                    <line x1="0" y1="0" x2="50" y2="0" stroke="#78716c" strokeWidth="3" strokeLinecap="round" />
                    {/* Arrow head */}
                    <polygon points="0,0 12,6 12,-6" fill="#4b5563" />
                    {/* Fletching */}
                    <polygon points="45,-6 55,-10 55,0" fill="#ef4444" opacity="0.7" />
                    <polygon points="45,6 55,10 55,0" fill="#dc2626" opacity="0.7" />
                    {/* Motion blur trail */}
                    <line x1="55" y1="0" x2={55 + (1 - arrowArrival) * 40} y2="0" stroke="#78716c" strokeWidth="2" opacity={0.3 * (1 - arrowArrival)} />
                </g>
            ) : (
                <g transform={`translate(150, ${150 + springBounce}) rotate(135)`}>
                    {/* Embedded arrow */}
                    <line x1="0" y1="0" x2="35" y2="0" stroke="#78716c" strokeWidth="3" strokeLinecap="round" />
                    <polygon points="0,0 10,5 10,-5" fill="#4b5563" />
                    <polygon points="30,-5 40,-8 40,0" fill="#ef4444" opacity="0.7" />
                    <polygon points="30,5 40,8 40,0" fill="#dc2626" opacity="0.7" />
                </g>
            )}
            {/* Score burst particles on hit */}
            {hitFrame > 0 && hitFrame < 30 && [...Array(8)].map((_, i) => {
                const burstAngle = (i * 45) * Math.PI / 180;
                const burstR = hitFrame * 2.5;
                return (
                    <circle
                        key={`burst-${i}`}
                        cx={150 + Math.cos(burstAngle) * burstR}
                        cy={150 + Math.sin(burstAngle) * burstR}
                        r={2 - hitFrame * 0.05}
                        fill="#fbbf24"
                        opacity={Math.max(0, 0.9 - hitFrame / 30)}
                    />
                );
            })}
        </svg>
    );
};

const ExplosionBurstScene: React.FC<{ frame: number; fps: number; color: string }> = ({ frame, fps, color }) => {
    const id = useId();
    const burstProgress = Math.min(1, frame / 30);
    const flashOpacity = frame < 5 ? Math.max(0, 1 - frame / 5) * 0.6 : 0;
    const coreScale = frame < 8 ? 1 + frame * 0.3 : Math.max(0, 3.4 - (frame - 8) * 0.15);
    const shockwave1 = frame * 4;
    const shockwave2 = Math.max(0, (frame - 5) * 4);

    return (
        <svg viewBox="0 0 300 300" width="100%" height="100%">
            <defs>
                <radialGradient id={`${id}-coreGrad`}>
                    <stop offset="0%" stopColor="#fef3c7" />
                    <stop offset="30%" stopColor="#fbbf24" />
                    <stop offset="60%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </radialGradient>
                <filter id={`${id}-bloom`}>
                    <feGaussianBlur stdDeviation="8" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            {/* Flash */}
            <rect x="0" y="0" width="300" height="300" fill="#fef3c7" opacity={flashOpacity} />
            {/* Shockwave rings */}
            {shockwave1 < 150 && (
                <circle cx="150" cy="150" r={shockwave1} fill="none" stroke="#f97316" strokeWidth={3 - shockwave1 / 60} opacity={Math.max(0, 0.7 - shockwave1 / 150)} />
            )}
            {shockwave2 > 0 && shockwave2 < 150 && (
                <circle cx="150" cy="150" r={shockwave2} fill="none" stroke="#fbbf24" strokeWidth={2 - shockwave2 / 100} opacity={Math.max(0, 0.5 - shockwave2 / 150)} />
            )}
            {/* Explosion core */}
            {coreScale > 0 && (
                <g filter={`url(#${id}-bloom)`}>
                    <circle cx="150" cy="150" r={20 * Math.max(0, coreScale)} fill={`url(#${id}-coreGrad)`} opacity={Math.min(1, Math.max(0, coreScale / 2))} />
                </g>
            )}
            {/* Debris particles flying outward */}
            {[...Array(16)].map((_, i) => {
                const angle = (i * 22.5) * Math.PI / 180;
                const speed = 2 + (i % 4) * 0.8;
                const distance = burstProgress * speed * 50;
                const particleSize = 3 + (i % 3) * 1.5;
                const fadeOut = Math.max(0, 1 - burstProgress * 1.2);
                return (
                    <circle
                        key={`debris-${i}`}
                        cx={150 + Math.cos(angle) * distance}
                        cy={150 + Math.sin(angle) * distance}
                        r={particleSize * (1 - burstProgress * 0.5)}
                        fill={i % 3 === 0 ? '#fbbf24' : i % 3 === 1 ? '#f97316' : '#ef4444'}
                        opacity={fadeOut}
                    />
                );
            })}
            {/* Secondary debris (smaller, faster) */}
            {[...Array(12)].map((_, i) => {
                const angle = (i * 30 + 15) * Math.PI / 180;
                const speed = 3.5 + (i % 3) * 1.2;
                const distance = burstProgress * speed * 50;
                return (
                    <circle
                        key={`debris2-${i}`}
                        cx={150 + Math.cos(angle) * distance}
                        cy={150 + Math.sin(angle) * distance}
                        r={1.5 * (1 - burstProgress * 0.7)}
                        fill={i % 2 === 0 ? '#fef3c7' : '#fbbf24'}
                        opacity={Math.max(0, 0.8 - burstProgress * 1.3)}
                    />
                );
            })}
            {/* Smoke clouds after explosion */}
            {frame > 15 && [...Array(5)].map((_, i) => {
                const smokeAngle = (i * 72) * Math.PI / 180;
                const smokeR = 20 + (frame - 15) * 1.5;
                const smokeDist = 20 + (frame - 15) * 1.2;
                return (
                    <circle
                        key={`smoke-${i}`}
                        cx={150 + Math.cos(smokeAngle) * smokeDist}
                        cy={150 + Math.sin(smokeAngle) * smokeDist}
                        r={smokeR}
                        fill="#78716c"
                        opacity={Math.max(0, 0.15 - (frame - 15) * 0.003)}
                    />
                );
            })}
        </svg>
    );
};

const MagnetAttractScene: React.FC<{ frame: number; fps: number; color: string }> = ({ frame, fps, color }) => {
    const id = useId();
    const magnetPulse = 1 + Math.sin(frame * 0.08) * 0.03;
    const fieldStrength = 0.3 + Math.sin(frame * 0.06) * 0.15;

    return (
        <svg viewBox="0 0 300 300" width="100%" height="100%">
            <defs>
                <linearGradient id={`${id}-magnetRedGrad`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#b91c1c" />
                </linearGradient>
                <linearGradient id={`${id}-magnetBlueGrad`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
            </defs>
            {/* Magnetic field lines (curved) */}
            {[...Array(5)].map((_, i) => {
                const spread = 30 + i * 20;
                const fieldPulse = Math.sin(frame * 0.1 + i * 0.5) * 0.2 + 0.8;
                return (
                    <g key={`field-${i}`} opacity={fieldStrength * fieldPulse}>
                        {/* Left side field lines */}
                        <path
                            d={`M105,${130 - spread * 0.3} C${80 - i * 10},${130 - spread} ${80 - i * 10},${170 + spread} 105,${170 + spread * 0.3}`}
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="1"
                            strokeDasharray="4,4"
                            strokeDashoffset={frame * 1.5}
                        />
                        {/* Right side field lines */}
                        <path
                            d={`M195,${130 - spread * 0.3} C${220 + i * 10},${130 - spread} ${220 + i * 10},${170 + spread} 195,${170 + spread * 0.3}`}
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="1"
                            strokeDasharray="4,4"
                            strokeDashoffset={frame * 1.5}
                        />
                    </g>
                );
            })}
            {/* U-shaped magnet */}
            <g transform={`translate(150, 150) scale(${magnetPulse})`}>
                {/* Left arm - North (red) */}
                <rect x="-55" y="-40" width="25" height="70" rx="3" fill={`url(#${id}-magnetRedGrad)`} />
                <text x="-42" y="-45" textAnchor="middle" fontSize="14" fill="#ef4444" fontWeight="bold" opacity="0.8">N</text>
                {/* Right arm - South (blue) */}
                <rect x="30" y="-40" width="25" height="70" rx="3" fill={`url(#${id}-magnetBlueGrad)`} />
                <text x="42" y="-45" textAnchor="middle" fontSize="14" fill="#3b82f6" fontWeight="bold" opacity="0.8">S</text>
                {/* Bottom connection */}
                <path d="M-55,25 C-55,65 55,65 55,25" fill="none" stroke="#9ca3af" strokeWidth="25" strokeLinecap="round" />
                <path d="M-55,25 C-55,55 -10,60 0,60" fill="none" stroke="#ef4444" strokeWidth="22" strokeLinecap="round" opacity="0.6" />
                <path d="M55,25 C55,55 10,60 0,60" fill="none" stroke="#3b82f6" strokeWidth="22" strokeLinecap="round" opacity="0.6" />
                {/* Metallic highlight */}
                <rect x="-52" y="-35" width="6" height="60" rx="2" fill="rgba(255,255,255,0.15)" />
                <rect x="46" y="-35" width="6" height="60" rx="2" fill="rgba(255,255,255,0.15)" />
            </g>
            {/* Attracted particles */}
            {[...Array(10)].map((_, i) => {
                const startAngle = (i * 36 + frame * 2) * Math.PI / 180;
                const maxR = 120;
                const particleProgress = ((frame * 0.02 + i * 0.1) % 1);
                const r = maxR * (1 - particleProgress);
                const attractX = 150 + Math.cos(startAngle) * r;
                const attractY = 150 + Math.sin(startAngle) * r * 0.6;
                return (
                    <circle
                        key={`attract-${i}`}
                        cx={attractX}
                        cy={attractY}
                        r={2 + particleProgress * 2}
                        fill={i % 2 === 0 ? '#94a3b8' : '#cbd5e1'}
                        opacity={0.4 + particleProgress * 0.5}
                    />
                );
            })}
        </svg>
    );
};

const GearSystemScene: React.FC<{ frame: number; fps: number; color: string }> = ({ frame, fps, color }) => {
    const id = useId();
    const mainRotation = (frame * 2) % 360;

    const drawGear = (cx: number, cy: number, r: number, teeth: number, rotation: number, gradId: string) => {
        const innerR = r * 0.65;
        const toothH = r * 0.2;
        const points: string[] = [];
        for (let i = 0; i < teeth; i++) {
            const a1 = (i / teeth) * 360 + rotation;
            const a2 = a1 + (180 / teeth) * 0.4;
            const a3 = a1 + (180 / teeth) * 0.6;
            const a4 = a1 + 180 / teeth;
            points.push(`${cx + Math.cos(a1 * Math.PI / 180) * r},${cy + Math.sin(a1 * Math.PI / 180) * r}`);
            points.push(`${cx + Math.cos(a2 * Math.PI / 180) * (r + toothH)},${cy + Math.sin(a2 * Math.PI / 180) * (r + toothH)}`);
            points.push(`${cx + Math.cos(a3 * Math.PI / 180) * (r + toothH)},${cy + Math.sin(a3 * Math.PI / 180) * (r + toothH)}`);
            points.push(`${cx + Math.cos(a4 * Math.PI / 180) * r},${cy + Math.sin(a4 * Math.PI / 180) * r}`);
        }
        return (
            <g>
                <polygon points={points.join(' ')} fill={`url(#${gradId})`} stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                <circle cx={cx} cy={cy} r={innerR} fill="rgba(15,23,42,0.5)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                <circle cx={cx} cy={cy} r={innerR * 0.4} fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                {/* Spokes */}
                {[0, 120, 240].map((a, si) => {
                    const spokeAngle = (a + rotation) * Math.PI / 180;
                    return (
                        <line
                            key={`spoke-${si}`}
                            x1={cx + Math.cos(spokeAngle) * (innerR * 0.45)}
                            y1={cy + Math.sin(spokeAngle) * (innerR * 0.45)}
                            x2={cx + Math.cos(spokeAngle) * (innerR * 0.95)}
                            y2={cy + Math.sin(spokeAngle) * (innerR * 0.95)}
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="2"
                        />
                    );
                })}
            </g>
        );
    };

    return (
        <svg viewBox="0 0 300 300" width="100%" height="100%">
            <defs>
                <linearGradient id={`${id}-gear1`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#64748b" />
                    <stop offset="100%" stopColor="#475569" />
                </linearGradient>
                <linearGradient id={`${id}-gear2`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#6b7280" />
                    <stop offset="100%" stopColor="#4b5563" />
                </linearGradient>
                <linearGradient id={`${id}-gear3`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#78716c" />
                    <stop offset="100%" stopColor="#57534e" />
                </linearGradient>
            </defs>
            {/* Background mechanical glow */}
            <circle cx="150" cy="150" r="130" fill={color} opacity="0.04" />
            {/* Gear 1 - Large center-left, clockwise */}
            {drawGear(115, 140, 55, 12, mainRotation, `${id}-gear1`)}
            {/* Gear 2 - Medium right, counter-clockwise */}
            {drawGear(210, 115, 40, 9, -mainRotation * (55 / 40) + 9, `${id}-gear2`)}
            {/* Gear 3 - Small bottom right, clockwise */}
            {drawGear(230, 195, 30, 8, mainRotation * (55 / 30) + 5, `${id}-gear3`)}
            {/* Mechanical sparks at contact points */}
            {[...Array(3)].map((_, i) => {
                const sparkVisible = Math.sin(frame * 0.5 + i * 2.1) > 0.7;
                const sparkPoints = [
                    { x: 163, y: 120 },
                    { x: 225, y: 155 },
                    { x: 145, y: 185 },
                ];
                return sparkVisible ? (
                    <circle
                        key={`spark-${i}`}
                        cx={sparkPoints[i].x + Math.sin(frame * 0.3 + i) * 3}
                        cy={sparkPoints[i].y + Math.cos(frame * 0.4 + i) * 3}
                        r="2"
                        fill="#fbbf24"
                        opacity={0.6}
                    />
                ) : null;
            })}
        </svg>
    );
};

const EnergyPulseScene: React.FC<{ frame: number; fps: number; color: string }> = ({ frame, fps, color }) => {
    const id = useId();
    const corePulse = 1 + Math.sin(frame * 0.15) * 0.15;
    const ringPhase = frame * 2;

    return (
        <svg viewBox="0 0 300 300" width="100%" height="100%">
            <defs>
                <radialGradient id={`${id}-plasmaCore`}>
                    <stop offset="0%" stopColor="#fef3c7" />
                    <stop offset="20%" stopColor={color} />
                    <stop offset="60%" stopColor={color} stopOpacity="0.4" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </radialGradient>
                <filter id={`${id}-plasma`}>
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            {/* Concentric energy rings pulsing outward */}
            {[0, 1, 2, 3, 4].map((ringIdx) => {
                const ringOffset = (ringPhase + ringIdx * 30) % 150;
                const ringR = 15 + ringOffset;
                const ringOpacity = Math.max(0, 0.6 - ringOffset / 150);
                return (
                    <circle
                        key={`ring-${ringIdx}`}
                        cx="150"
                        cy="150"
                        r={ringR}
                        fill="none"
                        stroke={color}
                        strokeWidth={2.5 - ringOffset / 80}
                        opacity={ringOpacity}
                    />
                );
            })}
            {/* Plasma-like core */}
            <g filter={`url(#${id}-plasma)`}>
                <circle cx="150" cy="150" r={25 * corePulse} fill={`url(#${id}-plasmaCore)`} />
                {/* Inner hot core */}
                <circle cx="150" cy="150" r={10 * corePulse} fill="#fff" opacity={0.5 + Math.sin(frame * 0.2) * 0.2} />
            </g>
            {/* Electric arcs */}
            {[...Array(6)].map((_, i) => {
                const arcAngle = (i * 60 + frame * 3) * Math.PI / 180;
                const arcR1 = 30 + Math.sin(frame * 0.2 + i) * 8;
                const arcR2 = 55 + Math.sin(frame * 0.15 + i * 2) * 12;
                const midAngle = arcAngle + Math.sin(frame * 0.3 + i) * 0.3;
                const x1 = 150 + Math.cos(arcAngle) * arcR1;
                const y1 = 150 + Math.sin(arcAngle) * arcR1;
                const mx = 150 + Math.cos(midAngle) * ((arcR1 + arcR2) / 2);
                const my = 150 + Math.sin(midAngle) * ((arcR1 + arcR2) / 2);
                const x2 = 150 + Math.cos(arcAngle) * arcR2;
                const y2 = 150 + Math.sin(arcAngle) * arcR2;
                return (
                    <path
                        key={`arc-${i}`}
                        d={`M${x1},${y1} Q${mx + Math.sin(frame * 0.5 + i) * 10},${my + Math.cos(frame * 0.4 + i) * 10} ${x2},${y2}`}
                        fill="none"
                        stroke={color}
                        strokeWidth="1.5"
                        opacity={0.4 + Math.sin(frame * 0.3 + i * 1.5) * 0.3}
                        strokeLinecap="round"
                    />
                );
            })}
            {/* Orbiting energy particles */}
            {[...Array(8)].map((_, i) => {
                const pAngle = (i * 45 + frame * 4) * Math.PI / 180;
                const pR = 70 + Math.sin(frame * 0.1 + i) * 15;
                return (
                    <circle
                        key={`ep-${i}`}
                        cx={150 + Math.cos(pAngle) * pR}
                        cy={150 + Math.sin(pAngle) * pR}
                        r={2 + Math.sin(frame * 0.2 + i) * 1}
                        fill={color}
                        opacity={0.5 + Math.sin(frame * 0.15 + i * 2) * 0.3}
                    />
                );
            })}
        </svg>
    );
};

const EyeVisionScene: React.FC<{ frame: number; fps: number; color: string }> = ({ frame, fps, color }) => {
    const id = useId();
    const openProgress = Math.min(1, frame / 15);
    const pupilDilate = 0.7 + Math.sin(frame * 0.08) * 0.2;
    const scanLine = (frame * 4) % 200;
    const irisRotation = (frame * 1.5) % 360;

    return (
        <svg viewBox="0 0 300 300" width="100%" height="100%">
            <defs>
                <radialGradient id={`${id}-irisGrad`}>
                    <stop offset="0%" stopColor="#0f172a" />
                    <stop offset="30%" stopColor={color} stopOpacity="0.9" />
                    <stop offset="70%" stopColor={color} />
                    <stop offset="100%" stopColor={color} stopOpacity="0.6" />
                </radialGradient>
                <clipPath id={`${id}-eyeClip`}>
                    <ellipse cx="150" cy="150" rx="100" ry={55 * openProgress} />
                </clipPath>
                <linearGradient id={`${id}-scanGrad`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0" />
                    <stop offset="50%" stopColor={color} stopOpacity="0.4" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            {/* Eye glow */}
            <ellipse cx="150" cy="150" rx="120" ry="70" fill={color} opacity={0.05 * openProgress} />
            {/* Eye shape - outer */}
            <ellipse cx="150" cy="150" rx="100" ry={55 * openProgress} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
            {/* Eye interior clipped */}
            <g clipPath={`url(#${id}-eyeClip)`}>
                {/* Sclera (white) */}
                <ellipse cx="150" cy="150" rx="100" ry="55" fill="#e5e7eb" opacity="0.9" />
                {/* Iris */}
                <circle cx="150" cy="150" r="35" fill={`url(#${id}-irisGrad)`} />
                {/* Iris detail patterns */}
                {[...Array(12)].map((_, i) => {
                    const a = (i * 30 + irisRotation) * Math.PI / 180;
                    return (
                        <line
                            key={`iris-${i}`}
                            x1={150 + Math.cos(a) * 12}
                            y1={150 + Math.sin(a) * 12}
                            x2={150 + Math.cos(a) * 32}
                            y2={150 + Math.sin(a) * 32}
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="1"
                        />
                    );
                })}
                {/* Pupil */}
                <circle cx="150" cy="150" r={18 * pupilDilate} fill="#0f172a" />
                {/* Pupil reflection */}
                <circle cx="142" cy="142" r="5" fill="rgba(255,255,255,0.5)" />
                <circle cx="155" cy="145" r="2.5" fill="rgba(255,255,255,0.3)" />
                {/* Scan line */}
                {openProgress > 0.8 && (
                    <rect
                        x="50"
                        y={100 + scanLine * 0.5 - 15}
                        width="200"
                        height="30"
                        fill={`url(#${id}-scanGrad)`}
                        opacity="0.4"
                    />
                )}
            </g>
            {/* Eyelid lines */}
            <path
                d={`M50,150 Q150,${150 - 55 * openProgress} 250,150`}
                fill="none"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="2.5"
                strokeLinecap="round"
            />
            <path
                d={`M50,150 Q150,${150 + 55 * openProgress} 250,150`}
                fill="none"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="2.5"
                strokeLinecap="round"
            />
            {/* Corner details */}
            <line x1="48" y1="150" x2="35" y2="148" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="252" y1="150" x2="265" y2="148" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" />
            {/* Scanning indicator dots */}
            {openProgress > 0.8 && [...Array(4)].map((_, i) => {
                const dotAngle = (i * 90 + frame * 5) * Math.PI / 180;
                return (
                    <circle
                        key={`scan-dot-${i}`}
                        cx={150 + Math.cos(dotAngle) * 45}
                        cy={150 + Math.sin(dotAngle) * 25 * openProgress}
                        r="2"
                        fill={color}
                        opacity={0.5 + Math.sin(frame * 0.3 + i) * 0.3}
                    />
                );
            })}
        </svg>
    );
};

const ArrowGrowthScene: React.FC<{ frame: number; fps: number; color: string }> = ({ frame, fps, color }) => {
    const id = useId();

    return (
        <svg viewBox="0 0 300 300" width="100%" height="100%">
            <defs>
                <linearGradient id={`${id}-arrowGrad1`} x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id={`${id}-arrowGrad2`} x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id={`${id}-arrowGrad3`} x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.9" />
                </linearGradient>
            </defs>
            {/* Background grid lines */}
            {[...Array(6)].map((_, i) => (
                <line key={`hgrid-${i}`} x1="30" y1={50 + i * 45} x2="270" y2={50 + i * 45} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            ))}
            {/* Arrow 1 - left, accelerating upward */}
            {(() => {
                const delay1 = 0;
                const progress1 = Math.min(1, Math.max(0, (frame - delay1) / 35));
                const eased1 = progress1 * progress1; // accelerating
                const height1 = eased1 * 200;
                const trailLen = Math.min(height1, 60);
                return (
                    <g>
                        {/* Trail */}
                        <rect x="75" y={270 - height1} width="12" height={trailLen} rx="6" fill={`url(#${id}-arrowGrad1)`} opacity="0.4" />
                        {/* Arrow shaft */}
                        <line x1="81" y1={270} x2="81" y2={270 - height1} stroke={color} strokeWidth="4" strokeLinecap="round" />
                        {/* Arrow head */}
                        {height1 > 10 && (
                            <polygon points={`81,${270 - height1 - 12} 71,${270 - height1 + 4} 91,${270 - height1 + 4}`} fill={color} />
                        )}
                    </g>
                );
            })()}
            {/* Arrow 2 - center, accelerating upward with delay */}
            {(() => {
                const delay2 = 8;
                const progress2 = Math.min(1, Math.max(0, (frame - delay2) / 35));
                const eased2 = progress2 * progress2;
                const height2 = eased2 * 220;
                const trailLen = Math.min(height2, 60);
                return (
                    <g>
                        <rect x="144" y={270 - height2} width="12" height={trailLen} rx="6" fill={`url(#${id}-arrowGrad2)`} opacity="0.4" />
                        <line x1="150" y1={270} x2="150" y2={270 - height2} stroke="#22c55e" strokeWidth="4" strokeLinecap="round" />
                        {height2 > 10 && (
                            <polygon points={`150,${270 - height2 - 12} 140,${270 - height2 + 4} 160,${270 - height2 + 4}`} fill="#22c55e" />
                        )}
                    </g>
                );
            })()}
            {/* Arrow 3 - right, accelerating upward with more delay */}
            {(() => {
                const delay3 = 16;
                const progress3 = Math.min(1, Math.max(0, (frame - delay3) / 35));
                const eased3 = progress3 * progress3;
                const height3 = eased3 * 190;
                const trailLen = Math.min(height3, 60);
                return (
                    <g>
                        <rect x="213" y={270 - height3} width="12" height={trailLen} rx="6" fill={`url(#${id}-arrowGrad3)`} opacity="0.4" />
                        <line x1="219" y1={270} x2="219" y2={270 - height3} stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
                        {height3 > 10 && (
                            <polygon points={`219,${270 - height3 - 12} 209,${270 - height3 + 4} 229,${270 - height3 + 4}`} fill="#f59e0b" />
                        )}
                    </g>
                );
            })()}
            {/* Speed particles trailing behind arrows */}
            {[...Array(9)].map((_, i) => {
                const col = Math.floor(i / 3);
                const baseX = [81, 150, 219][col];
                const delay = [0, 8, 16][col];
                const progress = Math.min(1, Math.max(0, (frame - delay) / 35));
                const height = progress * progress * [200, 220, 190][col];
                const particleY = 270 - height + 20 + (i % 3) * 25;
                return height > 30 ? (
                    <circle
                        key={`speed-${i}`}
                        cx={baseX + Math.sin(frame * 0.3 + i) * 8}
                        cy={particleY}
                        r={1.5}
                        fill={[color, '#22c55e', '#f59e0b'][col]}
                        opacity={Math.max(0, 0.5 - (i % 3) * 0.15)}
                    />
                ) : null;
            })}
        </svg>
    );
};

const CheckmarkSuccessScene: React.FC<{ frame: number; fps: number; color: string }> = ({ frame, fps, color }) => {
    const id = useId();
    const circleProgress = Math.min(1, frame / 18);
    const checkDelay = 18;
    const checkProgress = Math.min(1, Math.max(0, (frame - checkDelay) / 12));
    const burstDelay = 30;
    const burstProgress = Math.max(0, (frame - burstDelay));
    const bounceScale = frame > checkDelay
        ? 1 + Math.sin((frame - checkDelay) * 0.4) * Math.max(0, 0.15 - (frame - checkDelay) * 0.005)
        : 1;

    // Checkmark path length simulation
    const checkPath1 = checkProgress < 0.4 ? checkProgress / 0.4 : 1;
    const checkPath2 = checkProgress > 0.4 ? (checkProgress - 0.4) / 0.6 : 0;

    return (
        <svg viewBox="0 0 300 300" width="100%" height="100%">
            <defs>
                <linearGradient id={`${id}-circleGrad`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#16a34a" />
                </linearGradient>
                <filter id={`${id}-successGlow`}>
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            {/* Background glow */}
            <circle cx="150" cy="150" r={80 + Math.sin(frame * 0.07) * 5} fill="#22c55e" opacity={0.06 * circleProgress} />
            {/* Circle drawing animation */}
            <g transform={`scale(${bounceScale})`} style={{ transformOrigin: '150px 150px' }}>
                <circle
                    cx="150" cy="150" r="65"
                    fill="none"
                    stroke={`url(#${id}-circleGrad)`}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={`${circleProgress * 408} 408`}
                    transform="rotate(-90, 150, 150)"
                    filter={`url(#${id}-successGlow)`}
                />
                {/* Filled circle background */}
                <circle cx="150" cy="150" r="62" fill="#22c55e" opacity={circleProgress * 0.15} />
            </g>
            {/* Checkmark */}
            <g transform={`scale(${bounceScale})`} style={{ transformOrigin: '150px 150px' }} filter={`url(#${id}-successGlow)`}>
                {/* First stroke of check (down-right) */}
                {checkPath1 > 0 && (
                    <line
                        x1="120" y1="150"
                        x2={120 + 22 * checkPath1} y2={150 + 22 * checkPath1}
                        stroke="#fff"
                        strokeWidth="7"
                        strokeLinecap="round"
                    />
                )}
                {/* Second stroke of check (up-right) */}
                {checkPath2 > 0 && (
                    <line
                        x1="142" y1="172"
                        x2={142 + 38 * checkPath2} y2={172 - 44 * checkPath2}
                        stroke="#fff"
                        strokeWidth="7"
                        strokeLinecap="round"
                    />
                )}
            </g>
            {/* Burst particles on completion */}
            {burstProgress > 0 && burstProgress < 25 && [...Array(12)].map((_, i) => {
                const burstAngle = (i * 30) * Math.PI / 180;
                const burstR = burstProgress * 4;
                const particleSize = 3 - burstProgress * 0.1;
                return (
                    <circle
                        key={`burst-${i}`}
                        cx={150 + Math.cos(burstAngle) * burstR}
                        cy={150 + Math.sin(burstAngle) * burstR}
                        r={Math.max(0.5, particleSize)}
                        fill={i % 3 === 0 ? '#22c55e' : i % 3 === 1 ? '#4ade80' : '#fbbf24'}
                        opacity={Math.max(0, 1 - burstProgress / 25)}
                    />
                );
            })}
            {/* Sparkle stars */}
            {burstProgress > 5 && burstProgress < 35 && [...Array(6)].map((_, i) => {
                const sAngle = (i * 60 + 30) * Math.PI / 180;
                const sR = 85 + Math.sin(frame * 0.15 + i) * 8;
                return (
                    <g key={`sparkle-${i}`} opacity={Math.max(0, 0.6 - (burstProgress - 5) / 35)}>
                        <line
                            x1={150 + Math.cos(sAngle) * sR - 4} y1={150 + Math.sin(sAngle) * sR}
                            x2={150 + Math.cos(sAngle) * sR + 4} y2={150 + Math.sin(sAngle) * sR}
                            stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"
                        />
                        <line
                            x1={150 + Math.cos(sAngle) * sR} y1={150 + Math.sin(sAngle) * sR - 4}
                            x2={150 + Math.cos(sAngle) * sR} y2={150 + Math.sin(sAngle) * sR + 4}
                            stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"
                        />
                    </g>
                );
            })}
        </svg>
    );
};

const DiamondGemScene: React.FC<{ frame: number; fps: number; color: string }> = ({ frame, fps, color }) => {
    const id = useId();
    const rotation = Math.sin(frame * 0.04) * 15;
    const sparklePhase = frame * 0.15;
    const shimmer = 0.5 + Math.sin(frame * 0.1) * 0.3;

    return (
        <svg viewBox="0 0 300 300" width="100%" height="100%">
            <defs>
                <linearGradient id={`${id}-diamondTop`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#e0f2fe" />
                    <stop offset="50%" stopColor="#7dd3fc" />
                    <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
                <linearGradient id={`${id}-diamondLeft`} x1="1" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
                <linearGradient id={`${id}-diamondRight`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#7dd3fc" />
                    <stop offset="100%" stopColor="#0369a1" />
                </linearGradient>
                <filter id={`${id}-diamondGlow`}>
                    <feGaussianBlur stdDeviation="8" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            {/* Ambient glow */}
            <circle cx="150" cy="150" r="100" fill="#38bdf8" opacity={0.06 + Math.sin(frame * 0.08) * 0.03} />
            {/* Diamond shape */}
            <g transform={`translate(150, 150) rotate(${rotation})`} filter={`url(#${id}-diamondGlow)`}>
                {/* Crown (top facets) */}
                <polygon points="0,-65 -45,-20 45,-20" fill={`url(#${id}-diamondTop)`} opacity="0.9" />
                <polygon points="0,-65 -45,-20 -15,-20" fill="rgba(255,255,255,0.15)" />
                {/* Table (top flat) */}
                <polygon points="-30,-25 30,-25 20,-18 -20,-18" fill="#bae6fd" opacity="0.7" />
                {/* Pavilion (bottom facets) */}
                <polygon points="-45,-20 0,75 0,-20" fill={`url(#${id}-diamondLeft)`} opacity="0.85" />
                <polygon points="45,-20 0,75 0,-20" fill={`url(#${id}-diamondRight)`} opacity="0.85" />
                {/* Facet lines */}
                <line x1="-45" y1="-20" x2="0" y2="75" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                <line x1="45" y1="-20" x2="0" y2="75" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                <line x1="-25" y1="-20" x2="0" y2="75" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                <line x1="25" y1="-20" x2="0" y2="75" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                <line x1="0" y1="-65" x2="0" y2="-20" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                {/* Shimmer highlight */}
                <polygon
                    points={`${-15 + Math.sin(sparklePhase) * 10},-50 ${5 + Math.sin(sparklePhase) * 10},-25 ${-5 + Math.sin(sparklePhase) * 10},-25`}
                    fill="rgba(255,255,255,0.25)"
                    opacity={shimmer}
                />
            </g>
            {/* Light refraction rays */}
            {[...Array(8)].map((_, i) => {
                const rayAngle = (i * 45 + frame * 2) * Math.PI / 180;
                const rayLen = 30 + Math.sin(frame * 0.12 + i * 1.5) * 15;
                const rayStart = 70 + Math.sin(frame * 0.1 + i) * 5;
                const colors = ['#ef4444', '#f97316', '#fbbf24', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];
                return (
                    <line
                        key={`ray-${i}`}
                        x1={150 + Math.cos(rayAngle) * rayStart}
                        y1={150 + Math.sin(rayAngle) * rayStart}
                        x2={150 + Math.cos(rayAngle) * (rayStart + rayLen)}
                        y2={150 + Math.sin(rayAngle) * (rayStart + rayLen)}
                        stroke={colors[i]}
                        strokeWidth="1.5"
                        opacity={0.3 + Math.sin(frame * 0.15 + i * 2) * 0.2}
                        strokeLinecap="round"
                    />
                );
            })}
            {/* Sparkle points */}
            {[...Array(6)].map((_, i) => {
                const visible = Math.sin(sparklePhase + i * 1.2) > 0.5;
                const sx = 150 + Math.cos(i * 60 * Math.PI / 180) * (80 + Math.sin(frame * 0.1 + i) * 15);
                const sy = 150 + Math.sin(i * 60 * Math.PI / 180) * (80 + Math.cos(frame * 0.1 + i) * 15);
                return visible ? (
                    <g key={`sp-${i}`}>
                        <line x1={sx - 5} y1={sy} x2={sx + 5} y2={sy} stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
                        <line x1={sx} y1={sy - 5} x2={sx} y2={sy + 5} stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
                    </g>
                ) : null;
            })}
        </svg>
    );
};

const CrownRoyalScene: React.FC<{ frame: number; fps: number; color: string }> = ({ frame, fps, color }) => {
    const id = useId();
    const floatY = Math.sin(frame * 0.06) * 5;
    const royalGlow = 0.3 + Math.sin(frame * 0.08) * 0.15;
    const jewelSparkle = [
        Math.sin(frame * 0.2) > 0.6,
        Math.sin(frame * 0.2 + 1.5) > 0.6,
        Math.sin(frame * 0.2 + 3) > 0.6,
        Math.sin(frame * 0.2 + 4.5) > 0.6,
        Math.sin(frame * 0.2 + 6) > 0.6,
    ];

    return (
        <svg viewBox="0 0 300 300" width="100%" height="100%">
            <defs>
                <linearGradient id={`${id}-crownGrad`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
                <radialGradient id={`${id}-rubyGrad`}>
                    <stop offset="0%" stopColor="#fca5a5" />
                    <stop offset="50%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#b91c1c" />
                </radialGradient>
                <radialGradient id={`${id}-sapphireGrad`}>
                    <stop offset="0%" stopColor="#93c5fd" />
                    <stop offset="50%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                </radialGradient>
                <radialGradient id={`${id}-emeraldGrad`}>
                    <stop offset="0%" stopColor="#86efac" />
                    <stop offset="50%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#15803d" />
                </radialGradient>
                <filter id={`${id}-glow`}>
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            {/* Royal glow backdrop */}
            <circle cx="150" cy="145" r="100" fill="#fbbf24" opacity={royalGlow * 0.08} />
            {/* Crown body */}
            <g transform={`translate(150, ${140 + floatY})`} filter={`url(#${id}-glow)`}>
                {/* Crown base band */}
                <rect x="-65" y="15" width="130" height="20" rx="4" fill={`url(#${id}-crownGrad)`} />
                {/* Crown base band decoration */}
                <rect x="-60" y="20" width="120" height="3" fill="rgba(255,255,255,0.2)" rx="1" />
                <rect x="-60" y="28" width="120" height="2" fill="rgba(255,255,255,0.1)" rx="1" />
                {/* Crown points */}
                <polygon points="-65,18 -60,-40 -40,0" fill={`url(#${id}-crownGrad)`} />
                <polygon points="-30,18 -20,-55 -10,0" fill={`url(#${id}-crownGrad)`} />
                <polygon points="0,18 10,-65 20,0" fill={`url(#${id}-crownGrad)`} />
                <polygon points="30,18 40,-55 50,0" fill={`url(#${id}-crownGrad)`} />
                <polygon points="65,18 60,-40 40,0" fill={`url(#${id}-crownGrad)`} />
                {/* Highlight edges */}
                <polygon points="-65,18 -60,-40 -52,-10" fill="rgba(255,255,255,0.12)" />
                <polygon points="-30,18 -20,-55 -14,-15" fill="rgba(255,255,255,0.12)" />
                <polygon points="0,18 10,-65 14,-20" fill="rgba(255,255,255,0.12)" />
                <polygon points="30,18 40,-55 44,-15" fill="rgba(255,255,255,0.12)" />
                <polygon points="65,18 60,-40 52,-10" fill="rgba(255,255,255,0.12)" />
                {/* Jewels on crown points */}
                {/* Left ruby */}
                <circle cx="-60" cy="-30" r="6" fill={`url(#${id}-rubyGrad)`} />
                {jewelSparkle[0] && <circle cx="-62" cy="-33" r="2" fill="rgba(255,255,255,0.8)" />}
                {/* Mid-left sapphire */}
                <circle cx="-20" cy="-45" r="6" fill={`url(#${id}-sapphireGrad)`} />
                {jewelSparkle[1] && <circle cx="-22" cy="-48" r="2" fill="rgba(255,255,255,0.8)" />}
                {/* Center emerald (largest) */}
                <circle cx="10" cy="-55" r="8" fill={`url(#${id}-emeraldGrad)`} />
                {jewelSparkle[2] && <circle cx="7" cy="-58" r="2.5" fill="rgba(255,255,255,0.8)" />}
                {/* Mid-right sapphire */}
                <circle cx="40" cy="-45" r="6" fill={`url(#${id}-sapphireGrad)`} />
                {jewelSparkle[3] && <circle cx="38" cy="-48" r="2" fill="rgba(255,255,255,0.8)" />}
                {/* Right ruby */}
                <circle cx="60" cy="-30" r="6" fill={`url(#${id}-rubyGrad)`} />
                {jewelSparkle[4] && <circle cx="58" cy="-33" r="2" fill="rgba(255,255,255,0.8)" />}
                {/* Band jewels */}
                {[...Array(5)].map((_, i) => (
                    <circle key={`bjewel-${i}`} cx={-45 + i * 23} cy="25" r="4" fill={i % 2 === 0 ? `url(#${id}-rubyGrad)` : `url(#${id}-sapphireGrad)`} />
                ))}
            </g>
            {/* Floating golden particles */}
            {[...Array(10)].map((_, i) => {
                const px = 80 + (i * 31) % 150;
                const py = 80 + Math.sin(frame * 0.05 + i * 1.5) * 30 + (i * 19) % 120;
                return (
                    <circle
                        key={`gp-${i}`}
                        cx={px}
                        cy={py + floatY * 0.5}
                        r={1 + Math.sin(frame * 0.15 + i) * 0.5}
                        fill="#fbbf24"
                        opacity={0.2 + Math.sin(frame * 0.1 + i * 2) * 0.15}
                    />
                );
            })}
        </svg>
    );
};

const AtomScienceScene: React.FC<{ frame: number; fps: number; color: string }> = ({ frame, fps, color }) => {
    const id = useId();
    const nucleusPulse = 1 + Math.sin(frame * 0.12) * 0.1;
    const orbit1Angle = (frame * 3) % 360;
    const orbit2Angle = (frame * 2.5 + 120) % 360;
    const orbit3Angle = (frame * 3.5 + 240) % 360;

    return (
        <svg viewBox="0 0 300 300" width="100%" height="100%">
            <defs>
                <radialGradient id={`${id}-nucleusGrad`}>
                    <stop offset="0%" stopColor="#fef3c7" />
                    <stop offset="40%" stopColor={color} />
                    <stop offset="100%" stopColor={color} stopOpacity="0.5" />
                </radialGradient>
                <filter id={`${id}-atomGlow`}>
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            {/* Background energy field */}
            <circle cx="150" cy="150" r="120" fill={color} opacity="0.03" />
            {/* Orbit paths (3 planes, tilted for 3D effect) */}
            <ellipse cx="150" cy="150" rx="110" ry="40" fill="none" stroke={color} strokeWidth="1" opacity="0.15" transform="rotate(0, 150, 150)" />
            <ellipse cx="150" cy="150" rx="110" ry="40" fill="none" stroke={color} strokeWidth="1" opacity="0.15" transform="rotate(60, 150, 150)" />
            <ellipse cx="150" cy="150" rx="110" ry="40" fill="none" stroke={color} strokeWidth="1" opacity="0.15" transform="rotate(-60, 150, 150)" />
            {/* Electron 1 - horizontal orbit */}
            {(() => {
                const a = orbit1Angle * Math.PI / 180;
                const ex = 150 + Math.cos(a) * 110;
                const ey = 150 + Math.sin(a) * 40;
                return (
                    <g filter={`url(#${id}-atomGlow)`}>
                        {/* Electron trail */}
                        {[...Array(5)].map((_, t) => {
                            const ta = (orbit1Angle - t * 8) * Math.PI / 180;
                            return (
                                <circle
                                    key={`trail1-${t}`}
                                    cx={150 + Math.cos(ta) * 110}
                                    cy={150 + Math.sin(ta) * 40}
                                    r={4 - t * 0.6}
                                    fill="#22d3ee"
                                    opacity={0.3 - t * 0.06}
                                />
                            );
                        })}
                        <circle cx={ex} cy={ey} r="5" fill="#22d3ee" opacity="0.9" />
                        <circle cx={ex} cy={ey} r="3" fill="#fff" opacity="0.6" />
                    </g>
                );
            })()}
            {/* Electron 2 - tilted orbit (60deg) */}
            {(() => {
                const a = orbit2Angle * Math.PI / 180;
                const rawX = Math.cos(a) * 110;
                const rawY = Math.sin(a) * 40;
                const rot60 = 60 * Math.PI / 180;
                const ex = 150 + rawX * Math.cos(rot60) - rawY * Math.sin(rot60);
                const ey = 150 + rawX * Math.sin(rot60) + rawY * Math.cos(rot60);
                return (
                    <g filter={`url(#${id}-atomGlow)`}>
                        {[...Array(5)].map((_, t) => {
                            const ta = (orbit2Angle - t * 8) * Math.PI / 180;
                            const trX = Math.cos(ta) * 110;
                            const trY = Math.sin(ta) * 40;
                            return (
                                <circle
                                    key={`trail2-${t}`}
                                    cx={150 + trX * Math.cos(rot60) - trY * Math.sin(rot60)}
                                    cy={150 + trX * Math.sin(rot60) + trY * Math.cos(rot60)}
                                    r={4 - t * 0.6}
                                    fill="#a78bfa"
                                    opacity={0.3 - t * 0.06}
                                />
                            );
                        })}
                        <circle cx={ex} cy={ey} r="5" fill="#a78bfa" opacity="0.9" />
                        <circle cx={ex} cy={ey} r="3" fill="#fff" opacity="0.6" />
                    </g>
                );
            })()}
            {/* Electron 3 - tilted orbit (-60deg) */}
            {(() => {
                const a = orbit3Angle * Math.PI / 180;
                const rawX = Math.cos(a) * 110;
                const rawY = Math.sin(a) * 40;
                const rotNeg60 = -60 * Math.PI / 180;
                const ex = 150 + rawX * Math.cos(rotNeg60) - rawY * Math.sin(rotNeg60);
                const ey = 150 + rawX * Math.sin(rotNeg60) + rawY * Math.cos(rotNeg60);
                return (
                    <g filter={`url(#${id}-atomGlow)`}>
                        {[...Array(5)].map((_, t) => {
                            const ta = (orbit3Angle - t * 8) * Math.PI / 180;
                            const trX = Math.cos(ta) * 110;
                            const trY = Math.sin(ta) * 40;
                            return (
                                <circle
                                    key={`trail3-${t}`}
                                    cx={150 + trX * Math.cos(rotNeg60) - trY * Math.sin(rotNeg60)}
                                    cy={150 + trX * Math.sin(rotNeg60) + trY * Math.cos(rotNeg60)}
                                    r={4 - t * 0.6}
                                    fill="#f472b6"
                                    opacity={0.3 - t * 0.06}
                                />
                            );
                        })}
                        <circle cx={ex} cy={ey} r="5" fill="#f472b6" opacity="0.9" />
                        <circle cx={ex} cy={ey} r="3" fill="#fff" opacity="0.6" />
                    </g>
                );
            })()}
            {/* Nucleus */}
            <g filter={`url(#${id}-atomGlow)`}>
                <circle cx="150" cy="150" r={18 * nucleusPulse} fill={`url(#${id}-nucleusGrad)`} />
                {/* Protons/neutrons inside nucleus */}
                <circle cx="145" cy="146" r="6" fill={color} opacity="0.7" />
                <circle cx="155" cy="146" r="6" fill="#f472b6" opacity="0.5" />
                <circle cx="150" cy="155" r="6" fill={color} opacity="0.6" />
                <circle cx="150" cy="150" r="8" fill="rgba(255,255,255,0.15)" />
            </g>
            {/* Quantum particles */}
            {[...Array(6)].map((_, i) => {
                const qAngle = (i * 60 + frame * 5) * Math.PI / 180;
                const qR = 25 + Math.sin(frame * 0.2 + i * 1.5) * 10;
                return (
                    <circle
                        key={`quantum-${i}`}
                        cx={150 + Math.cos(qAngle) * qR}
                        cy={150 + Math.sin(qAngle) * qR}
                        r="1.5"
                        fill="#fbbf24"
                        opacity={0.4 + Math.sin(frame * 0.3 + i) * 0.3}
                    />
                );
            })}
        </svg>
    );
};

const MountainPeakScene: React.FC<{ frame: number; fps: number; color: string }> = ({ frame, fps, color }) => {
    const id = useId();
    const sunRise = Math.min(1, frame / 40);
    const sunY = 180 - sunRise * 110;
    const sunGlow = 0.3 + sunRise * 0.4 + Math.sin(frame * 0.06) * 0.1;
    const cloudDrift = (frame * 0.5) % 400;
    const flagWave = Math.sin(frame * 0.2) * 8;

    return (
        <svg viewBox="0 0 400 400" width="100%" height="100%">
            <defs>
                <linearGradient id={`${id}-skyGrad`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1e1b4b" stopOpacity={1 - sunRise * 0.4} />
                    <stop offset="40%" stopColor="#312e81" stopOpacity={1 - sunRise * 0.3} />
                    <stop offset="70%" stopColor="#f97316" stopOpacity={sunRise * 0.5} />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity={sunRise * 0.3} />
                </linearGradient>
                <linearGradient id={`${id}-mtGrad1`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#64748b" />
                    <stop offset="100%" stopColor="#334155" />
                </linearGradient>
                <linearGradient id={`${id}-mtGrad2`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#475569" />
                    <stop offset="100%" stopColor="#1e293b" />
                </linearGradient>
                <radialGradient id={`${id}-sunGrad`} cx="50%" cy="50%">
                    <stop offset="0%" stopColor="#fef3c7" />
                    <stop offset="40%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                </radialGradient>
            </defs>
            {/* Sky */}
            <rect x="0" y="0" width="400" height="400" fill={`url(#${id}-skyGrad)`} />
            {/* Stars (fade as sun rises) */}
            {[...Array(12)].map((_, i) => (
                <circle
                    key={`star-${i}`}
                    cx={25 + (i * 67) % 380}
                    cy={15 + (i * 41) % 150}
                    r={0.8 + (i % 2) * 0.5}
                    fill="#fff"
                    opacity={Math.max(0, (0.4 - sunRise * 0.4) + Math.sin(frame * 0.1 + i) * 0.1)}
                />
            ))}
            {/* Sun rising behind mountain */}
            <circle cx="200" cy={sunY} r={45 + Math.sin(frame * 0.05) * 3} fill={`url(#${id}-sunGrad)`} opacity={sunGlow} />
            <circle cx="200" cy={sunY} r="25" fill="#fbbf24" opacity={sunRise * 0.8} />
            {/* Sun rays */}
            {[...Array(8)].map((_, i) => {
                const rayAngle = (i * 45 + frame * 0.5) * Math.PI / 180;
                return (
                    <line
                        key={`ray-${i}`}
                        x1={200 + Math.cos(rayAngle) * 30}
                        y1={sunY + Math.sin(rayAngle) * 30}
                        x2={200 + Math.cos(rayAngle) * (50 + Math.sin(frame * 0.1 + i) * 8)}
                        y2={sunY + Math.sin(rayAngle) * (50 + Math.sin(frame * 0.1 + i) * 8)}
                        stroke="#fbbf24"
                        strokeWidth="1.5"
                        opacity={sunRise * 0.3}
                        strokeLinecap="round"
                    />
                );
            })}
            {/* Back mountain (darker, further) */}
            <polygon points="50,380 180,120 310,380" fill={`url(#${id}-mtGrad2)`} opacity="0.6" />
            {/* Snow cap on back mountain */}
            <polygon points="180,120 160,165 200,165" fill="#e2e8f0" opacity="0.4" />
            {/* Main mountain (foreground) */}
            <polygon points="80,380 230,80 380,380" fill={`url(#${id}-mtGrad1)`} />
            {/* Mountain shadow side */}
            <polygon points="230,80 380,380 230,380" fill="rgba(0,0,0,0.2)" />
            {/* Snow cap */}
            <polygon points="230,80 210,130 250,130" fill="#e2e8f0" opacity="0.9" />
            <polygon points="230,80 215,120 245,120" fill="#f8fafc" opacity="0.7" />
            {/* Mountain texture lines */}
            <line x1="230" y1="130" x2="170" y2="280" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <line x1="230" y1="130" x2="300" y2="300" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
            {/* Flag at summit */}
            <g transform={`translate(230, 75)`}>
                {/* Flag pole */}
                <line x1="0" y1="0" x2="0" y2="-35" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" />
                {/* Flag fabric waving */}
                <path
                    d={`M0,-35 Q${10 + flagWave},-30 ${18 + flagWave * 0.5},-25 Q${10 + flagWave * 0.7},-20 0,-18`}
                    fill="#ef4444"
                    opacity="0.9"
                />
                <path
                    d={`M0,-35 Q${8 + flagWave * 0.8},-31 ${14 + flagWave * 0.4},-28`}
                    fill="rgba(255,255,255,0.2)"
                />
            </g>
            {/* Clouds drifting */}
            {[0, 1, 2].map((ci) => {
                const cx = ((cloudDrift + ci * 160) % 500) - 50;
                const cy = 60 + ci * 40;
                return (
                    <g key={`cloud-${ci}`} opacity={0.25 + ci * 0.05}>
                        <ellipse cx={cx} cy={cy} rx={40 + ci * 5} ry={12 + ci * 2} fill="#e2e8f0" />
                        <ellipse cx={cx - 15} cy={cy - 5} rx={20 + ci * 3} ry={10 + ci} fill="#f1f5f9" />
                        <ellipse cx={cx + 18} cy={cy - 3} rx={22 + ci * 2} ry={9 + ci} fill="#f1f5f9" />
                    </g>
                );
            })}
            {/* Ground / foreground */}
            <rect x="0" y="370" width="400" height="30" fill="#1e293b" />
        </svg>
    );
};

// ==================== SCENE REGISTRY ====================

const SCENES: Record<string, React.FC<{ frame: number; fps: number; color: string }>> = {
    'solar-system': SolarSystemScene,
    'growth-chart': GrowthChartScene,
    'globe': GlobeScene,
    'rocket-launch': RocketScene,
    'brain-idea': BrainIdeaScene,
    'connections': ConnectionsScene,
    'clock-time': ClockScene,
    'heartbeat': HeartbeatScene,
    'money-flow': MoneyFlowScene,
    'lightning': LightningScene,
    'shopping-cart': ShoppingCartScene,
    'cooking': CookingScene,
    'nature-tree': NatureTreeScene,
    'city-skyline': CitySkylineScene,
    'person-walking': PersonWalkingScene,
    'celebration': CelebrationScene,
    'music-notes': MusicNotesScene,
    'book-reading': BookReadingScene,
    'camera': CameraScene,
    'code-terminal': CodeTerminalScene,
    'fire-blaze': FireBlazeScene,
    'water-wave': WaterWaveScene,
    'shield-protect': ShieldProtectScene,
    'target-bullseye': TargetBullseyeScene,
    'explosion-burst': ExplosionBurstScene,
    'magnet-attract': MagnetAttractScene,
    'gear-system': GearSystemScene,
    'energy-pulse': EnergyPulseScene,
    'eye-vision': EyeVisionScene,
    'arrow-growth': ArrowGrowthScene,
    'checkmark-success': CheckmarkSuccessScene,
    'diamond-gem': DiamondGemScene,
    'crown-royal': CrownRoyalScene,
    'atom-science': AtomScienceScene,
    'mountain-peak': MountainPeakScene,
};

// ==================== MAIN COMPONENT ====================

// Unique gradient palettes — hashed per scene+label for variety
const GRADIENT_PALETTES = [
    ['#1a0533', '#0d1b2a', '#1b2838'], // Deep purple → navy
    ['#0a1628', '#0f2027', '#203a43'], // Ocean blue
    ['#1a0a0a', '#2d1515', '#3d1f1f'], // Deep burgundy
    ['#0a1a0a', '#132a13', '#1a3a1a'], // Forest green
    ['#1a1a0a', '#2d2d15', '#3d3d1f'], // Amber gold
    ['#0a0a1a', '#15152d', '#1f1f3d'], // Royal indigo
    ['#1a0a1a', '#2d152d', '#3d1f3d'], // Magenta deep
    ['#0a1a1a', '#152d2d', '#1f3d3d'], // Teal deep
    ['#1a0f0a', '#2d1a15', '#3d251f'], // Warm brown
    ['#0f0a1a', '#1a152d', '#251f3d'], // Cool violet
];

const ACCENT_COLORS = [
    '#a78bfa', '#60a5fa', '#f472b6', '#34d399', '#fbbf24',
    '#818cf8', '#38bdf8', '#fb7185', '#4ade80', '#f59e0b',
    '#c084fc', '#22d3ee', '#e879f9', '#2dd4bf', '#facc15',
];

export const VisualIllustration: React.FC<VisualIllustrationProps> = ({
    scene,
    label = '',
    color = '#6366f1',
    displayMode = 'overlay',
    transition = 'fade-in',
    startFrame,
    endFrame,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const uniqueId = useId();

    if (frame < startFrame || frame > endFrame) return null;

    const localFrame = frame - startFrame;
    const duration = endFrame - startFrame;

    // Hash scene+label to pick unique gradient and accent per segment
    const hashStr = `${scene}${label}${startFrame}`;
    const hash = hashStr.split('').reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0);
    const absHash = Math.abs(hash);
    const palette = GRADIENT_PALETTES[absHash % GRADIENT_PALETTES.length];
    const accent = ACCENT_COLORS[absHash % ACCENT_COLORS.length];

    // Transition entrance
    let enterScale = 1;
    let enterOpacity = 1;
    let enterTranslateY = 0;

    if (transition === 'slide-in') {
        const slideProgress = spring({ frame: localFrame, fps, config: { damping: 14, stiffness: 80, mass: 0.8 } });
        enterTranslateY = (1 - slideProgress) * 80;
        enterOpacity = interpolate(localFrame, [0, 6], [0, 1], { extrapolateRight: 'clamp' });
        enterScale = slideProgress;
    } else if (transition === 'appear') {
        enterScale = spring({ frame: localFrame, fps, config: { damping: 8, stiffness: 150, mass: 0.5 } });
        enterOpacity = localFrame >= 1 ? 1 : 0;
    } else {
        enterScale = spring({ frame: localFrame, fps, config: { damping: 12, stiffness: 100, mass: 0.8 } });
        enterOpacity = interpolate(localFrame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
    }

    // Exit animation
    const exitOpacity = interpolate(localFrame, [duration - 12, duration], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const exitScale = interpolate(localFrame, [duration - 12, duration], [1, 0.85], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

    const opacity = Math.min(enterOpacity, exitOpacity);
    const scale = enterScale * exitScale;

    const SceneComponent = SCENES[scene] || SCENES['solar-system'];

    // Atmospheric glow pulse
    const glowPulse = 0.2 + Math.sin(localFrame * 0.04) * 0.08;
    const glowSize = 45 + Math.sin(localFrame * 0.03) * 15;

    // Use accent color for the scene rendering
    const sceneColor = accent;

    return (
        <AbsoluteFill style={{ pointerEvents: 'none' }}>
            {/* UNIQUE gradient background per segment — NOT the same for all */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: `linear-gradient(135deg, ${palette[0]} 0%, ${palette[1]} 50%, ${palette[2]} 100%)`,
                    opacity,
                }}
            />
            {/* Secondary radial glow with accent color */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: `radial-gradient(ellipse at 50% 40%, ${accent}25 0%, transparent 70%)`,
                    opacity,
                }}
            />
            {/* Floating ambient glow */}
            <div
                style={{
                    position: 'absolute',
                    left: '50%',
                    top: '40%',
                    width: `${glowSize}%`,
                    height: `${glowSize}%`,
                    transform: 'translate(-50%, -50%)',
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${accent}${Math.round(glowPulse * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
                    filter: 'blur(50px)',
                    opacity,
                    pointerEvents: 'none',
                }}
            />
            {/* Full-screen motion graphic scene */}
            <div style={{
                position: 'absolute',
                inset: '5%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity,
                transform: `scale(${scale}) translateY(${enterTranslateY}px)`,
                transformOrigin: 'center center',
                filter: `drop-shadow(0 0 40px ${accent}60)`,
            }}>
                <SceneComponent frame={localFrame} fps={fps} color={sceneColor} />
            </div>

            {/* PROMINENT label — big, bold, and unique per segment */}
            {label && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '8%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontFamily: "'Inter', 'Segoe UI', sans-serif",
                        fontSize: 28,
                        fontWeight: 800,
                        color: '#ffffff',
                        letterSpacing: '0.02em',
                        textAlign: 'center',
                        maxWidth: '80%',
                        lineHeight: 1.3,
                        textShadow: `0 0 20px ${accent}80, 0 2px 12px rgba(0,0,0,0.9)`,
                        background: `linear-gradient(135deg, rgba(0,0,0,0.6) 0%, ${accent}15 100%)`,
                        padding: '12px 28px',
                        borderRadius: '12px',
                        border: `1px solid ${accent}30`,
                        backdropFilter: 'blur(12px)',
                        opacity,
                        textTransform: 'uppercase',
                    }}
                >
                    {label}
                </div>
            )}
        </AbsoluteFill>
    );
};

