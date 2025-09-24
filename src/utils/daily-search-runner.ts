import { readLots, readSearches } from '../api.ts'
import { Scraper } from '../web-scraper/scrapers/scraper.ts'
import type { SearchRuns, Lot } from '../shared/types.ts'
import type { ScrapeResult } from '../web-scraper/scrapers/scraper.ts'
import { db } from '../shared/db.ts'

const SEARCH_RUNS_COLLECTION = 'searchRuns';

export async function checkAndRunDailySearches() {
    console.log('Checking if daily searches need to be run...');

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const searches = readSearches().sort((s1, s2) => (s1.name || s1.query).localeCompare(s2.name || s2.query));

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
                const { writeLots } = await import('../api.ts');
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

    await scraper.destroy();
    console.log('Daily search check completed');
    return;
}
