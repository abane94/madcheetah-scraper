import type { Lot, Search } from '../shared/types.ts';
import { ApiInfo } from './components.tsx';
import { SearchTabs } from './home/SearchTabs.tsx';
import { LotsGrid } from './home/LotsGrid.tsx';
import { LocationFilter } from './home/LocationFilter.tsx';

export function LotsHomePage({
    lots,
    searches,
    locations,
    selectedSearchId,
    selectedLocation
}: {
    lots: Lot[],
    searches: Search[],
    locations: string[],
    selectedSearchId?: string,
    selectedLocation?: string
}) {
    // Filter lots based on selected search and location
    let filteredLots = lots;

    if (selectedSearchId) {
        filteredLots = filteredLots.filter(lot => lot.searchId === selectedSearchId);
    }

    if (selectedLocation) {
        filteredLots = filteredLots.filter(lot => lot.location === selectedLocation);
    }

    const selectedSearch = selectedSearchId
        ? searches.find(s => s.id === selectedSearchId)
        : null;

    let titleText = selectedSearch ? selectedSearch.query : 'All Searches';
    if (selectedLocation) {
        titleText += ` in ${selectedLocation}`;
    }
    titleText += ` (${filteredLots.length} lots)`;

    const dayLots: Record<string, Lot[]> = {}
    for (const lot of filteredLots) {
        const endDate = new Date(lot.timestamp).toISOString().split('T')[0];
        const existingLots = dayLots[endDate] || [];
        existingLots.push(lot)
        dayLots[endDate] = existingLots;
    }

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
                        {Object.keys(dayLots).map(day => (
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
