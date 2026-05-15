const Babel = require('@babel/standalone');
const React = require('react');

const reactCode = `
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import React, { useMemo } from "react";

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

const PARTICLE_COUNT = 300;
const CENTER_X = 540;
const CENTER_Y = 960;
const PRIMARY = "#6366f1";

const particleColors = ["#ffffff", "#e0e7ff", "#a5b4fc", "#818cf8", "#6366f1"];

const LiveGraphic = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const entranceOpacity = safeInterpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exitOpacity = safeInterpolate(
    frame,
    [durationInFrames - 30, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const opacity = Math.min(entranceOpacity, exitOpacity);

  const labelScale = spring({
    frame: frame - 10,
    fps,
    config: { damping: 12, stiffness: 80, mass: 0.5 },
  });

  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      startX: Math.random() * 1080,
      startY: Math.random() * 1920,
      delay: Math.random() * 30,
      speed: 0.5 + Math.random() * 1.5,
      size: 1.5 + Math.random() * 3,
      color: particleColors[Math.floor(Math.random() * particleColors.length)],
    }));
  }, []);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0b0d1a",
        opacity,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          color: "#ffffff",
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        GREAT ATTRACTOR
      </div>
    </AbsoluteFill>
  );
};

export default LiveGraphic;
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
