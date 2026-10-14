const test = require('node:test');
const assert = require('node:assert');
const app = require('../app');
const db = require('../config/db');
const { initSchema } = require('../config/schema');
const { seedDatabase } = require('../config/seed');

let server;
let baseUrl;
let adminToken = '';
let analystToken = '';
let viewerToken = '';

test.before(async () => {
  await initSchema();
  await seedDatabase();

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api/v1`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await db.destroy();
});

test('GET /health returns status operational', async () => {
  const res = await fetch(`${baseUrl}/health`);
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.services.backend, 'healthy');
});

test('POST /auth/login logs in admin and returns token', async () => {
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@customerseg.com', password: 'Admin@123456' })
  });
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.ok(data.token);
  assert.strictEqual(data.user.role, 'admin');
  adminToken = data.token;
});

test('POST /auth/login logs in viewer user', async () => {
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'viewer@customerseg.com', password: 'Viewer@123456' })
  });
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.user.role, 'viewer');
  viewerToken = data.token;
});

test('POST /auth/login with wrong password fails with 401', async () => {
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@customerseg.com', password: 'WrongPassword' })
  });
  assert.strictEqual(res.status, 401);
});

test('GET /dashboard/summary returns computed KPIs from active dataset', async () => {
  const res = await fetch(`${baseUrl}/dashboard/summary`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.totalCustomers, 250);
  assert.ok(data.numberOfSegments >= 1);
  assert.ok(data.highValueCustomers > 0);
  assert.ok(data.activeCustomers > 0);
});

test('GET /customers lists customers with pagination and segment assignments', async () => {
  const res = await fetch(`${baseUrl}/customers?page=1&limit=10`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.customers.length, 10);
  assert.strictEqual(data.pagination.total, 250);
  assert.ok(data.customers[0].customer_id_code);
});

test('GET /customers/export downloads CSV content', async () => {
  const res = await fetch(`${baseUrl}/customers/export`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert.strictEqual(res.status, 200);
  const csvText = await res.text();
  assert.ok(csvText.includes('customer_id_code'));
  assert.ok(csvText.includes('CUST-1000'));
});

test('Viewer role cannot delete dataset (RBAC Forbidden 403)', async () => {
  const res = await fetch(`${baseUrl}/datasets/999`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${viewerToken}` }
  });
  assert.strictEqual(res.status, 403);
});

test('GET /admin/users is restricted to admin role', async () => {
  // Should fail for viewer
  const resViewer = await fetch(`${baseUrl}/admin/users`, {
    headers: { 'Authorization': `Bearer ${viewerToken}` }
  });
  assert.strictEqual(resViewer.status, 403);

  // Should succeed for admin
  const resAdmin = await fetch(`${baseUrl}/admin/users`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert.strictEqual(resAdmin.status, 200);
  const data = await resAdmin.json();
  assert.ok(data.users.length >= 3);
});

test('GET /campaigns lists campaign drafts', async () => {
  const res = await fetch(`${baseUrl}/campaigns`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.campaigns));
  assert.ok(data.campaigns.length >= 1);
});
