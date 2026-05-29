const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  try {
    const metricsPath = path.join(process.cwd(), 'data', 'metrics.json');
    const metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
    res.status(200).json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load metrics' });
  }
};
