export function LocationFilter({ locations, selectedLocation, selectedSearchId }: {
    locations: string[],
    selectedLocation?: string,
    selectedSearchId?: string
}) {
    if (locations.length === 0) return null;

    const buildUrl = (location?: string) => {
        const params = new URLSearchParams();
        if (selectedSearchId) params.set('search', selectedSearchId);
        if (location) params.set('location', location);
        return '/?' + params.toString();
    };

    return (
        <>
            <style>{`
                .location-filter {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    margin-bottom: 20px;
                    padding: 0 20px;
                }

                .location-filter label {
                    font-weight: 500;
                    color: #333;
                }

                .location-select {
                    padding: 8px 12px;
                    border: 2px solid #ddd;
                    border-radius: 6px;
                    background: white;
                    font-size: 14px;
                    cursor: pointer;
                    min-width: 200px;
                }

                .location-select:focus {
                    outline: none;
                    border-color: #007bff;
                }

                @media (max-width: 768px) {
                    .location-filter {
                        flex-direction: column;
                        gap: 8px;
                        padding: 0 10px;
                    }

                    .location-select {
                        min-width: 250px;
                    }
                }
            `}</style>

            <script dangerouslySetInnerHTML={{
                __html: `
                function changeLocation(select) {
                    const location = select.value;
                    const url = new URL(window.location.href);

                    if (location) {
                        url.searchParams.set('location', location);
                    } else {
                        url.searchParams.delete('location');
                    }
                    url.hash = ''

                    window.location.href = url.toString();
                }`
            }}></script>

            <div className="location-filter">
                <label htmlFor="location-select">Filter by Location:</label>
                <select
                    id="location-select"
                    className="location-select"
                    data-value={selectedLocation}
                    value={selectedLocation || ''}
                    onChange="changeLocation(this)"
                >
                    <option value="">All Locations</option>
                    {locations.map((location: string) => (
                        <option key={location} value={location} selected={location === selectedLocation}>
                            {location}
                        </option>
                    ))}
                </select>
            </div>
        </>
    );
}
