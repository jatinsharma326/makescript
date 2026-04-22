async function testApi() {
    try {
        console.log("Testing ai-generate-meta...");
        const res1 = await fetch('http://localhost:3000/api/ai-generate-meta', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript: "Hello this is a test video about AI bugs" })
        });
        const text1 = await res1.text();
        console.log("Status:", res1.status);
        console.log("Response:", text1);
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}
testApi();
