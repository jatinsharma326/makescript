import React from 'react';
import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    spring,
    interpolate,
    random,
} from 'remotion';

interface SceneTransitionProps {
    color?: string;
    text?: string;
    startFrame: number;
    endFrame: number;
    style?: 'fade' | 'wipe' | 'zoom';
}

export const SceneTransition: React.FC<SceneTransitionProps> = ({
    color = '#6366f1',
    text,
    startFrame,
    endFrame,
    style = 'fade',
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    if (frame < startFrame || frame > endFrame) return null;

    const localFrame = frame - startFrame;
    const duration = endFrame - startFrame;
    const midpoint = duration / 2;

    // === Wipe — anamorphic light bar sweep with prismatic trail ===
    if (style === 'wipe') {
        const wipeProgress = interpolate(
            localFrame,
            [0, duration],
            [0, 1],
            { extrapolateRight: 'clamp' }
        );
        const wipePos = interpolate(wipeProgress, [0, 1], [-5, 105]);
        const wipeOpacity = interpolate(
            localFrame,
            [0, 3, duration - 3, duration],
            [0, 1, 1, 0],
            { extrapolateRight: 'clamp' }
        );

        // Prismatic color split
        const prismOffset = 8;

        return (
            <AbsoluteFill style={{ pointerEvents: 'none' }}>
                {/* Pre-glow leading light */}
                <div
                    style={{
                        position: 'absolute',
                        left: `${wipePos + 3}%`,
                        top: 0,
                        width: '100px',
                        height: '100%',
                        background: `linear-gradient(90deg, transparent, ${color}08, transparent)`,
                        opacity: wipeOpacity * 0.5,
                        filter: 'blur(20px)',
                    }}
                />

                {/* Chromatic aberration - red channel */}
                <div
                    style={{
                        position: 'absolute',
                        left: `${wipePos - 0.3}%`,
                        top: 0,
                        width: '3px',
                        height: '100%',
                        background: `linear-gradient(180deg, transparent 5%, #ff6b6b40 20%, #ff6b6b60 50%, #ff6b6b40 80%, transparent 95%)`,
                        opacity: wipeOpacity * 0.6,
                        filter: 'blur(1px)',
                    }}
                />

                {/* Main wipe bar - intense bright core */}
                <div
                    style={{
                        position: 'absolute',
                        left: `${wipePos}%`,
                        top: 0,
                        width: '3px',
                        height: '100%',
                        background: `linear-gradient(180deg, transparent 3%, ${color}80 15%, white 30%, white 70%, ${color}80 85%, transparent 97%)`,
                        boxShadow: `
                            0 0 15px 3px ${color}50,
                            0 0 30px 6px ${color}30,
                            0 0 60px 12px ${color}15,
                            0 0 100px 20px ${color}08
                        `,
                        opacity: wipeOpacity,
                    }}
                />

                {/* Chromatic aberration - blue channel */}
                <div
                    style={{
                        position: 'absolute',
                        left: `${wipePos + 0.3}%`,
                        top: 0,
                        width: '3px',
                        height: '100%',
                        background: `linear-gradient(180deg, transparent 5%, #6b8bff40 20%, #6b8bff60 50%, #6b8bff40 80%, transparent 95%)`,
                        opacity: wipeOpacity * 0.6,
                        filter: 'blur(1px)',
                    }}
                />

                {/* Trailing light wash */}
                <div
                    style={{
                        position: 'absolute',
                        left: `${wipePos - 4}%`,
                        top: 0,
                        width: '80px',
                        height: '100%',
                        background: `linear-gradient(90deg, transparent, ${color}06, transparent)`,
                        opacity: wipeOpacity * 0.8,
                        filter: 'blur(12px)',
                    }}
                />

                {/* Horizontal anamorphic flare at center */}
                <div
                    style={{
                        position: 'absolute',
                        left: `${wipePos - 2}%`,
                        top: '48%',
                        width: '120px',
                        height: '4px',
                        background: `linear-gradient(90deg, transparent, ${color}30, white, ${color}30, transparent)`,
                        opacity: wipeOpacity * 0.4,
                        filter: 'blur(2px)',
                    }}
                />

                {/* Micro sparkles along the wipe line */}
                {[0, 1, 2, 3, 4].map((i) => {
                    const sparkY = 15 + i * 18;
                    const sparkPulse = Math.sin(localFrame * 0.5 + i * 1.5) > 0.3;
                    return sparkPulse ? (
                        <div
                            key={`spark-${i}`}
                            style={{
                                position: 'absolute',
                                left: `${wipePos}%`,
                                top: `${sparkY}%`,
                                width: '4px',
                                height: '4px',
                                borderRadius: '50%',
                                background: 'white',
                                boxShadow: `0 0 6px 2px white, 0 0 12px 4px ${color}60`,
                                opacity: wipeOpacity * 0.6,
                                transform: 'translate(-50%, -50%)',
                            }}
                        />
                    ) : null;
                })}
            </AbsoluteFill>
        );
    }

    // === Zoom — cinematic dolly zoom with radial light and film grain ===
    if (style === 'zoom') {
        const zoomProgress = interpolate(
            localFrame,
            [0, midpoint, duration],
            [0, 1, 0],
            { extrapolateRight: 'clamp' }
        );

        const vignetteOpacity = interpolate(
            zoomProgress,
            [0, 0.5, 1],
            [0, 0.5, 0.35]
        );

        const flashOpacity = interpolate(
            localFrame,
            [midpoint - 2, midpoint, midpoint + 4],
            [0, 0.4, 0],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );

        // Radial light rays
        const rayIntensity = interpolate(zoomProgress, [0, 0.5, 1], [0, 0.6, 0.2]);
        const rayRotation = localFrame * 0.5;

        // Edge chromatic ring
        const ringSize = interpolate(zoomProgress, [0, 1], [0, 120]);

        return (
            <AbsoluteFill style={{ pointerEvents: 'none' }}>
                {/* Deep vignette */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: `radial-gradient(circle at 50% 50%, transparent ${30 + (1 - zoomProgress) * 20}%, rgba(0,0,0,0.15) ${60 + (1 - zoomProgress) * 10}%, rgba(0,0,0,${vignetteOpacity}) 100%)`,
                    }}
                />

                {/* Volumetric light rays */}
                {[0, 1, 2, 3, 4, 5].map((i) => {
                    const rayAngle = (i * 60 + rayRotation) * Math.PI / 180;
                    const rayWidth = 40 + Math.sin(localFrame * 0.1 + i * 2) * 15;
                    return (
                        <div
                            key={`ray-${i}`}
                            style={{
                                position: 'absolute',
                                left: '50%',
                                top: '50%',
                                width: `${rayWidth}px`,
                                height: '200%',
                                transform: `translate(-50%, -50%) rotate(${i * 60 + rayRotation}deg)`,
                                background: `linear-gradient(180deg, transparent 35%, ${color}06 45%, ${color}10 50%, ${color}06 55%, transparent 65%)`,
                                opacity: rayIntensity,
                                transformOrigin: 'center center',
                            }}
                        />
                    );
                })}

                {/* Chromatic edge ring */}
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        width: `${ringSize * 5}px`,
                        height: `${ringSize * 5}px`,
                        transform: 'translate(-50%, -50%)',
                        borderRadius: '50%',
                        border: `1px solid ${color}15`,
                        boxShadow: `
                            0 0 30px ${color}10,
                            inset 0 0 30px ${color}05,
                            0 0 60px ${color}06
                        `,
                        opacity: vignetteOpacity * 0.8,
                    }}
                />

                {/* Inner glow ring */}
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        width: `${ringSize * 3}px`,
                        height: `${ringSize * 3}px`,
                        transform: 'translate(-50%, -50%)',
                        borderRadius: '50%',
                        border: `0.5px solid ${color}10`,
                        opacity: vignetteOpacity * 0.5,
                    }}
                />

                {/* Center flash */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: `radial-gradient(circle at 50% 50%, white 0%, ${color}20 20%, transparent 50%)`,
                        opacity: flashOpacity,
                        mixBlendMode: 'screen',
                    }}
                />

                {/* Film grain texture overlay */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        opacity: 0.03,
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                        backgroundSize: '150px 150px',
                        mixBlendMode: 'overlay',
                    }}
                />
            </AbsoluteFill>
        );
    }

    // === Fade — cinematic light leak with film flash ===
    const flashProgress = interpolate(
        localFrame,
        [0, 3, 6, 15],
        [0, 1, 0.3, 0],
        { extrapolateRight: 'clamp' }
    );

    // Light leak animation
    const leakX = interpolate(localFrame, [0, duration], [-20, 120], {
        extrapolateRight: 'clamp',
    });
    const leakOpacity = interpolate(
        localFrame,
        [0, 4, 10, 20],
        [0, 0.5, 0.3, 0],
        { extrapolateRight: 'clamp' }
    );

    // Horizontal accent line
    const lineScale = spring({
        frame: localFrame,
        fps,
        config: { damping: 20, stiffness: 80, mass: 0.5 },
    });
    const lineOpacity = interpolate(localFrame, [0, 5, 18], [0, 0.5, 0], {
        extrapolateRight: 'clamp',
    });

    // Secondary accent
    const secondLineScale = spring({
        frame: Math.max(0, localFrame - 3),
        fps,
        config: { damping: 18, stiffness: 100, mass: 0.5 },
    });

    return (
        <AbsoluteFill style={{ pointerEvents: 'none' }}>
            {/* Flash with gradient */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: `linear-gradient(145deg, white 0%, ${color}15 50%, transparent 100%)`,
                    opacity: flashProgress * 0.5,
                    mixBlendMode: 'screen',
                }}
            />

            {/* Film light leak - warm orange/amber diagonal */}
            <div
                style={{
                    position: 'absolute',
                    left: `${leakX}%`,
                    top: '-20%',
                    width: '35%',
                    height: '140%',
                    background: `linear-gradient(135deg, transparent, ${color}12, #f59e0b10, transparent)`,
                    opacity: leakOpacity,
                    filter: 'blur(30px)',
                    transform: 'rotate(-15deg)',
                }}
            />

            {/* Secondary light leak - cooler tone */}
            <div
                style={{
                    position: 'absolute',
                    right: `${100 - leakX}%`,
                    bottom: '-10%',
                    width: '25%',
                    height: '120%',
                    background: `linear-gradient(-135deg, transparent, #818cf810, ${color}08, transparent)`,
                    opacity: leakOpacity * 0.6,
                    filter: 'blur(25px)',
                    transform: 'rotate(10deg)',
                }}
            />

            {/* Primary accent line */}
            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    right: 0,
                    height: '1px',
                    background: `linear-gradient(90deg, transparent 5%, ${color}60 30%, white 50%, ${color}60 70%, transparent 95%)`,
                    opacity: lineOpacity,
                    transform: `scaleX(${lineScale})`,
                    boxShadow: `0 0 10px 2px ${color}25`,
                }}
            />

            {/* Secondary accent line (offset) */}
            <div
                style={{
                    position: 'absolute',
                    top: 'calc(50% + 4px)',
                    left: 0,
                    right: 0,
                    height: '1px',
                    background: `linear-gradient(90deg, transparent 10%, ${color}30 35%, ${color}40 50%, ${color}30 65%, transparent 90%)`,
                    opacity: lineOpacity * 0.4,
                    transform: `scaleX(${secondLineScale * 0.8})`,
                }}
            />

            {/* Corner vignette pulse */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(0,0,0,0.12) 100%)',
                    opacity: flashProgress * 0.6,
                }}
            />
        </AbsoluteFill>
    );
};
