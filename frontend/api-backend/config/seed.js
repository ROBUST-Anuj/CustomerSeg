const db = require('./db');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

async function seedDatabase() {
  // 1. Seed users if empty
  const userCount = await db('users').count('id as count').first();
  if (Number(userCount.count) === 0) {
    const salt = await bcrypt.genSalt(10);
    const adminHash = await bcrypt.hash('Admin@123456', salt);
    const analystHash = await bcrypt.hash('Analyst@123456', salt);
    const viewerHash = await bcrypt.hash('Viewer@123456', salt);

    await db('users').insert([
      {
        name: 'Avani Gupta (Admin)',
        email: 'admin@customerseg.com',
        password_hash: adminHash,
        role: 'admin'
      },
      {
        name: 'Arpita Bhatia (Guide / Lead Analyst)',
        email: 'analyst@customerseg.com',
        password_hash: analystHash,
        role: 'analyst'
      },
      {
        name: 'Guest Evaluator (Viewer)',
        email: 'viewer@customerseg.com',
        password_hash: viewerHash,
        role: 'viewer'
      }
    ]);
    console.log('[Seed] Default users created.');
  }

  // 2. Check if sample dataset exists
  const datasetCount = await db('datasets').count('id as count').first();
  if (Number(datasetCount.count) === 0) {
    const sampleCsvPath = path.resolve(__dirname, '../../../sample-data/Ecommerce_Customer_Segments.csv');
    if (fs.existsSync(sampleCsvPath)) {
      const adminUser = await db('users').where({ email: 'admin@customerseg.com' }).first();
      const records = [];

      await new Promise((resolve, reject) => {
        fs.createReadStream(sampleCsvPath)
          .pipe(csv())
          .on('data', (row) => records.push(row))
          .on('end', resolve)
          .on('error', reject);
      });

      if (records.length > 0) {
        const columns = Object.keys(records[0]);
        const [datasetId] = await db('datasets').insert({
          user_id: adminUser ? adminUser.id : 1,
          name: 'E-Commerce Benchmark Dataset (Sample)',
          original_filename: 'Ecommerce_Customer_Segments.csv',
          row_count: records.length,
          col_count: columns.length,
          columns_json: JSON.stringify(columns),
          file_path: sampleCsvPath,
          status: 'ready',
          is_sample: true
        });

        const customerRows = records.map((r) => ({
          dataset_id: datasetId,
          customer_id_code: r.CustomerID || '',
          name: r.CustomerName || '',
          email: r.Email || '',
          age: parseInt(r.Age, 10) || null,
          gender: r.Gender || 'Other',
          annual_income: parseFloat(r.AnnualIncome) || 0,
          spending_score: parseFloat(r.SpendingScore) || 0,
          total_spend: parseFloat(r.TotalSpend) || 0,
          purchase_frequency: parseInt(r.PurchaseFrequency, 10) || 0,
          recency_days: parseInt(r.RecencyDays, 10) || 0,
          raw_data_json: JSON.stringify(r)
        }));

        // Batch insert customers
        const chunkSize = 50;
        for (let i = 0; i < customerRows.length; i += chunkSize) {
          await db('customers').insert(customerRows.slice(i, i + chunkSize));
        }

        console.log(`[Seed] Seeded dataset #${datasetId} with ${customerRows.length} customers.`);

        // Insert initial baseline segmentation run
        const profiles = [
          {
            segment_id: 0,
            name: "Segment 1: Conservative Affluents",
            description: "High purchasing capacity with lower discretionary spend score. Substantial untapped lifetime value.",
            count: 52,
            percentage: 20.8,
            feature_means: { AnnualIncome: 88.4, SpendingScore: 21.2, TotalSpend: 980.5 },
            feature_medians: { AnnualIncome: 88.0, SpendingScore: 20.0, TotalSpend: 960.0 },
            recommended_strategy: "Value-focused marketing highlighting product craftsmanship, guarantees, and premium upgrades.",
            key_characteristics: ["High Annual Income", "Lower Spending Score", "Moderate Purchase Frequency"]
          },
          {
            segment_id: 1,
            name: "Segment 2: Affluent High-Spenders",
            description: "Elite tier customers with high income and frequent, large purchases. Core revenue drivers.",
            count: 65,
            percentage: 26.0,
            feature_means: { AnnualIncome: 91.8, SpendingScore: 81.6, TotalSpend: 3450.2 },
            feature_medians: { AnnualIncome: 92.0, SpendingScore: 82.0, TotalSpend: 3420.0 },
            recommended_strategy: "VIP loyalty rewards, personalized concierge service, early access to new lines.",
            key_characteristics: ["High Income", "High Spending Score", "High Purchase Frequency", "Recent Orders"]
          },
          {
            segment_id: 2,
            name: "Segment 3: Budget-Conscious Customers",
            description: "Careful shoppers with lower income who prioritize essential and discounted purchases.",
            count: 51,
            percentage: 20.4,
            feature_means: { AnnualIncome: 27.5, SpendingScore: 21.8, TotalSpend: 340.1 },
            feature_medians: { AnnualIncome: 28.0, SpendingScore: 22.0, TotalSpend: 330.0 },
            recommended_strategy: "Discount vouchers, bundled essentials, and clearance alerts.",
            key_characteristics: ["Modest Income", "Low Spending Score", "Infrequent Orders"]
          },
          {
            segment_id: 3,
            name: "Segment 4: Enthusiastic Trendsetters",
            description: "Younger demographic with lower income but very high spending and engagement scores.",
            count: 38,
            percentage: 15.2,
            feature_means: { AnnualIncome: 26.2, SpendingScore: 78.4, TotalSpend: 1020.8 },
            feature_medians: { AnnualIncome: 26.0, SpendingScore: 78.0, TotalSpend: 1010.0 },
            recommended_strategy: "Social media drops, flash sales, installment payment options (BNPL).",
            key_characteristics: ["Modest Income", "Very High Spending Score", "High Engagement"]
          },
          {
            segment_id: 4,
            name: "Segment 5: Balanced Middle-Market",
            description: "Stable customer base with average income and steady purchase frequency.",
            count: 44,
            percentage: 17.6,
            feature_means: { AnnualIncome: 55.3, SpendingScore: 50.1, TotalSpend: 1320.0 },
            feature_medians: { AnnualIncome: 55.0, SpendingScore: 50.0, TotalSpend: 1310.0 },
            recommended_strategy: "Cross-sell related categories, referral bonuses, seasonal catalog mailers.",
            key_characteristics: ["Average Income", "Average Spending Score", "Steady Purchase Cadence"]
          }
        ];

        const [runId] = await db('segmentation_runs').insert({
          dataset_id: datasetId,
          user_id: adminUser ? adminUser.id : 1,
          run_name: 'Baseline K-Means (k=5) Segmentation',
          algorithm: 'kmeans',
          n_clusters: 5,
          features_json: JSON.stringify(['AnnualIncome', 'SpendingScore']),
          scaler: 'standard',
          silhouette_score: 0.5482,
          davies_bouldin_index: 0.6841,
          calinski_harabasz_score: 342.15,
          profiles_json: JSON.stringify(profiles),
          dt_rules_json: JSON.stringify([
            "|--- AnnualIncome <= 40.50",
            "|   |--- SpendingScore <= 45.00: Segment 3 [Budget-Conscious]",
            "|   |--- SpendingScore > 45.00: Segment 4 [Trendsetters]",
            "|--- AnnualIncome > 40.50",
            "|   |--- AnnualIncome <= 72.00: Segment 5 [Balanced Middle-Market]",
            "|   |--- AnnualIncome > 72.00",
            "|   |   |--- SpendingScore <= 45.00: Segment 1 [Conservative Affluents]",
            "|   |   |--- SpendingScore > 45.00: Segment 2 [Affluent High-Spenders]"
          ]),
          status: 'completed'
        });

        // Insert assignments for customers
        const dbCustomers = await db('customers').where({ dataset_id: datasetId });
        const assignments = [];
        for (const cust of dbCustomers) {
          const inc = cust.annual_income;
          const sp = cust.spending_score;
          let segId = 4;
          let segName = "Segment 5: Balanced Middle-Market";

          if (inc <= 40.5) {
            if (sp <= 45) {
              segId = 2;
              segName = "Segment 3: Budget-Conscious Customers";
            } else {
              segId = 3;
              segName = "Segment 4: Enthusiastic Trendsetters";
            }
          } else if (inc > 72) {
            if (sp <= 45) {
              segId = 0;
              segName = "Segment 1: Conservative Affluents";
            } else {
              segId = 1;
              segName = "Segment 2: Affluent High-Spenders";
            }
          }

          // PCA approx
          const normInc = (inc - 55) / 25;
          const normSp = (sp - 50) / 25;

          assignments.push({
            run_id: runId,
            customer_id_code: cust.customer_id_code,
            segment_id: segId,
            segment_name: segName,
            pca_x: parseFloat((normInc * 0.707 - normSp * 0.707).toFixed(3)),
            pca_y: parseFloat((normInc * 0.707 + normSp * 0.707).toFixed(3)),
            distance_to_center: 0.42
          });
        }

        for (let i = 0; i < assignments.length; i += chunkSize) {
          await db('customer_segment_assignments').insert(assignments.slice(i, i + chunkSize));
        }

        // Add sample campaign drafts
        await db('campaign_drafts').insert([
          {
            user_id: adminUser ? adminUser.id : 1,
            dataset_id: datasetId,
            name: 'VIP Fall Preview & Concierge Access',
            objective: 'Drive luxury line pre-orders among highest lifetime value shoppers',
            segment_id: 1,
            segment_name: 'Segment 2: Affluent High-Spenders',
            channel: 'email',
            subject: 'Exclusive Invitation: Private VIP Autumn Showcase',
            message_template: 'Dear {{CustomerName}},\n\nAs one of our most valued patrons, we are delighted to offer you private early access to our Autumn Showcase. Enjoy complimentary concierge consultation and priority fulfillment on all orders.\n\nWarm regards,\nThe CustomerSeg Team',
            audience_count: 65,
            status: 'draft'
          },
          {
            user_id: adminUser ? adminUser.id : 1,
            dataset_id: datasetId,
            name: 'Flash Weekend Trendsetters Perks',
            objective: 'Boost weekend mobile conversion with high-spending younger shoppers',
            segment_id: 3,
            segment_name: 'Segment 4: Enthusiastic Trendsetters',
            channel: 'sms',
            subject: '⚡ Weekend Flash Perks Just for You',
            message_template: 'Hey {{CustomerName}}! Get 20% off all trending apparel this weekend with code TREND20. Limited quantities available!',
            audience_count: 38,
            status: 'draft'
          }
        ]);

        console.log(`[Seed] Seeded baseline segmentation run #${runId} and sample marketing campaigns.`);
      }
    }
  }
}

module.exports = { seedDatabase };
