import React from 'react';
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
                <radialGradient id="sunGlow">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity={sunGlow} />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="sunCore">
                    <stop offset="0%" stopColor="#fef3c7" />
                    <stop offset="50%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#f59e0b" />
                </radialGradient>
            </defs>
            <circle cx="150" cy="150" r="70" fill="url(#sunGlow)" />
            {/* Sun */}
            <circle cx="150" cy="150" r={30 * sunPulse} fill="url(#sunCore)" />
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
                            <linearGradient id={`barGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={color} stopOpacity="0.9" />
                                <stop offset="100%" stopColor={color} stopOpacity="0.4" />
                            </linearGradient>
                        </defs>
                        <rect x={x} y={220 - barHeight} width="24" height={barHeight} rx="4" fill={`url(#barGrad-${i})`} />
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
    const rotation = (frame * 2) % 360;
    const pulse = 1 + Math.sin(frame * 0.05) * 0.02;

    return (
        <svg viewBox="0 0 300 300" width="100%" height="100%">
            <defs>
                <radialGradient id="globeGrad" cx="40%" cy="35%">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="60%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1e3a5f" />
                </radialGradient>
                <clipPath id="globeClip">
                    <circle cx="150" cy="150" r={90 * pulse} />
                </clipPath>
            </defs>
            {/* Globe glow */}
            <circle cx="150" cy="155" r="95" fill={color} opacity="0.08" filter="blur(8px)" />
            {/* Globe body */}
            <circle cx="150" cy="150" r={90 * pulse} fill="url(#globeGrad)" />
            {/* Meridian lines */}
            <g clipPath="url(#globeClip)">
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
                <clipPath id="ekgClip">
                    <rect x="20" y="70" width="260" height="160" />
                </clipPath>
                <g clipPath="url(#ekgClip)">
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
    const windSway = Math.sin(frame * 0.06) * 5;
    const leafDrift = (frame * 0.8) % 400;
    const sunGlow = 0.5 + Math.sin(frame * 0.04) * 0.2;

    return (
        <svg viewBox="0 0 400 400" width="100%" height="100%">
            {/* Sky gradient */}
            <defs>
                <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0c4a6e" />
                    <stop offset="100%" stopColor="#164e63" />
                </linearGradient>
            </defs>
            <rect x="0" y="0" width="400" height="400" fill="url(#skyGrad)" />
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
};

// ==================== MAIN COMPONENT ====================

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

    if (frame < startFrame || frame > endFrame) return null;

    const localFrame = frame - startFrame;
    const duration = endFrame - startFrame;

    // === Transition-specific entrance animation ===
    let enterScale = 1;
    let enterOpacity = 1;
    let enterTranslateY = 0;

    if (transition === 'slide-in') {
        const slideProgress = spring({
            frame: localFrame,
            fps,
            config: { damping: 14, stiffness: 80, mass: 0.8 },
        });
        enterTranslateY = (1 - slideProgress) * 80;
        enterOpacity = interpolate(localFrame, [0, 6], [0, 1], { extrapolateRight: 'clamp' });
        enterScale = slideProgress;
    } else if (transition === 'appear') {
        enterScale = spring({
            frame: localFrame,
            fps,
            config: { damping: 8, stiffness: 150, mass: 0.5 },
        });
        enterOpacity = localFrame >= 1 ? 1 : 0;
    } else {
        // fade-in (default)
        enterScale = spring({
            frame: localFrame,
            fps,
            config: { damping: 12, stiffness: 100, mass: 0.8 },
        });
        enterOpacity = interpolate(localFrame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
    }

    // Exit animation
    const exitOpacity = interpolate(localFrame, [duration - 12, duration], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });
    const exitScale = interpolate(localFrame, [duration - 12, duration], [1, 0.85], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });

    const opacity = Math.min(enterOpacity, exitOpacity);
    const scale = enterScale * exitScale;

    const SceneComponent = SCENES[scene] || SCENES['solar-system'];

    // === Display mode positioning ===
    const getContainerStyle = (): React.CSSProperties => {
        const base: React.CSSProperties = {
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            opacity,
            filter: `drop-shadow(0 0 20px ${color}40) drop-shadow(0 4px 12px rgba(0,0,0,0.5))`,
        };

        switch (displayMode) {
            case 'full':
                return {
                    ...base,
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    justifyContent: 'center',
                    transform: `scale(${scale}) translateY(${enterTranslateY}px)`,
                    transformOrigin: 'center center',
                };
            case 'fit':
                return {
                    ...base,
                    inset: '40px',
                    justifyContent: 'center',
                    transform: `scale(${scale}) translateY(${enterTranslateY}px)`,
                    transformOrigin: 'center center',
                };
            case 'card':
                return {
                    ...base,
                    right: '60px',
                    top: '60px',
                    transform: `scale(${scale}) translateY(${enterTranslateY}px)`,
                    transformOrigin: 'top right',
                    background: 'rgba(15, 23, 42, 0.6)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '24px',
                    boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4), 0 0 40px ${color}15`,
                };
            case 'fade-up':
                return {
                    ...base,
                    left: '50%',
                    bottom: '120px',
                    transform: `translateX(-50%) scale(${scale}) translateY(${enterTranslateY}px)`,
                    transformOrigin: 'center bottom',
                };
            case 'fade-down':
                return {
                    ...base,
                    left: '50%',
                    top: '60px',
                    transform: `translateX(-50%) scale(${scale}) translateY(${-enterTranslateY}px)`,
                    transformOrigin: 'center top',
                };
            case 'split-top':
                return {
                    ...base,
                    left: 0,
                    right: 0,
                    top: 0,
                    height: '50%',
                    justifyContent: 'center',
                    background: 'rgba(0, 0, 0, 0.3)',
                    transform: `scale(${scale}) translateY(${-enterTranslateY}px)`,
                    transformOrigin: 'center top',
                };
            case 'split-bottom':
                return {
                    ...base,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: '50%',
                    justifyContent: 'center',
                    background: 'rgba(0, 0, 0, 0.3)',
                    transform: `scale(${scale}) translateY(${enterTranslateY}px)`,
                    transformOrigin: 'center bottom',
                };
            case 'overlay':
            default:
                return {
                    ...base,
                    right: '60px',
                    bottom: '100px',
                    transform: `scale(${scale}) translateY(${enterTranslateY}px)`,
                    transformOrigin: 'bottom right',
                };
        }
    };

    // Background dim varies by mode
    const dimOpacity = (displayMode === 'full' || displayMode === 'fit') ? 0.3 : 0.15;

    return (
        <AbsoluteFill style={{ pointerEvents: 'none' }}>
            {/* Background dim */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: `rgba(0, 0, 0, ${dimOpacity})`,
                    opacity,
                }}
            />
            {/* Illustration container */}
            <div style={getContainerStyle()}>
                {(displayMode === 'full' || displayMode === 'fit' || displayMode === 'split-top' || displayMode === 'split-bottom') ? (
                    <div style={{ flex: 1, width: '100%', minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <SceneComponent frame={localFrame} fps={fps} color={color} />
                    </div>
                ) : (
                    <div style={{ width: 260, height: 260 }}>
                        <SceneComponent frame={localFrame} fps={fps} color={color} />
                    </div>
                )}

                {label && (
                    <div
                        style={{
                            fontFamily: "'Inter', 'Segoe UI', sans-serif",
                            fontSize: displayMode === 'full' ? 18 : 13,
                            fontWeight: 600,
                            color: 'rgba(255, 255, 255, 0.75)',
                            letterSpacing: '0.03em',
                            textAlign: 'center',
                            maxWidth: '280px',
                            lineHeight: 1.3,
                            textShadow: '0 2px 8px rgba(0,0,0,0.7)',
                            background: 'rgba(0,0,0,0.35)',
                            padding: '4px 12px',
                            borderRadius: '6px',
                        }}
                    >
                        {label}
                    </div>
                )}
            </div>
        </AbsoluteFill>
    );
};
