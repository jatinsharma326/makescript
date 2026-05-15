const http = require('http');

const body = JSON.stringify({
  subtitles: [
    { id: '1', text: 'The rocket launched into space.', startTime: 0, endTime: 3 },
    { id: '2', text: 'It flew past the moon.', startTime: 3, endTime: 6 },
    { id: '3', text: 'And reached mars.', startTime: 6, endTime: 9 }
  ],
  mood: 'energetic',
  model: 'kimi-k2.6-precision', videoDuration: 9, videoWidth: 1080, videoHeight: 1920
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/agent-edit',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  }
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
    } catch(e) {
      console.error('Failed to parse:', data.substring(0, 500));
    }
  });
});

req.on('error', e => console.error(e));
req.write(body);
req.end();

