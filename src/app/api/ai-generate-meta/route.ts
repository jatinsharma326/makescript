import { NextRequest, NextResponse } from 'next/server';
import { getUserSubscription, getModelForTier } from '@/lib/subscription';

const LIGHTNING_API_URL = process.env.LIGHTNING_API_URL || 'https://lightning.ai/api/v1/chat/completions';
const LIGHTNING_API_KEY = process.env.LIGHTNING_API_KEY || '';
const LIGHTNING_MODEL = process.env.LIGHTNING_MODEL || 'anthropic/claude-sonnet-4-6';

export async function POST(req: NextRequest) {
    try {
        const { transcript } = await req.json();

        if (!transcript || typeof transcript !== 'string') {
            return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
        }

        const sub = await getUserSubscription();
        const activeModel = getModelForTier(sub.tier);

        if (!LIGHTNING_API_KEY) {
            // Fallback: generate locally without AI
            return NextResponse.json(generateLocalMeta(transcript));
        }

const prompt = `You are a video content strategist. Based on the following video transcript, generate:
1. A catchy, click-worthy video title (max 80 chars)
2. A compelling YouTube/social media description (2-3 sentences, max 200 chars)
3. 5-8 relevant hashtags
4. A one-line hook/tagline for thumbnails (max 40 chars)
5. YouTube Chapters (Timestamps with short titles) based on the flow. Make up reasonable timestamps if none are provided, starting from 0:00.
6. A short engaging Twitter Thread (2-3 tweets) summarizing the video's main points. 
7. A professional LinkedIn post summarizing the video.

Transcript:
"""
${transcript.substring(0, 3000)}
"""

Respond ONLY with valid JSON, no markdown:
{
  "title": "...",
  "description": "...",
  "hashtags": ["#tag1", "#tag2", ...],
  "hook": "...",
  "chapters": "0:00 Intro\n1:20 Main Point\n...",
  "twitter": "...",
  "linkedin": "..."
}`;

        const response = await fetch(LIGHTNING_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${LIGHTNING_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: activeModel,
                messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
                max_tokens: 500,
                temperature: 0.8,
            }),
        });

        if (!response.ok) {
            console.error('[AI Meta] API error:', response.status);
            return NextResponse.json(generateLocalMeta(transcript));
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        // Parse JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return NextResponse.json({
                title: parsed.title || 'Untitled Video',
                description: parsed.description || '',
                hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
                hook: parsed.hook || '',
                chapters: parsed.chapters || '',
                twitter: parsed.twitter || '',
                linkedin: parsed.linkedin || '',
            });
        }

        return NextResponse.json(generateLocalMeta(transcript));
    } catch (error) {
        console.error('[AI Meta] Error:', error);
        return NextResponse.json(generateLocalMeta(''));
    }
}

function generateLocalMeta(transcript: string) {
    const words = transcript.split(/\s+/).filter(w => w.length > 3);
    const keywords = [...new Set(words.slice(0, 20))].slice(0, 5);
    const firstSentence = transcript.split(/[.!?]/)[0]?.trim() || 'My Video';

    return {
        title: firstSentence.length > 60 ? firstSentence.substring(0, 57) + '...' : firstSentence,
        description: `Watch this video about ${keywords.slice(0, 3).join(', ')}. Don't miss the key insights shared in this content.`,
        hashtags: keywords.map(k => `#${k.toLowerCase().replace(/[^a-z0-9]/g, '')}`).filter(h => h.length > 2),
        hook: keywords[0] ? `The truth about ${keywords[0]}` : 'Watch this!',
        chapters: "0:00 Intro\n1:00 Main Content\n2:00 Outro",
        twitter: `Just dropped a new video on ${keywords[0] || 'this topic'}! Watch here: [link]\n\nA thread 🧵:`,
        linkedin: `Excited to share my latest thoughts on ${keywords[0] || 'this topic'}! In this video, we cover the essentials. Let me know your thoughts downstream!`,
    };
}
