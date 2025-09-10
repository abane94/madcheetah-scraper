import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { readLots } from './api.ts'
import { main } from './web-scraper/main.ts'
import apiApp from './api.ts'
import { cleanupOldSearchRuns, cleanupExpiredLots } from './utils/cleanup.ts'
import { checkAndRunDailySearches } from './utils/daily-search-runner.ts'
import webRoutes from './routes/web-routes.tsx'

startup();

// let lots = readLots();
// if (!lots || lots.length < 1) {
//   await main()
//   lots = readLots();
// }

const app = new Hono()

// Mount web routes
app.route('/', webRoutes);

// Mount API routes
app.route('/', apiApp);

const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

serve({
  fetch: app.fetch,
  port: port,
  hostname: hostname
}, (info) => {
  console.log(`Server is running on http://${hostname}:${info.port}`)
})

async function startup() {
  // Clean up old search runs on startup
  await cleanupOldSearchRuns();

  // Clean up expired lots on startup
  await cleanupExpiredLots();

  // Run daily searches check on startup
  await checkAndRunDailySearches();
}
