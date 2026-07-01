import { up } from './src/db/migrations/003-add-leader-review-columns.js';

console.log('Running leader review migration...');

up()
  .then(() => {
    console.log('Migration completed successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
