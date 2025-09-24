import { Hono } from 'hono'
import { LotsHomePage } from '../templates/home.tsx'
import { LotDetailPage } from '../templates/detail.tsx'
import { SearchFormPage } from '../templates/search-form.tsx'
import { readLots, readSearches, addSearch, getUniqueLocations, readSearchRuns } from '../api.ts'
import type { Search } from '../shared/types.ts'
import { TERM_DELIMITER } from '../shared/types.ts'
import { SearchRunsPage } from '../templates/search-runs.tsx'

const webRoutes = new Hono()

// Home page route with search and location filtering
webRoutes.get('/', (c) => {
    const begin = Date.now();
    const lots = readLots();
    const searches = readSearches();
    const locations = getUniqueLocations();
    const selectedSearchId = c.req.query('search');
    const selectedLocation = c.req.query('location');

    // Add link to search runs page by passing a prop
    const html = <LotsHomePage
        lots={lots}
        searches={searches}
        locations={locations}
        selectedSearchId={selectedSearchId}
        selectedLocation={selectedLocation}
        showSearchRunsLink={true}
    />;
    console.log(`[TIME] Home request took ${Date.now() - begin} ms`)

    return c.html(html);
});

// Lot detail page
webRoutes.get('/lots/:id', (c) => {
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
webRoutes.get('/searches/new', (c) => {
    return c.html(<SearchFormPage />);
});

// Edit search form page
webRoutes.get('/searches/:id/edit', (c) => {
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
webRoutes.post('/searches', async (c) => {
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
webRoutes.post('/searches/:id', async (c) => {
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
        const { updateSearch } = await import('../api.ts');
        updateSearch(updatedSearch);
        return c.redirect('/');
    } catch (error) {
        return c.redirect(`/searches/${c.req.param('id')}/edit?error=failed-to-save`);
    }
});

// Handle new search API endpoint
webRoutes.post('/api/searches', async (c) => {
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

// New route: Search Runs page
webRoutes.get('/search-runs', (c) => {
    const searchRuns = readSearchRuns();
    const searches = readSearches();
    const fiveDaysAgo = Date.now() - 5 * 24 * 60 * 60 * 1000;
    const recentRuns = searchRuns
        .filter(r => {
            const runTime = typeof r.date === 'number' ? r.date : Date.parse(r.date);
            return runTime >= fiveDaysAgo;
        })
        .sort((a, b) => {
            const aTime = typeof a.date === 'number' ? a.date : Date.parse(a.date);
            const bTime = typeof b.date === 'number' ? b.date : Date.parse(b.date);
            return bTime - aTime;
        });
    return c.html(<SearchRunsPage searchRuns={recentRuns} searches={searches} />);
});

export default webRoutes;
