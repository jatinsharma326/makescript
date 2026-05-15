const Babel = require('@babel/standalone');
const React = require('react');

const reactCode = `
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Img } from "remotion";

const safeInterpolate = (value, inputRange, outputRange, options) => {
  if (!inputRange || !outputRange || inputRange.length < 2 || outputRange.length < 2) {
    return outputRange && outputRange[0] !== undefined ? outputRange[0] : 0;
  }
  const sortedPairs = inputRange.map((v, i) => ({ input: v, output: outputRange[i] }))
    .sort((a, b) => a.input - b.input);
  const uniquePairs = [];
  for (let i = 0; i < sortedPairs.length; i++) {
    if (i === sortedPairs.length - 1 || sortedPairs[i].input !== sortedPairs[i + 1].input) {
      uniquePairs.push(sortedPairs[i]);
    }
  }
  if (uniquePairs.length < 2) return outputRange[0] || 0;
  return interpolate(
    value,
    uniquePairs.map(p => p.input),
    uniquePairs.map(p => p.output),
    options || { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
};

const TOTAL_FRAMES = 18 * 30;
const SCENES = 6;
const FRAMES_PER_SCENE = Math.floor(TOTAL_FRAMES / SCENES);
const CROSSFADE = 30;

const particles = Array.from({ length: 300 }, (_, i) => ({
  id: i,
  x: Math.random() * 1080,
  y: Math.random() * 1920,
  size: Math.random() * 4 + 1,
  speed: Math.random() * 0.5 + 0.1,
  delay: Math.random() * 100,
}));

const sceneContent = [
  "The Great Attractor",
  "Our Galaxy in Motion",
  "Gravity's Pull",
  "Moving Fast",
  "Deep Space",
  "We Are Moving Very Fast",
];

const FocusMode = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sceneIndex = Math.floor(frame / FRAMES_PER_SCENE);
  const localFrame = frame - sceneIndex * FRAMES_PER_SCENE;
  const nextScene = sceneIndex + 1;
  const isLast = sceneIndex >= SCENES - 1;

  const opacity = safeInterpolate(
    localFrame,
    [FRAMES_PER_SCENE - CROSSFADE, FRAMES_PER_SCENE],
    [1, isLast ? 1 : 0]
  );
  const nextOpacity = isLast
    ? 0
    : safeInterpolate(
        localFrame,
        [FRAMES_PER_SCENE - CROSSFADE, FRAMES_PER_SCENE],
        [0, 1]
      );

  const titleSpring = spring({
    frame: localFrame,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  const moveX = safeInterpolate(localFrame, [0, FRAMES_PER_SCENE], [0, -200]);
  const scale = safeInterpolate(localFrame, [0, FRAMES_PER_SCENE], [1, 1.2]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0b1a" }}>
      {!isLast && (
        <AbsoluteFill
          style={{
            opacity: opacity,
            transform: \`scale(\${scale})\`,
          }}
        >
          <Scene
            text={sceneContent[sceneIndex]}
            frame={localFrame}
            index={sceneIndex}
          />
        </AbsoluteFill>
      )}
      {!isLast && (
        <AbsoluteFill style={{ opacity: nextOpacity }}>
          <Scene
            text={sceneContent[nextScene]}
            frame={localFrame + CROSSFADE - FRAMES_PER_SCENE}
            index={nextScene}
          />
        </AbsoluteFill>
      )}
      {isLast && (
        <AbsoluteFill style={{ opacity: 1 }}>
          <Scene
            text={sceneContent[SCENES - 1]}
            frame={localFrame}
            index={SCENES - 1}
          />
        </AbsoluteFill>
      )}

      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: p.x,
            top: (p.y + frame * p.speed) % 1920,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            backgroundColor: \`rgba(255,255,255,\${Math.sin(frame * 0.02 + p.delay) * 0.5 + 0.5})\`,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

const Scene = ({ text, frame, index }) => {
  const fadeIn = safeInterpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const moveY = safeInterpolate(frame, [0, 30], [50, 0], {
    extrapolateRight: "clamp",
  });

  const galaxyStyle =
    index === 1
      ? {
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          border: "2px solid rgba(100,150,255,0.3)",
          background:
            "conic-gradient(from 0deg, transparent, rgba(100,150,255,0.1), transparent)",
          top: "40%",
          left: "50%",
          transform: \`translate(-50%, -50%) rotate(\${frame * 0.5}deg)\`,
        }
      : {};

  const attractorGlow =
    index === 2
      ? {
          position: "absolute",
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "radial-gradient(circle, #ff4500, transparent)",
          top: "30%",
          left: "50%",
          transform: \`translate(-50%, -50%) scale(\${1 + Math.sin(frame * 0.1) * 0.05})\`,
          boxShadow: "0 0 100px rgba(255,69,0,0.5)",
        }
      : {};

  const speedLines =
    index === 3
      ? Array.from({ length: 30 }, (_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 4,
              height: 60,
              backgroundColor: \`rgba(200,200,255,\${0.3 + Math.sin(frame * 0.1 + i) * 0.2})\`,
              left: \`\${i * 40}px\`,
              top: \`\${(frame * 5 + i * 50) % 1920}px\`,
              transform: \`rotate(10deg)\`,
            }}
          />
        ))
      : null;

  return (
    <AbsoluteFill
      style={{
        opacity: fadeIn,
        transform: \`translateY(\${moveY}px)\`,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(15,0,40,0.8) 0%, rgba(0,0,0,1) 100%)",
        }}
      />
      {galaxyStyle && <div style={galaxyStyle} />}
      {attractorGlow && <div style={attractorGlow} />}
      {speedLines}
      <div
        style={{
          position: "absolute",
          bottom: "20%",
          width: "100%",
          textAlign: "center",
          fontFamily: "Arial, sans-serif",
          fontSize: "3rem",
          fontWeight: 800,
          color: "white",
          textShadow: "0 0 30px rgba(0,100,255,0.7)",
          letterSpacing: "0.1em",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

export default FocusMode;
`;

try {
  const transpiled = Babel.transform(reactCode, {
      presets: ['env', 'react', 'typescript'],
      filename: 'dynamic.tsx',
  }).code;
  
  console.log("SUCCESSFULLY TRANSPILED!");
  
  const scope = {
      React,
      AbsoluteFill: () => null,
      useCurrentFrame: () => 10,
      useVideoConfig: () => ({ fps: 30, durationInFrames: 90 }),
      spring: () => 1,
      interpolate: () => 1,
      console
  };

  const evalCode = `
      const exports = {};
      const require = (moduleName) => {
          if (moduleName === 'react') return scope.React;
          if (moduleName === 'remotion') return scope;
          throw new Error('Module ' + moduleName + ' not found');
      };
      ${Object.keys(scope).map(k => `const ${k} = scope.${k};`).join('\n')}
      
      ${transpiled}
      
      return exports.LiveGraphic || exports.default || exports.FocusMode || Object.values(exports)[0] || null;
  `;

  const createComponent = new Function('scope', evalCode);
  const Component = createComponent(scope);
  console.log("Component type:", typeof Component);
} catch(e) {
  console.error("FAILED TO EVALUATE", e);
}
