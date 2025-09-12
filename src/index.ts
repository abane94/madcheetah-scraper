import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import apiApp from './api.ts'
import { cleanupOldSearchRuns, cleanupExpiredLots } from './utils/cleanup.ts'
import { checkAndRunDailySearches } from './utils/daily-search-runner.ts'
import webRoutes from './routes/web-routes.tsx'

startup();

const app = new Hono()

// Mount web routes
app.route('/', webRoutes);

// Mount API routes
app.route('/', apiApp);

const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Only start the server if this module is run directly (not through Vite)
console.log(`import.meta.url: ${import.meta.url}`);
console.log(`env.VITE: ${process.env.VITE}`);
if (process.env.NODE_ENV !== 'production') {
  console.log('Running serve');
  serve({
    fetch: app.fetch,
    port: port,
    hostname: hostname
  }, (info) => {
    console.log(`Server is running on http://${hostname}:${info.port}`)
  })
}

export default app

async function startup() {

  // Clean up old search runs on startup
  await cleanupOldSearchRuns();

  // Clean up expired lots on startup
  await cleanupExpiredLots();

  // Run daily searches check on startup
  await checkAndRunDailySearches();
}
