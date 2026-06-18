console.log('[DEBUG] starting debug-import');

process.on('uncaughtException', (err) => {
  try {
    const util = require('util');
    console.error('[uncaughtException]', util.inspect(err, { showHidden: true, depth: null }));
  } catch (e) {
    console.error('[uncaughtException]', err);
  }
  if (err && err.stack) console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  try {
    const util = require('util');
    console.error('[unhandledRejection]', util.inspect(reason, { showHidden: true, depth: null }));
  } catch (e) {
    console.error('[unhandledRejection]', reason);
  }
  if (reason && (reason as any).stack) console.error((reason as any).stack);
});

(async () => {
  try {
    console.log('[DEBUG] importing server');
    await import('./server');
  } catch (e) {
    try {
      const util = require('util');
      console.error('[SERVER_IMPORT_FAILED]', util.inspect(e, { showHidden: true, depth: null }));
    } catch (ie) {
      console.error('[SERVER_IMPORT_FAILED]', e);
    }
    if (e && (e as any).stack) console.error((e as any).stack);
    process.exit(1);
  }
})();
