#!/usr/bin/env node
// Standalone script to fetch Fireflies calls and update data/calls.json
const fs = require('fs');
const path = require('path');

const FIREFLIES_API = "https://api.fireflies.ai/graphql";
const FIREFLIES_TOKEN = process.env.FIREFLIES_TOKEN || "03e44d1e-7383-460b-b564-2e4e0dfc581c";

async function syncCalls() {
  console.log("Fetching Aubtin's calls from Fireflies...");
  
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

  // Write to data/calls.json
  const dataPath = path.join(__dirname, '../data/calls.json');
  fs.writeFileSync(dataPath, JSON.stringify(aubtinCalls, null, 2));

  console.log(`✓ Synced ${aubtinCalls.length} calls to data/calls.json`);
}

syncCalls().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});
