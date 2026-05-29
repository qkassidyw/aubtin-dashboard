// Fireflies sync endpoint - fetches calls and updates data/calls.json
const FIREFLIES_API = "https://api.fireflies.ai/graphql";
const FIREFLIES_TOKEN = process.env.FIREFLIES_TOKEN || "03e44d1e-7383-460b-b564-2e4e0dfc581c";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch Aubtin's calls from Fireflies
    const response = await fetch(FIREFLIES_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIREFLIES_TOKEN}`
      },
      body: JSON.stringify({
        query: `query { transcripts(limit: 50) { id title date duration participants sentences { text speaker_name } summary { action_items keywords overview } } }`
      })
    });

    const data = await response.json();
    
    // Filter for Aubtin's sales calls
    const aubtinCalls = data.data.transcripts.filter(t => 
      t.title.includes("Apex Early Adopter Call") && t.title.includes("Aubtin")
    );

    // Store to data/calls.json (Vercel will serve this)
    // In production, this would write to a database or KV store
    
    return res.status(200).json({
      success: true,
      callsFound: aubtinCalls.length,
      calls: aubtinCalls
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
