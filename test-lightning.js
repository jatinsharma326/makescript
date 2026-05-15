const https = require('https');

const data = JSON.stringify({
  model: "lightning-ai/deepseek-v4-pro",
  messages: [{ role: "user", content: "Write a small valid React component." }]
});

const options = {
  hostname: 'lightning.ai',
  path: '/api/v1/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer c2a705e5-38bf-4f63-be3c-e35092ae0906/mainhusharm/vision-model',
    'Content-Length': data.length
  }
};

const req = https.request(options, res => {
  let body = '';
  res.on('data', d => { body += d; });
  res.on('end', () => console.log('STATUS:', res.statusCode, body));
});
req.on('error', console.error);
req.write(data);
req.end();
