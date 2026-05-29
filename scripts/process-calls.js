#!/usr/bin/env node
// Process Fireflies transcripts and generate dashboard metrics
const fs = require('fs');
const path = require('path');

const callsPath = path.join(__dirname, '../data/calls.json');
const calls = JSON.parse(fs.readFileSync(callsPath, 'utf8'));

console.log(`Processing ${calls.length} calls...`);

// Limiting belief patterns
const LB_PATTERNS = {
  hedge: /\b(kind of|sort of|maybe|probably|I think|I guess|possibly)\b/gi,
  permission: /\b(does that make sense|make sense|is that okay|sound good)\b/gi,
  apologetic: /\b(sorry|apologize|my bad)\b/gi,
  valueUndermine: /\b(just|only|simple|basic|small)\b/gi,
  weakClose: /\b(if you want|up to you|no pressure|whenever you're ready)\b/gi,
  priceAnxiety: /\b(expensive|costly|lot of money|big investment)\b/gi,
  validation: /\b(right|you know what I mean|agree)\b/gi
};

// Process each call
const processed = calls.map(call => {
  const sentences = call.sentences || [];
  const aubtinText = sentences.filter(s => s.speaker_name?.toLowerCase().includes('aubtin')).map(s => s.text).join(' ');
  const prospectText = sentences.filter(s => !s.speaker_name?.toLowerCase().includes('aubtin')).map(s => s.text).join(' ');
  
  const totalWords = aubtinText.split(/\s+/).length + prospectText.split(/\s+/).length;
  const aubtinWords = aubtinText.split(/\s+/).length;
  
  // Talk ratio
  const talkRatio = totalWords > 0 ? Math.round((aubtinWords / totalWords) * 100) : 0;
  
  // Limiting beliefs count
  let lbCount = 0;
  const lbByCategory = {};
  for (const [cat, pattern] of Object.entries(LB_PATTERNS)) {
    const matches = aubtinText.match(pattern) || [];
    lbByCategory[cat] = matches.length;
    lbCount += matches.length;
  }
  
  // Deposit ask detection
  const depositAsked = /\b(deposit|down payment|\$5,?000|five thousand|payment today)\b/i.test(aubtinText);
  
  // Close ask detection
  const closeAsked = /\b(ready to get started|sign up today|move forward|close|commit)\b/i.test(aubtinText);
  
  // Calculate score (0-100)
  let score = 50; // baseline
  if (depositAsked) score += 15;
  if (closeAsked) score += 10;
  if (talkRatio >= 40 && talkRatio <= 60) score += 15;
  if (lbCount < 15) score += 10;
  if (lbCount > 30) score -= 20;
  if (talkRatio > 65) score -= 15;
  
  score = Math.max(0, Math.min(100, score));
  
  return {
    id: call.id,
    title: call.title,
    date: call.date,
    duration: call.duration,
    prospect: call.title.replace('Apex Early Adopter Call with Aubtin and ', '').replace(' and Kassidy Warren', ''),
    score,
    talkRatio,
    lbCount,
    lbByCategory,
    depositAsked,
    closeAsked,
    summary: call.summary?.overview || ''
  };
});

// Generate aggregated metrics
const metrics = {
  totalCalls: processed.length,
  avgScore: Math.round(processed.reduce((sum, c) => sum + c.score, 0) / processed.length * 10) / 10,
  avgTalkRatio: Math.round(processed.reduce((sum, c) => sum + c.talkRatio, 0) / processed.length * 10) / 10,
  avgLB: Math.round(processed.reduce((sum, c) => sum + c.lbCount, 0) / processed.length * 10) / 10,
  depositAskRate: Math.round((processed.filter(c => c.depositAsked).length / processed.length) * 1000) / 10,
  closeAskRate: Math.round((processed.filter(c => c.closeAsked).length / processed.length) * 1000) / 10,
  
  // Chart data
  chartDates: processed.map(c => new Date(c.date).toLocaleDateString('en-US', {month: '2-digit', day: '2-digit'})),
  chartScores: processed.map(c => c.score),
  chartLBs: processed.map(c => c.lbCount),
  chartTR: processed.map(c => c.talkRatio),
  chartProspects: processed.map(c => c.prospect),
  chartDep: processed.map(c => c.depositAsked ? 1 : 0),
  
  // LB category totals
  lbCategories: Object.keys(LB_PATTERNS).reduce((acc, cat) => {
    acc[cat] = processed.reduce((sum, c) => sum + (c.lbByCategory[cat] || 0), 0);
    return acc;
  }, {})
};

// Write processed data
fs.writeFileSync(path.join(__dirname, '../public/metrics.json'), JSON.stringify(metrics, null, 2));
fs.writeFileSync(path.join(__dirname, '../public/processed-calls.json'), JSON.stringify(processed, null, 2));

console.log(`✓ Processed ${processed.length} calls`);
console.log(`  Avg Score: ${metrics.avgScore}/100`);
console.log(`  Deposit Ask Rate: ${metrics.depositAskRate}%`);
console.log(`  Avg LBs: ${metrics.avgLB}/call`);
console.log(`  Avg Talk Ratio: ${metrics.avgTalkRatio}%`);
