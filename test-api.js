async function test() {
  const res = await fetch('http://localhost:3000/api/generate-live-remotion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: 'Great attractor is pulling our galaxy',
      mood: 'energetic',
      topic: 'space',
      color: '#6366f1',
      label: 'GREAT ATTRACTOR',
      durationInSeconds: 3
    })
  });
  const data = await res.json();
  console.log(data);
}
test();
