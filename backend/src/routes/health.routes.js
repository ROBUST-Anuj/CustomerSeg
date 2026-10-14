const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../config/db');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8001';

router.get('/health', async (req, res) => {
  let dbStatus = 'ok';
  try {
    await db.raw('SELECT 1');
  } catch (err) {
    dbStatus = `error: ${err.message}`;
  }

  let mlStatus = 'unknown';
  try {
    const mlRes = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 3000 });
    mlStatus = mlRes.data.status === 'healthy' ? 'healthy' : 'degraded';
  } catch (err) {
    mlStatus = `unreachable (${err.message})`;
  }

  const overall = dbStatus === 'ok' && mlStatus === 'healthy' ? 'operational' : 'degraded';

  res.json({
    status: overall,
    timestamp: new Date().toISOString(),
    services: {
      backend: 'healthy',
      database: dbStatus,
      mlService: mlStatus
    }
  });
});

router.get('/info', (req, res) => {
  res.json({
    project: 'CustomerSeg - AI-Powered Customer Segmentation & Management System',
    institution: 'IPS Academy, Institute of Engineering and Science, Indore',
    department: 'Department of Computer Science and Engineering',
    academicYear: '2026–27',
    guide: 'Ms. Arpita Bhatia',
    presentedBy: 'Avani Gupta',
    version: '1.0.0',
    techStack: {
      frontend: 'React + Vite + Tailwind CSS + Recharts + Lucide',
      backend: 'Node.js + Express + Knex + JWT',
      database: 'MySQL (with local SQLite developer mode)',
      ml: 'Python FastAPI + Scikit-Learn (K-Means, PCA, Silhouette, Decision Tree)'
    },
    references: [
      { name: 'React', url: 'https://react.dev/' },
      { name: 'Node.js', url: 'https://nodejs.org/' },
      { name: 'Express', url: 'https://expressjs.com/' },
      { name: 'MySQL', url: 'https://dev.mysql.com/doc/' },
      { name: 'Scikit-learn', url: 'https://scikit-learn.org/' },
      { name: 'TensorFlow', url: 'https://www.tensorflow.org/' },
      { name: 'Harvard Business Review', topic: 'Customer Analytics & Segmentation Frameworks' },
      { name: 'McKinsey & Company', topic: 'Modern Marketing & Personalization Insights' }
    ]
  });
});

module.exports = router;
