const https = require('https');

const CROF_API_KEY = 'nahcrof_rcslczMHjGgdjeirbelH';
const CROF_MODEL = 'kimi-k2.6-precision';
const durationInSeconds = 18;
const text = "Great attractor is pulling our galaxy";
const color = "#6366f1";
const label = "GREAT ATTRACTOR";
const fullTranscript = "This is a video about space. The great attractor is pulling our galaxy. We are moving very fast.";
const title = "Space Video";

const systemPrompt = `### SYSTEM INSTRUCTIONS ###
You are a creative Remotion developer who creates stunning motion graphics for ANY video topic.

YOUR FIRST TASK - DETECT THE TOPIC:

Read the title and script carefully. Determine what category the content falls into.

TITLE: ${title || "Video"}

SCRIPT CONTENT: ${fullTranscript?.substring(0, 1500) || text}

CATEGORIES:
News, War and Geopolitics, Entertainment, Anime, Gaming, Technology, Science, History, Nature, Sports, Music, Food, Travel, Business, Health, Education

VISUAL STYLE RULES:
- Match visuals to detected category
- Use cinematic, high-quality motion design
- Add particles relevant to topic (stars, pixels, petals, etc.)

TRANSITION BETWEEN SCENES & DURATION:
The total video duration MUST strictly match ${durationInSeconds} seconds.

CRITICAL:
- EXACTLY 6 scenes
- NO more, NO less

Use this math:
const totalFrames = ${durationInSeconds} * 30;
const framesPerScene = Math.floor(totalFrames / 6);
const sceneIndex = Math.floor(frame / framesPerScene);

TECHNICAL REQUIREMENTS:
- Use React + Remotion only
- Use AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Img
- Component name: FocusMode
- Add 200–400 animated particles
- Use smooth transitions + 30-frame crossfade

OUTPUT RULES:
- Return ONLY valid, syntactically perfect JavaScript/React code.
- No explanations. No markdown fences.
- Provide only the raw code.`;

const userPrompt = `### USER REQUEST ###
Create a Remotion animation for this video:

TITLE: ${title || "Video"}

SCRIPT CONTENT: ${fullTranscript?.substring(0, 1500) || text}

The video MUST:
- Have exactly 6 scenes
- Match ${durationInSeconds}s duration perfectly
- Be 1080x1920 vertical
- Use professional motion graphics
- Component name must be FocusMode

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
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = https.request(options, res => {
  let body = '';
  res.on('data', d => { body += d; });
  res.on('end', () => {
    try {
      const json = JSON.parse(body);
      const code = json.choices[0].message.content;
      require('fs').writeFileSync('kimi-output-6-scenes.txt', code);
      console.log('Saved to kimi-output-6-scenes.txt');
    } catch(e) { console.error("FAILED TO PARSE", body); }
  });
});

req.on('error', error => { console.error(error); });
req.write(data);
req.end();
