// Test Babel transpilation of the generated motion graphics code
const Babel = require('@babel/standalone');
const React = require('react');
const fs = require('fs');

const reactCode = fs.readFileSync('test-motion-output.txt', 'utf-8');
console.log(`Code length: ${reactCode.length} chars`);

try {
    console.log('\n=== STEP 1: BABEL TRANSPILATION ===');
    const transpiled = Babel.transform(reactCode, {
        presets: ['env', 'react', 'typescript'],
        filename: 'dynamic.tsx',
    }).code;
    console.log('✅ Transpilation succeeded!');
    console.log(`Transpiled length: ${transpiled.length} chars`);
    
    // Check for common issues
    console.log('\n=== STEP 2: EVALUATION ===');
    
    const scope = {
        React,
        AbsoluteFill: (props) => React.createElement('div', props),
        useCurrentFrame: () => 30,
        useVideoConfig: () => ({ fps: 30, durationInFrames: 540, width: 1080, height: 1920 }),
        spring: (config) => {
            const { frame = 0, fps = 30, delay = 0 } = config || {};
            const t = Math.max(0, frame - delay) / fps;
            return Math.min(1, t * 2);
        },
        interpolate: (value, inputRange, outputRange, options) => {
            if (!inputRange || !outputRange || inputRange.length < 2) return 0;
            const t = Math.max(0, Math.min(1, (value - inputRange[0]) / (inputRange[inputRange.length-1] - inputRange[0])));
            return outputRange[0] + t * (outputRange[outputRange.length-1] - outputRange[0]);
        },
        Img: (props) => React.createElement('img', props),
        random: () => Math.random(),
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
    
    if (Component) {
        console.log('✅ Component found! Type:', typeof Component);
        console.log('Component name:', Component.name || Component.displayName || '(anonymous)');
        
        // Try to render
        try {
            const element = React.createElement(Component);
            console.log('✅ React.createElement succeeded!');
            console.log('Element type:', typeof element);
            console.log('\n=== ALL TESTS PASSED! ===');
        } catch(renderErr) {
            console.error('❌ React.createElement failed:', renderErr.message);
        }
    } else {
        console.error('❌ No component found in exports!');
        console.log('Exports keys check...');
        // Debug: run eval to see what exports look like
        const debugCode = `
            const exports = {};
            const require = (moduleName) => {
                if (moduleName === 'react') return scope.React;
                if (moduleName === 'remotion') return scope;
                throw new Error('Module ' + moduleName + ' not found');
            };
            ${Object.keys(scope).map(k => `const ${k} = scope.${k};`).join('\n')}
            ${transpiled}
            return Object.keys(exports);
        `;
        const getKeys = new Function('scope', debugCode);
        console.log('Export keys:', getKeys(scope));
    }
} catch(e) {
    console.error('❌ FAILED:', e.message);
    console.error('Stack:', e.stack?.split('\n').slice(0, 5).join('\n'));
}
