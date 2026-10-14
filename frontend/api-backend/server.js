const app = require('./app');
const { initSchema } = require('./config/schema');
const { seedDatabase } = require('./config/seed');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    console.log('[Server] Initializing database schema...');
    await initSchema();
    console.log('[Server] Checking and seeding database records...');
    await seedDatabase();

    const server = app.listen(PORT, () => {
      console.log(`[Server] CustomerSeg Node.js API running on http://127.0.0.1:${PORT}`);
      console.log(`[Server] REST endpoints available under http://127.0.0.1:${PORT}/api/v1`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('[Server] SIGTERM received. Closing HTTP server gracefully.');
      server.close(() => process.exit(0));
    });
    process.on('SIGINT', () => {
      console.log('[Server] SIGINT received. Closing HTTP server gracefully.');
      server.close(() => process.exit(0));
    });
  } catch (err) {
    console.error('[Server] Fatal startup failure:', err);
    process.exit(1);
  }
}

startServer();
