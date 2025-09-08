import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import fs from 'fs/promises'
import path from 'path'
// import type { Lot } from './shared/types.js';
import { LotsHomePage } from './templates/home.tsx';
import { readLots, readSearches, addSearch, getUniqueLocations } from './api.ts';
import { main } from './web-scraper/main.ts';
import { LotDetailPage } from'./templates/detail.tsx'
import { SearchFormPage } from './templates/search-form.tsx';
import apiApp from './api.ts';
import { Scraper } from './web-scraper/scrapers/scraper.ts';
import type { SearchRuns, Search, Lot } from './shared/types.ts';
import { TERM_DELIMITER } from './shared/types.ts';
import type { ScrapeResult } from './web-scraper/scrapers/scraper.ts';
import { db } from './shared/db.ts';

const SEARCH_RUNS_COLLECTION = 'searchRuns';
const SEARCH_RUNS_RETENTION_DAYS = 7;

async function cleanupOldSearchRuns() {
    console.log('Checking for old search runs to clean up...');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - SEARCH_RUNS_RETENTION_DAYS);
    const cutoffDateString = cutoffDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    const allSearchRuns = db.findAll<SearchRuns>(SEARCH_RUNS_COLLECTION);
    const oldSearchRuns = allSearchRuns.filter(run => run.date < cutoffDateString);

    if (oldSearchRuns.length === 0) {
        console.log('No old search runs found');
        return;
    }

    console.log(`Found ${oldSearchRuns.length} search runs older than ${SEARCH_RUNS_RETENTION_DAYS} days to clean up`);

    // Delete old search runs
    for (const searchRun of oldSearchRuns) {
        try {
            db.deleteById(SEARCH_RUNS_COLLECTION, searchRun.id);
            console.log(`Deleted search run from ${searchRun.date} (ID: ${searchRun.id})`);
        } catch (error) {
            console.warn(`Failed to delete search run ${searchRun.id}:`, error);
        }
    }

    console.log(`Cleaned up ${oldSearchRuns.length} old search runs`);
}

// Clean up old search runs on startup
await cleanupOldSearchRuns();

async function cleanupExpiredLots() {
    console.log('Checking for expired lots to clean up...');

    const lots = readLots();
    const now = new Date();
    const expiredLots: Lot[] = [];
    const activeLots: Lot[] = [];

    // Separate expired and active lots
    lots.forEach(lot => {
        const lotEndTime = new Date(lot.timestamp);
        if (lotEndTime < now) {
            expiredLots.push(lot);
        } else {
            activeLots.push(lot);
        }
    });

    if (expiredLots.length === 0) {
        console.log('No expired lots found');
    } else {
        console.log(`Found ${expiredLots.length} expired lots to clean up`);
    }

    // Delete images for expired lots
    for (const lot of expiredLots) {
        if (lot.imageFilenames && lot.imageFilenames.length > 0) {
            for (const imagePath of lot.imageFilenames) {
                try {
                    const fullImagePath = path.resolve(imagePath);
                    await fs.unlink(fullImagePath);
                    console.log(`Deleted image: ${imagePath}`);
                } catch (error) {
                    console.warn(`Failed to delete image ${imagePath}:`, error);
                }
            }
        }
    }

    // Check for orphan images
    console.log('Checking for orphan images...');
    const imagesDir = path.resolve('images');

    try {
        const imageFiles = await fs.readdir(imagesDir);
        const activeLotIds = new Set(activeLots.map(lot => lot.lotId));
        const orphanImages: string[] = [];

        for (const filename of imageFiles) {
            // Check if image follows the naming pattern: lot_${lotId}_image_${number}.jpg
            const match = filename.match(/^lot_(.+)_image_\d+\.jpg$/);
            if (match) {
                const lotId = match[1];
                if (!activeLotIds.has(lotId)) {
                    orphanImages.push(filename);
                }
            }
        }

        if (orphanImages.length > 0) {
            console.log(`Found ${orphanImages.length} orphan images to delete`);
            for (const filename of orphanImages) {
                try {
                    await fs.unlink(path.join(imagesDir, filename));
                    console.log(`Deleted orphan image: ${filename}`);
                } catch (error) {
                    console.warn(`Failed to delete orphan image ${filename}:`, error);
                }
            }
        } else {
            console.log('No orphan images found');
        }
    } catch (error) {
        console.warn('Failed to check for orphan images:', error);
    }

    // Update lots file with only active lots
    if (expiredLots.length > 0) {
        const { writeLots } = await import('./api.ts');
        writeLots(activeLots);
        console.log(`Cleaned up ${expiredLots.length} expired lots and their images`);
    }

    console.log('Lot cleanup completed');
}

// Clean up expired lots on startup
await cleanupExpiredLots();

async function checkAndRunDailySearches() {
    console.log('Checking if daily searches need to be run...');

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const searches = readSearches();

    if (searches.length === 0) {
        console.log('No searches configured, skipping daily run');
        return;
    }

    const scraper = new Scraper();
    const existingLots = readLots();
    const existingData: Record<string, Lot> = {};

    // Convert existing lots array to lookup object
    existingLots.forEach(lot => {
        existingData[lot.lotId] = lot;
    });

    // Check and run each search individually
    for (const search of searches) {
        // Check if this specific search has been run today
        const todaysRunForSearch = db.findAll<SearchRuns>(SEARCH_RUNS_COLLECTION)
            .find(run => run.date === today && run.searchId === search.id);

        if (todaysRunForSearch) {
            console.log(`Search "${search.query}" already run today:`, today);
            continue;
        }

        console.log(`Running scraper for search: ${search.query}`);
        try {
            const scrapeResult: ScrapeResult = await scraper.scrape(search, existingData);
            const { lots: newLots, executionTimeMs, initialLotCount, newLotCount } = scrapeResult;

            console.log(`Completed scraper for search: ${search.query}. Found ${initialLotCount} total lots, ${newLotCount} new lots. Execution time: ${executionTimeMs}ms`);

            // Save new lots immediately if any were found
            if (newLots.length > 0) {
                const allLots = Object.values(existingData);
                const { writeLots } = await import('./api.ts');
                writeLots(allLots);
                console.log(`Saved ${newLots.length} new lots for search: ${search.query}`);
            }

            // Record that this search was run today with timing data
            const searchRun: SearchRuns = {
                id: crypto.randomUUID(),
                date: today,
                searchId: search.id,
                executionTimeMs,
                initialLotCount,
                newLotCount,
                errors: scrapeResult.lotErrors,
                ignored: scrapeResult.ignoredCount,
                missingRequirements: scrapeResult.missingRequirementsCount,
            };

            db.create(SEARCH_RUNS_COLLECTION, searchRun);
            console.log(`Search run recorded for "${search.query}" on ${today} - ${executionTimeMs}ms, ${initialLotCount} initial, ${newLotCount} new`);

        } catch (error) {
            console.error(`Failed to scrape search "${search.query}":`, error);
        }
    }

    console.log('Daily search check completed');
}

// Run daily searches check on startup
await checkAndRunDailySearches();

let lots = readLots();
if (!lots || lots.length < 1) {

  await main()
  lots = readLots();
}

const app = new Hono()

// Home page route with search and location filtering
app.get('/', (c) => {
    const lots = readLots();
    const searches = readSearches();
    const locations = getUniqueLocations();
    const selectedSearchId = c.req.query('search');
    const selectedLocation = c.req.query('location');

    return c.html(<LotsHomePage
        lots={lots}
        searches={searches}
        locations={locations}
        selectedSearchId={selectedSearchId}
        selectedLocation={selectedLocation}
    />);
});

// Lot detail page
app.get('/lots/:id', (c) => {
  const lotId = c.req.param('id');
  const lots = readLots();
  const lot = lots.find(l => l.lotId === lotId);

  if (!lot) {
      return c.html(
          <html>
              <head><title>Lot Not Found</title></head>
              <body>
                  <h1>Lot Not Found</h1>
                  <p>The lot with ID "{lotId}" was not found.</p>
                  <a href="/">← Back to Lots</a>
              </body>
          </html>,
          404
      );
  }

  return c.html(<LotDetailPage lot={lot} />);
});

// New search form page
app.get('/searches/new', (c) => {
    return c.html(<SearchFormPage />);
});

// Edit search form page
app.get('/searches/:id/edit', (c) => {
    const searchId = c.req.param('id');
    const searches = readSearches();
    const search = searches.find(s => s.id === searchId);

    if (!search) {
        return c.html(
            <html>
                <head><title>Search Not Found</title></head>
                <body>
                    <h1>Search Not Found</h1>
                    <p>The search with ID "{searchId}" was not found.</p>
                    <a href="/">← Back to Home</a>
                </body>
            </html>,
            404
        );
    }

    return c.html(<SearchFormPage search={search} isEdit={true} />);
});

// Handle new search form submission
app.post('/searches', async (c) => {
    try {
        const formData = await c.req.formData();
        const query = formData.get('query') as string;
        const name = formData.get('name') as string;
        const requiredTitleTerms = formData.get('requiredTitleTerms') as string;
        const requiredDescTerms = formData.get('requiredDescTerms') as string;
        const ignoredTitleTerms = formData.get('ignoredTitleTerms') as string;
        const ignoredDescTerms = formData.get('ignoredDescTerms') as string;

        if (!query || !query.trim()) {
            return c.redirect('/searches/new?error=invalid-query');
        }

        const newSearch: Search = {
            id: crypto.randomUUID(),
            query: query.trim(),
            name: name?.trim() || undefined,
            requiredTitleTerms: requiredTitleTerms ? requiredTitleTerms.split(TERM_DELIMITER).map(s => s.trim()).filter(s => s) : undefined,
            requiredDescTerms: requiredDescTerms ? requiredDescTerms.split(TERM_DELIMITER).map(s => s.trim()).filter(s => s) : undefined,
            ignoredTitleTerms: ignoredTitleTerms ? ignoredTitleTerms.split(TERM_DELIMITER).map(s => s.trim()).filter(s => s) : undefined,
            ignoredDescTerms: ignoredDescTerms ? ignoredDescTerms.split(TERM_DELIMITER).map(s => s.trim()).filter(s => s) : undefined
        };

        addSearch(newSearch);
        return c.redirect('/');
    } catch (error) {
        return c.redirect('/searches/new?error=failed-to-save');
    }
});

// Handle edit search form submission
app.post('/searches/:id', async (c) => {
    try {
        const searchId = c.req.param('id');
        const formData = await c.req.formData();
        const query = formData.get('query') as string;
        const name = formData.get('name') as string;
        const requiredTitleTerms = formData.get('requiredTitleTerms') as string;
        const requiredDescTerms = formData.get('requiredDescTerms') as string;
        const ignoredTitleTerms = formData.get('ignoredTitleTerms') as string;
        const ignoredDescTerms = formData.get('ignoredDescTerms') as string;

        if (!query || !query.trim()) {
            return c.redirect(`/searches/${searchId}/edit?error=invalid-query`);
        }

        const updatedSearch: Search = {
            id: searchId,
            query: query.trim(),
            name: name?.trim() || undefined,
            requiredTitleTerms: requiredTitleTerms ? requiredTitleTerms.split(TERM_DELIMITER).map(s => s.trim()).filter(s => s) : undefined,
            requiredDescTerms: requiredDescTerms ? requiredDescTerms.split(TERM_DELIMITER).map(s => s.trim()).filter(s => s) : undefined,
            ignoredTitleTerms: ignoredTitleTerms ? ignoredTitleTerms.split(TERM_DELIMITER).map(s => s.trim()).filter(s => s) : undefined,
            ignoredDescTerms: ignoredDescTerms ? ignoredDescTerms.split(TERM_DELIMITER).map(s => s.trim()).filter(s => s) : undefined
        };

        // Update the search using the API
        const { updateSearch } = await import('./api.ts');
        updateSearch(updatedSearch);
        return c.redirect('/');
    } catch (error) {
        return c.redirect(`/searches/${c.req.param('id')}/edit?error=failed-to-save`);
    }
});

// Handle new search API endpoint
app.post('/api/searches', async (c) => {
    try {
        const searchData = await c.req.json();
        const { query, name, requiredTitleTerms, requiredDescTerms, ignoredTitleTerms, ignoredDescTerms } = searchData;

        if (!query || !query.trim()) {
            return c.json({ error: 'Query is required' }, 400);
        }

        const newSearch: Search = {
            id: crypto.randomUUID(),
            query: query.trim(),
            name: name?.trim() || undefined,
            requiredTitleTerms,
            requiredDescTerms,
            ignoredTitleTerms,
            ignoredDescTerms
        };

        const created = addSearch(newSearch);
        return c.json(created, 201);
    } catch (error) {
        return c.json({ error: 'Invalid JSON or failed to save' }, 400);
    }
});

// Mount API routes
app.route('/', apiApp);

serve({
  fetch: app.fetch,
  port: 3000,
  // hostname: '0.0.0.0'
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
