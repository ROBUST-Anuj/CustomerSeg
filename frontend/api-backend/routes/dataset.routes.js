const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const db = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Setup multer storage
const uploadDir = process.env.VERCEL
  ? path.join('/tmp', 'uploads')
  : path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.csv') || file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files (.csv) are allowed.'));
    }
  }
});

// Helper: parse CSV file into records
function parseCsvFile(filePath) {
  return new Promise((resolve, reject) => {
    const records = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => records.push(row))
      .on('end', () => resolve(records))
      .on('error', (err) => reject(err));
  });
}

// 1. Get all datasets
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const datasets = await db('datasets')
      .leftJoin('users', 'datasets.user_id', 'users.id')
      .select(
        'datasets.*',
        'users.name as uploaded_by_name',
        'users.email as uploaded_by_email'
      )
      .orderBy('datasets.created_at', 'desc');

    const formatted = datasets.map((d) => ({
      ...d,
      columns: d.columns_json ? JSON.parse(d.columns_json) : []
    }));

    res.json({ datasets: formatted });
  } catch (err) {
    next(err);
  }
});

// 2. Get single dataset details
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const dataset = await db('datasets').where({ id: req.params.id }).first();
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found.' });
    }

    const runs = await db('segmentation_runs')
      .where({ dataset_id: dataset.id })
      .orderBy('created_at', 'desc');

    const previewCustomers = await db('customers')
      .where({ dataset_id: dataset.id })
      .limit(10);

    res.json({
      dataset: {
        ...dataset,
        columns: dataset.columns_json ? JSON.parse(dataset.columns_json) : []
      },
      runs,
      preview: previewCustomers
    });
  } catch (err) {
    next(err);
  }
});

// 3. Upload and ingest CSV dataset
router.post('/upload', authenticateToken, requireRole(['admin', 'analyst']), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'CSV file is required.' });
    }

    const filePath = req.file.path;
    const originalName = req.file.originalname;
    const customName = req.body.name || originalName.replace('.csv', '');

    const records = await parseCsvFile(filePath);
    if (!records || records.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'The uploaded CSV file is empty.' });
    }

    const columns = Object.keys(records[0]);
    if (columns.length < 2) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'The dataset must contain at least 2 columns.' });
    }

    // Inspect columns for mapping
    const lowerCols = {};
    columns.forEach(col => lowerCols[col.toLowerCase().replace(/[^a-z0-9]/g, '')] = col);

    const idCol = columns.find(c => /^(customerid|cust_id|id|client_id)$/i.test(c)) || columns[0];
    const nameCol = columns.find(c => /^(name|customername|full_name)$/i.test(c));
    const emailCol = columns.find(c => /^(email|email_address)$/i.test(c));
    const ageCol = columns.find(c => /^(age)$/i.test(c));
    const genderCol = columns.find(c => /^(gender|sex)$/i.test(c));
    const incomeCol = columns.find(c => /(income|salary|annual)/i.test(c));
    const scoreCol = columns.find(c => /(spending|score|spend_score)/i.test(c));
    const totalSpendCol = columns.find(c => /(totalspend|total_spending|spend|monetary)/i.test(c));
    const freqCol = columns.find(c => /(frequency|purchases|orders)/i.test(c));
    const recencyCol = columns.find(c => /(recency|days_since|last_purchase)/i.test(c));

    const [datasetId] = await db('datasets').insert({
      user_id: req.user.id,
      name: customName,
      original_filename: originalName,
      row_count: records.length,
      col_count: columns.length,
      columns_json: JSON.stringify(columns),
      file_path: filePath,
      status: 'ready',
      is_sample: false
    });

    const customerRows = records.map((r, idx) => ({
      dataset_id: datasetId,
      customer_id_code: r[idCol] || `CUST-${1000 + idx}`,
      name: nameCol ? r[nameCol] : null,
      email: emailCol ? r[emailCol] : null,
      age: ageCol ? parseInt(r[ageCol], 10) || null : null,
      gender: genderCol ? r[genderCol] : null,
      annual_income: incomeCol ? parseFloat(r[incomeCol]) || null : null,
      spending_score: scoreCol ? parseFloat(r[scoreCol]) || null : null,
      total_spend: totalSpendCol ? parseFloat(r[totalSpendCol]) || null : null,
      purchase_frequency: freqCol ? parseInt(r[freqCol], 10) || null : null,
      recency_days: recencyCol ? parseInt(r[recencyCol], 10) || null : null,
      raw_data_json: JSON.stringify(r)
    }));

    // Batch insert in chunks of 50
    const chunkSize = 50;
    for (let i = 0; i < customerRows.length; i += chunkSize) {
      await db('customers').insert(customerRows.slice(i, i + chunkSize));
    }

    res.status(201).json({
      message: 'Dataset uploaded and processed successfully.',
      dataset: {
        id: datasetId,
        name: customName,
        row_count: records.length,
        col_count: columns.length,
        columns,
        detected_fields: {
          idCol, nameCol, emailCol, ageCol, genderCol, incomeCol, scoreCol, totalSpendCol, freqCol, recencyCol
        }
      }
    });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(err);
  }
});

// 4. Load benchmark sample dataset on demand
router.post('/load-sample', authenticateToken, async (req, res, next) => {
  try {
    const samplePath = path.resolve(__dirname, '../../../sample-data/Mall_Customers.csv');
    if (!fs.existsSync(samplePath)) {
      return res.status(404).json({ error: 'Sample dataset file not found on disk.' });
    }

    const records = await parseCsvFile(samplePath);
    const columns = Object.keys(records[0]);

    const [datasetId] = await db('datasets').insert({
      user_id: req.user.id,
      name: 'Classic Mall Customers Benchmark (Sample)',
      original_filename: 'Mall_Customers.csv',
      row_count: records.length,
      col_count: columns.length,
      columns_json: JSON.stringify(columns),
      file_path: samplePath,
      status: 'ready',
      is_sample: true
    });

    const customerRows = records.map((r, idx) => ({
      dataset_id: datasetId,
      customer_id_code: r.CustomerID || `CUST-${idx + 1}`,
      name: `Customer ${idx + 1}`,
      age: parseInt(r.Age, 10) || null,
      gender: r.Gender || 'Other',
      annual_income: parseFloat(r['Annual Income (k$)']) || 0,
      spending_score: parseFloat(r['Spending Score (1-100)']) || 0,
      raw_data_json: JSON.stringify(r)
    }));

    const chunkSize = 50;
    for (let i = 0; i < customerRows.length; i += chunkSize) {
      await db('customers').insert(customerRows.slice(i, i + chunkSize));
    }

    res.status(201).json({
      message: 'Sample benchmark dataset loaded successfully.',
      dataset_id: datasetId,
      rows: records.length
    });
  } catch (err) {
    next(err);
  }
});

// 5. Delete dataset
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res, next) => {
  try {
    const dataset = await db('datasets').where({ id: req.params.id }).first();
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found.' });
    }

    await db('datasets').where({ id: req.params.id }).del();

    res.json({ message: 'Dataset and all associated records deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
