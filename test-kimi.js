const https = require('https');

const CROF_API_KEY = 'nahcrof_rcslczMHjGgdjeirbelH';
const CROF_MODEL = 'kimi-k2.6-precision';
const durationInSeconds = 3;
const text = "Great attractor is pulling our galaxy";
const color = "#6366f1";
const label = "GREAT ATTRACTOR";

const systemPrompt = `You are a creative Remotion developer who creates stunning motion graphics for ANY video topic.
YOUR TASK: Create a cinematic, high-quality motion design React component using Remotion that visually illustrates the exact text segment provided.
VISUAL STYLE RULES:
- The visuals MUST directly represent the transcript content. Match visuals to the detected category.
- Add 200-400 animated particles relevant to the topic.
- Use smooth transitions + 30-frame crossfade for entrance and exit.
TECHNICAL REQUIREMENTS:
- Use React + Remotion strictly.
- Use AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Img.
- Component name MUST be: FocusMode or LiveGraphic.
- Do NOT use any external libraries (no styled-components, framer-motion, etc).
- The total video duration MUST strictly match ${durationInSeconds} seconds at 30fps.
OUTPUT RULES:
- Return ONLY valid, syntactically perfect JavaScript/React code.
- No explanations. No markdown fences.
- Provide only the raw code.`;

const userPrompt = `Create a Remotion animation component for this video segment:
SCRIPT CONTENT: "${text}"
The video MUST:
- Match ${durationInSeconds}s duration perfectly
- Be 1080x1920 vertical
- Use professional motion graphics with 200-400 particles.
- Display the label: "${label}" as the central element.
- Primary color: ${color}
Return only the raw code.`;

const data = JSON.stringify({
  model: CROF_MODEL,
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ],
  temperature: 0.7,
  max_tokens: 4096
});

const options = {
  hostname: 'crof.ai',
  port: 443,
  path: '/v2/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${CROF_API_KEY}`,
    'Content-Length': data.length
  }
};

const req = https.request(options, res => {
  let body = '';
  res.on('data', d => { body += d; });
  res.on('end', () => {
    try {
      const json = JSON.parse(body);
      const code = json.choices[0].message.content;
      require('fs').writeFileSync('kimi-output.txt', code);
      console.log('Saved to kimi-output.txt');
    } catch(e) { console.error(body); }
  });
});

req.on('error', error => { console.error(error); });
req.write(data);
req.end();
