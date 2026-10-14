const db = require('./db');

async function initSchema() {
  const hasUsers = await db.schema.hasTable('users');
  if (!hasUsers) {
    await db.schema.createTable('users', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('email').unique().notNullable();
      table.string('password_hash').notNullable();
      table.string('role').defaultTo('analyst'); // admin, analyst, viewer
      table.timestamps(true, true);
    });
    console.log('[Schema] Created users table');
  }

  const hasDatasets = await db.schema.hasTable('datasets');
  if (!hasDatasets) {
    await db.schema.createTable('datasets', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.string('name').notNullable();
      table.string('original_filename').notNullable();
      table.integer('row_count').defaultTo(0);
      table.integer('col_count').defaultTo(0);
      table.text('columns_json'); // list of detected columns & sample types
      table.string('file_path');
      table.string('status').defaultTo('ready'); // ready, processing, error
      table.boolean('is_sample').defaultTo(false);
      table.timestamps(true, true);
    });
    console.log('[Schema] Created datasets table');
  }

  const hasCustomers = await db.schema.hasTable('customers');
  if (!hasCustomers) {
    await db.schema.createTable('customers', (table) => {
      table.increments('id').primary();
      table.integer('dataset_id').unsigned().references('id').inTable('datasets').onDelete('CASCADE');
      table.string('customer_id_code').index();
      table.string('name');
      table.string('email');
      table.integer('age');
      table.string('gender');
      table.float('annual_income');
      table.float('spending_score');
      table.float('total_spend');
      table.integer('purchase_frequency');
      table.integer('recency_days');
      table.text('raw_data_json');
      table.timestamps(true, true);
    });
    console.log('[Schema] Created customers table');
  }

  const hasRuns = await db.schema.hasTable('segmentation_runs');
  if (!hasRuns) {
    await db.schema.createTable('segmentation_runs', (table) => {
      table.increments('id').primary();
      table.integer('dataset_id').unsigned().references('id').inTable('datasets').onDelete('CASCADE');
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.string('run_name').notNullable();
      table.string('algorithm').defaultTo('kmeans');
      table.integer('n_clusters').notNullable();
      table.text('features_json').notNullable();
      table.string('scaler').defaultTo('standard');
      table.float('silhouette_score');
      table.float('davies_bouldin_index');
      table.float('calinski_harabasz_score');
      table.text('profiles_json');
      table.text('dt_rules_json');
      table.string('status').defaultTo('completed');
      table.timestamps(true, true);
    });
    console.log('[Schema] Created segmentation_runs table');
  }

  const hasAssignments = await db.schema.hasTable('customer_segment_assignments');
  if (!hasAssignments) {
    await db.schema.createTable('customer_segment_assignments', (table) => {
      table.increments('id').primary();
      table.integer('run_id').unsigned().references('id').inTable('segmentation_runs').onDelete('CASCADE');
      table.string('customer_id_code').index();
      table.integer('segment_id').notNullable();
      table.string('segment_name').notNullable();
      table.float('pca_x');
      table.float('pca_y');
      table.float('distance_to_center');
      table.timestamps(true, true);
    });
    console.log('[Schema] Created customer_segment_assignments table');
  }

  const hasCampaigns = await db.schema.hasTable('campaign_drafts');
  if (!hasCampaigns) {
    await db.schema.createTable('campaign_drafts', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.integer('dataset_id').unsigned().references('id').inTable('datasets').onDelete('CASCADE');
      table.string('name').notNullable();
      table.string('objective');
      table.integer('segment_id');
      table.string('segment_name');
      table.string('channel').defaultTo('email'); // email, sms, in_app, push
      table.string('subject');
      table.text('message_template');
      table.integer('audience_count').defaultTo(0);
      table.string('status').defaultTo('draft'); // draft, scheduled, archived
      table.timestamps(true, true);
    });
    console.log('[Schema] Created campaign_drafts table');
  }

  const hasAudit = await db.schema.hasTable('audit_events');
  if (!hasAudit) {
    await db.schema.createTable('audit_events', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.string('action').notNullable();
      table.text('details_json');
      table.timestamps(true, true);
    });
    console.log('[Schema] Created audit_events table');
  }
}

module.exports = { initSchema };
