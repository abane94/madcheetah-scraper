import { Hono } from 'hono';
import type { Lot, Search } from './shared/types.ts';
import { db } from './shared/db.ts';

const app = new Hono();

const LOTS_COLLECTION = 'lots';
const SEARCHES_COLLECTION = 'searches';
const SEARCH_RUNS_COLLECTION = 'searchRuns';

export function readLots(): Lot[] {
    return db.findAll<Lot>(LOTS_COLLECTION);
}

export function readSearches(): Search[] {
    return db.findAll<Search>(SEARCHES_COLLECTION) || [];
}

// Read all search runs
export function readSearchRuns() {
    return db.findAll(SEARCH_RUNS_COLLECTION) || [];
}

export function writeLots(lots: Lot[]): void {
    // Clear and recreate - maintaining backward compatibility
    db.clear(LOTS_COLLECTION);
    if (lots.length > 0) {
        db.createMany(LOTS_COLLECTION, lots);
    }
}

export function writeSearches(searches: Search[]): void {
    db.clear(SEARCHES_COLLECTION);
    if (searches.length > 0) {
        db.createMany(SEARCHES_COLLECTION, searches);
    }
}

export function addSearch(search: Search): Search {
    return db.create(SEARCHES_COLLECTION, search);
}

export function updateSearch(search: Search): Search {
    return db.replaceById(SEARCHES_COLLECTION, search.id, search);
}

// Cache for unique locations
let cachedLocations: string[] | null = null;
let cacheTimestamp: number = 0;
let cacheRequestCount: number = 0;
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
const CACHE_REQUEST_LIMIT = 10;

export function getUniqueLocations(): string[] {
    const now = Date.now();
    const cacheExpired = (now - cacheTimestamp) > CACHE_DURATION;
    const requestLimitReached = cacheRequestCount >= CACHE_REQUEST_LIMIT;

    // Return cached data if valid
    if (cachedLocations && !cacheExpired && !requestLimitReached) {
        cacheRequestCount++;
        return cachedLocations;
    }

    // Recalculate and cache
    console.log('Busting location cache')
    const lots = readLots();
    const locations = lots
        .map(lot => lot.location)
        .filter(location => location && location.trim())
        .filter((location, index, arr) => arr.indexOf(location) === index)
        .sort();

    // Update cache
    cachedLocations = locations;
    cacheTimestamp = now;
    cacheRequestCount = 1;

    return locations;
}

function generateId(): string {
    return crypto.randomUUID();
}

// API: GET all lots with optional search filter
app.get('/api/lots', (c) => {
    const lots = readLots();
    const searchId = c.req.query('search');
    const location = c.req.query('location');

    let filteredLots = lots;

    if (searchId) {
        filteredLots = filteredLots.filter(lot => lot.searchId === searchId);
    }

    if (location) {
        filteredLots = filteredLots.filter(lot => lot.location === location);
    }

    return c.json(filteredLots);
});

// API: GET all searches
app.get('/api/searches', (c) => {
    const searches = readSearches();
    return c.json(searches);
});

// API: GET lot by ID
app.get('/api/lots/:id', (c) => {
    const lotId = c.req.param('id');
    const lot = db.findById<Lot>(LOTS_COLLECTION, lotId);

    if (!lot) {
        return c.json({ error: 'Lot not found' }, 404);
    }

    return c.json(lot);
});

// API: POST create new lot
app.post('/api/lots', async (c) => {
    try {
        const newLot: Lot = await c.req.json();

        if (!newLot.lotId || !newLot.title || !newLot.lotName) {
            return c.json({ error: 'Missing required fields: lotId, title, lotName' }, 400);
        }

        // Ensure id matches lotId
        newLot.id = newLot.lotId;
        const created = db.create(LOTS_COLLECTION, newLot);

        return c.json(created, 201);
    } catch (error) {
        if (error instanceof Error && error.message.includes('already exists')) {
            return c.json({ error: 'Lot with this ID already exists' }, 409);
        }
        return c.json({ error: 'Invalid JSON or failed to save' }, 400);
    }
});

// API: PUT update lot
app.put('/api/lots/:id', async (c) => {
    try {
        const lotId = c.req.param('id');
        const updatedLot: Lot = await c.req.json();

        // Ensure the lotId and id match
        updatedLot.lotId = lotId;
        updatedLot.id = lotId;
        const updated = db.replaceById(LOTS_COLLECTION, lotId, updatedLot);

        if (!updated) {
            return c.json({ error: 'Lot not found' }, 404);
        }

        return c.json(updated);
    } catch (error) {
        return c.json({ error: 'Invalid JSON or failed to save' }, 400);
    }
});

// API: PATCH partially update lot
app.patch('/api/lots/:id', async (c) => {
    try {
        const lotId = c.req.param('id');
        const partialLot = await c.req.json();

        // Ensure lotId and id consistency
        const updates = { ...partialLot, lotId, id: lotId };
        const updated = db.updateById<Lot>(LOTS_COLLECTION, lotId, updates);

        if (!updated) {
            return c.json({ error: 'Lot not found' }, 404);
        }

        return c.json(updated);
    } catch (error) {
        return c.json({ error: 'Invalid JSON or failed to save' }, 400);
    }
});

// API: DELETE lot
app.delete('/api/lots/:id', (c) => {
    const lotId = c.req.param('id');
    const deleted = db.deleteById<Lot>(LOTS_COLLECTION, lotId);

    if (!deleted) {
        return c.json({ error: 'Lot not found' }, 404);
    }

    return c.json({ message: 'Lot deleted successfully', lot: deleted });
});

// API: POST create new search
app.post('/api/searches', async (c) => {
    try {
        const searchData = await c.req.json();
        const { query, name, requiredTitleTerms, requiredDescTerms, ignoredTitleTerms, ignoredDescTerms } = searchData;

        if (!query || !query.trim()) {
            return c.json({ error: 'Query is required' }, 400);
        }

        const newSearch: Search = {
            id: generateId(),
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

// API: PUT update search
app.put('/api/searches/:id', async (c) => {
    try {
        const searchId = c.req.param('id');
        const searchData = await c.req.json();
        const { query, name, requiredTitleTerms, requiredDescTerms, ignoredTitleTerms, ignoredDescTerms } = searchData;

        if (!query || !query.trim()) {
            return c.json({ error: 'Query is required' }, 400);
        }

        const updatedSearch: Search = {
            id: searchId,
            query: query.trim(),
            name: name?.trim() || undefined,
            requiredTitleTerms,
            requiredDescTerms,
            ignoredTitleTerms,
            ignoredDescTerms
        };

        const updated = updateSearch(updatedSearch);
        return c.json(updated);
    } catch (error) {
        return c.json({ error: 'Invalid JSON or failed to save' }, 400);
    }
});

// API: DELETE search
app.delete('/api/searches/:id', (c) => {
    const searchId = c.req.param('id');
    const deleted = db.deleteById<Search>(SEARCHES_COLLECTION, searchId);

    if (!deleted) {
        return c.json({ error: 'Search not found' }, 404);
    }

    return c.json({ message: 'Search deleted successfully', search: deleted });
});

export default app;
