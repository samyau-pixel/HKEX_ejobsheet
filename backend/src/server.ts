import dotenv from 'dotenv';
import app from './app.js';
import { initializeDatabase } from './db/schema.js';
import { seedDatabase } from './db/seed.js';

dotenv.config();

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || 'localhost';

const startServer = async (): Promise<void> => {
  try {
    console.log('[INFO] Initializing database...');
    await initializeDatabase();
    console.log('[OK] Database schema initialized');

    console.log('[INFO] Seeding database with test data...');
    await seedDatabase();
    console.log('[OK] Database seeded');

    app.listen(Number(PORT), HOST, () => {
      console.log(`[OK] Server listening on http://${HOST}:${PORT}`);
      console.log(`[INFO] API available at http://${HOST}:${PORT}/api`);
      console.log(`[INFO] Health check: http://${HOST}:${PORT}/health`);
    });
  } catch (error) {
    console.error('[ERROR] Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
