import type { Lot, Search } from '../../shared/types.ts';

export function SearchTabs({ lots, searches, selectedSearchId, selectedLocation }: {
    lots: Lot[],
    searches: Search[],
    selectedSearchId?: string,
    selectedLocation?: string
}) {
    if (searches.length === 0) return null;

    const buildUrl = (searchId?: string) => {
        const params = new URLSearchParams();
        if (searchId) params.set('search', searchId);
        if (selectedLocation) params.set('location', selectedLocation);
        return '/?' + params.toString();
    };

    return (
        <>
            <style>{`
                .search-tabs {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-bottom: 30px;
                    padding: 0 20px;
                    justify-content: center;
                }

                .search-tab {
                    padding: 10px 16px;
                    background: white;
                    border: 2px solid #ddd;
                    border-radius: 8px;
                    text-decoration: none;
                    color: #333;
                    transition: all 0.2s;
                    font-size: 14px;
                    font-weight: 500;
                    min-width: 80px;
                    text-align: center;
                    display: block;
                }

                .search-tab:hover {
                    border-color: #007bff;
                    background-color: #f8f9fa;
                    text-decoration: none;
                }

                .search-tab.active {
                    background: #007bff;
                    color: white;
                    border-color: #007bff;
                }

                .search-tab .count {
                    font-size: 12px;
                    opacity: 0.8;
                    margin-left: 4px;
                }

                .add-search-btn {
                    padding: 10px 16px;
                    background: #28a745;
                    color: white;
                    border: 2px solid #28a745;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 14px;
                    font-weight: 500;
                    min-width: 80px;
                    text-align: center;
                    text-decoration: none;
                }

                .add-search-btn:hover {
                    background: #218838;
                    border-color: #218838;
                    text-decoration: none;
                    color: white;
                }

                .edit-search-btn {
                    padding: 10px 16px;
                    background: #ffc107;
                    color: #212529;
                    border: 2px solid #ffc107;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 14px;
                    font-weight: 500;
                    min-width: 80px;
                    text-align: center;
                    text-decoration: none;
                }

                .edit-search-btn:hover {
                    background: #e0a800;
                    border-color: #d39e00;
                    text-decoration: none;
                    color: #212529;
                }

                @media (max-width: 768px) {
                    .search-tabs { padding: 0 10px; }
                }

                @media (max-width: 480px) {
                    .search-tabs { flex-direction: column; align-items: center; }
                }
            `}</style>

            <script dangerouslySetInnerHTML={{
                __html: `
                async function addNewSearch() {
                    window.location.href = '/searches/new';
                }
                `
            }}></script>

            <div className="search-tabs">
                <a
                    href={buildUrl()}
                    className={`search-tab ${!selectedSearchId ? 'active' : ''}`}
                >
                    All <span className="count">({lots.length})</span>
                </a>
                {searches.map((search: Search) => {
                    const totalSearchLots = lots.filter(lot => lot.searchId === search.id);
                    let countString = `${totalSearchLots.length}`;
                    if (selectedLocation) {
                        const localSearchLots = totalSearchLots.filter(lot => lot.location == selectedLocation)
                        countString = `${localSearchLots.length}/${totalSearchLots.length}`
                    }

                    return (
                        <a
                            key={search.id}
                            href={buildUrl(search.id)}
                            className={`search-tab ${selectedSearchId === search.id ? 'active' : ''}`}
                        >
                            {search.name || search.query} <span className="count">({countString})</span>
                        </a>
                    );
                })}
                <button
                    className="add-search-btn"
                    onClick="addNewSearch()"
                    type="button"
                >
                    + Add Search
                </button>
                {selectedSearchId && (
                    <a
                        href={`/searches/${selectedSearchId}/edit`}
                        className="edit-search-btn"
                    >
                        Edit Current
                    </a>
                )}
            </div>
        </>
    );
}
