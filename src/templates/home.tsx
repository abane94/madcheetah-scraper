import type { Lot, Search } from '../shared/types.ts';
import { ApiInfo } from './components.tsx';
import { SearchTabs } from './home/SearchTabs.tsx';
import { LotsGrid } from './home/LotsGrid.tsx';
import { LocationFilter } from './home/LocationFilter.tsx';

type Props = {
    lots: Lot[],
    searches: Search[],
    locations: string[],
    selectedSearchId?: string,
    selectedLocation?: string,
    showSearchRunsLink?: boolean
}

export function LotsHomePage({
    lots,
    searches,
    locations,
    selectedSearchId,
    selectedLocation,
    showSearchRunsLink
}: Props) {
    // Helper function to filter and group lots in a single pass
    const filterAndGroupLots = (
        lots: Lot[],
        searchId?: string,
        location?: string
    ): { filteredLots: Lot[], dayLots: Record<string, Lot[]> } => {
        const filteredLots: Lot[] = [];
        const dayLots: Record<string, Lot[]> = {};

        for (const lot of lots) {
            // Apply filters
            if (searchId && lot.searchId !== searchId) continue;
            if (location && lot.location !== location) continue;

            // Add to filtered list
            filteredLots.push(lot);

            // Group by day
            const endDate = new Date(lot.timestamp).toISOString().split('T')[0];
            if (!dayLots[endDate]) {
                dayLots[endDate] = [];
            }
            dayLots[endDate].push(lot);
        }

        return { filteredLots, dayLots };
    };

    const { filteredLots, dayLots } = filterAndGroupLots(lots, selectedSearchId, selectedLocation);

    const selectedSearch = selectedSearchId
        ? searches.find(s => s.id === selectedSearchId)
        : null;

    let titleText = selectedSearch ? selectedSearch.query : 'All Searches';
    if (selectedLocation) {
        titleText += ` in ${selectedLocation}`;
    }
    titleText += ` (${filteredLots.length} lots)`;

    return (
        <html>
            <head>
                <title>Lots Dashboard</title>
                <style>{`
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                        background-color: #f5f5f5;
                    }
                    h1 {
                        color: #333;
                        margin-bottom: 20px;
                        text-align: center;
                    }
                    .no-data {
                        text-align: center;
                        padding: 40px;
                        background: white;
                        border-radius: 8px;
                    }
                    .api-info {
                        margin-top: 30px;
                        padding: 20px;
                        background: white;
                        border-radius: 8px;
                    }
                    .api-info h2 {
                        margin-top: 0;
                    }
                    .api-endpoint {
                        background: #f8f9fa;
                        padding: 8px 12px;
                        border-radius: 4px;
                        font-family: monospace;
                        margin: 5px 0;
                    }

                    .toc {
                        list-style-type: none;
                    }

                    .toc li {
                        font-size: 16pt;
                        list-style-type: none;
                    }

                    .toc a,
                    .toc a:link,
                    .toc a:visited,
                    .toc a:hover,
                    .toc a:active {
                        text-decoration: none;
                        color: inherit; /* or a specific color */
                    }

                    @media (max-width: 768px) {
                        body { margin: 10px; }
                    }
                `}</style>
            </head>
            <body>
                {showSearchRunsLink && (
                    <div style={{ marginBottom: '1em' }}>
                        <a href="/search-runs">View Recent Search Runs</a>
                    </div>
                )}
                <h1>{titleText}</h1>

                <SearchTabs
                    lots={lots}
                    searches={searches}
                    selectedSearchId={selectedSearchId}
                    selectedLocation={selectedLocation}
                />

                <LocationFilter
                    locations={locations}
                    selectedLocation={selectedLocation}
                    selectedSearchId={selectedSearchId}
                />

                <div className="toc">
                    <ul>
                        {Object.keys(dayLots).sort().map(day => (
                            <a href={`#${day}`}><li>{new Date(`${day}T12:00:00`).toDateString()}</li></a>
                        ))}
                    </ul>
                </div>

                {filteredLots.length === 0 ? (
                    <div className="no-data">
                        <h3>No lots found</h3>
                        <p>The data file might be empty or missing. Try running the scraper first.</p>
                    </div>
                ) : (
                    <LotsGrid lots={dayLots} />
                )}

                <ApiInfo />
            </body>
        </html>
    );
}
