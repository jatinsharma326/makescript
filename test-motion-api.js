// Test the generate-live-remotion API endpoint
const http = require('http');

const body = JSON.stringify({
  text: "The nuclear bomb exploded with devastating force",
  mood: "dramatic",
  topic: "war",
  color: "#ff4444",
  label: "NUCLEAR DETONATION",
  durationInSeconds: 18,
  fullTranscript: "In 1945, the first nuclear bomb was detonated in the desert of New Mexico. The explosion created a massive mushroom cloud that rose into the sky. Millions of people were affected by the radiation that spread across the land. Cities were destroyed in an instant. The world was forever changed by this terrible weapon.",
  title: "The Nuclear Age"
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/generate-live-remotion',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  }
};

console.log('Testing /api/generate-live-remotion...');

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('\n=== RESPONSE ===');
      console.log('Success:', json.success);
      console.log('Error:', json.error || 'none');
      console.log('Code length:', json.codeLength || (json.reactCode?.length || 0));
      console.log('Has SVG:', json.hasSvg);
      console.log('Source:', json.source);
      
      if (json.reactCode) {
        console.log('\n=== FIRST 500 CHARS OF CODE ===');
        console.log(json.reactCode.substring(0, 500));
        console.log('\n=== LAST 200 CHARS OF CODE ===');
        console.log(json.reactCode.substring(json.reactCode.length - 200));
        
        // Check for common issues
        console.log('\n=== CODE QUALITY CHECKS ===');
        console.log('Has import:', json.reactCode.includes('import'));
        console.log('Has AbsoluteFill:', json.reactCode.includes('AbsoluteFill'));
        console.log('Has FocusMode:', json.reactCode.includes('FocusMode'));
        console.log('Has export default:', json.reactCode.includes('export default'));
        console.log('Has <svg:', json.reactCode.includes('<svg'));
        console.log('Has <circle:', json.reactCode.includes('<circle'));
        console.log('Has <path:', json.reactCode.includes('<path'));
        console.log('Has backgroundColor:', json.reactCode.includes('backgroundColor'));
        console.log('Has opaque bg:', /backgroundColor:\s*["']#[0-9a-f]{3,6}["']/i.test(json.reactCode));
        
        // Save full code
        require('fs').writeFileSync('test-motion-output.txt', json.reactCode);
        console.log('\nFull code saved to test-motion-output.txt');
      }
    } catch(e) {
      console.error('Failed to parse response:', data.substring(0, 500));
    }
  });
});

req.on('error', e => {
  console.error('Request failed:', e.message);
  console.log('\nMake sure the dev server is running: npm run dev');
});

req.write(body);
req.end();
