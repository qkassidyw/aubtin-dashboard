// Script to inject API fetch into index.html
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Find where the hardcoded data starts (line with "const MODAL_DATA")
const dataStart = html.indexOf('const MODAL_DATA');
const dataEnd = html.indexOf('function showTab(id)');

if (dataStart === -1 || dataEnd === -1) {
  console.error('Could not find data section');
  process.exit(1);
}

// Replace hardcoded data with API fetch
const apiCode = `
// Fetch data from API
let MODAL_DATA = {}, CHART_DATES = [], CHART_SCORES = [], CHART_TREND = [];
let CHART_LBS = [], CHART_TR = [], CHART_PROSPECTS = [], CHART_DEP = [];
let CHART_ICP = [], SCORE_DIST = [], CAT_LABELS = [], CAT_VALUES = [];
let OUTCOME_LABELS = [], OUTCOME_VALUES = [], ICP_SCORES = [], ICP_CALL_SCORES = [];
let TR_DIST = [], TR_BAR_COLORS = [];

async function loadData() {
  try {
    const res = await fetch('/api/calls');
    const data = await res.json();
    console.log('Loaded calls:', data.calls.length);
    
    // Process calls and populate chart data
    // TODO: Add processing logic here
    
  } catch (err) {
    console.error('Failed to load calls:', err);
    // Fall back to empty data
  }
}

loadData().then(() => {
  showTab('overview');
});

`;

const updated = html.slice(0, dataStart) + apiCode + html.slice(dataEnd);
fs.writeFileSync('index.html', updated);
console.log('✓ Updated index.html with API fetch');
