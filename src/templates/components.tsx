export function ApiInfo() {
    return (
        <div className="api-info">
            <h2>API Endpoints</h2>
            <div className="api-endpoint">GET /api/lots - Get all lots</div>
            <div className="api-endpoint">GET /api/lots/:id - Get lot by ID</div>
            <div className="api-endpoint">POST /api/lots - Create new lot</div>
            <div className="api-endpoint">PUT /api/lots/:id - Update lot</div>
            <div className="api-endpoint">PATCH /api/lots/:id - Partially update lot</div>
            <div className="api-endpoint">DELETE /api/lots/:id - Delete lot</div>
        </div>
    );
}
