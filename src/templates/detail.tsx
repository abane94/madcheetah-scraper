import type { Lot } from '../shared/types.ts';

export function LotDetailPage({ lot }: { lot: Lot }) {
    return (
        <html>
            <head>
                <title>{lot.title} - Lot Details</title>
                <style>{`
                    body { font-family: Arial, sans-serif; margin: 40px; background-color: #f5f5f5; }
                    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
                    .back-link { color: #007bff; text-decoration: none; padding: 8px 16px; background: white; border-radius: 4px; }
                    .back-link:hover { background: #f8f9fa; }
                    .lot-detail { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                    .lot-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
                    .info-section h3 { margin-top: 0; color: #333; border-bottom: 2px solid #007bff; padding-bottom: 8px; }
                    .info-item { margin: 10px 0; }
                    .info-label { font-weight: bold; color: #666; }
                    .info-value { margin-left: 10px; }
                    .condition-badge { padding: 6px 12px; border-radius: 16px; font-size: 0.9em; font-weight: bold; }
                    .condition-good { background-color: #d4edda; color: #155724; }
                    .condition-fair { background-color: #fff3cd; color: #856404; }
                    .condition-poor { background-color: #f8d7da; color: #721c24; }
                    .images-section { margin-top: 30px; }
                    .images-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; margin-top: 20px; }
                    .image-item { background: #f8f9fa; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                    .image-item img { width: 100%; height: 200px; object-fit: cover; cursor: pointer; transition: transform 0.2s; }
                    .image-item img:hover { transform: scale(1.05); }
                    .no-images { text-align: center; padding: 40px; color: #666; background: #f8f9fa; border-radius: 8px; }
                    .description-section { margin-top: 30px; }
                    .description-content { background: #f8f9fa; padding: 20px; border-radius: 8px; line-height: 1.6; }
                `}</style>
            </head>
            <body>
                <div className="header">
                    <h1>{lot.title}</h1>
                    <a href="/" className="back-link">← Back to Lots</a>
                </div>

                <div className="lot-detail">
                    <div className="lot-info">
                        <div className="info-section">
                            <h3>Basic Information</h3>
                            <div className="info-item">
                                <span className="info-label">Lot ID:</span>
                                <span className="info-value">{lot.lotId}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Lot Name:</span>
                                <span className="info-value">{lot.lotName}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Lot Number:</span>
                                <span className="info-value">#{lot.lotNumber}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Location:</span>
                                <span className="info-value">{lot.location}</span>
                            </div>
                            {lot.condition && (
                                <div className="info-item">
                                    <span className="info-label">Condition:</span>
                                    <span className={`condition-badge condition-${lot.condition.toLowerCase()}`}>
                                        {lot.condition}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="info-section">
                            <h3>Additional Details</h3>
                            <div className="info-item">
                                <span className="info-label">Timestamp:</span>
                                <span className="info-value" data-time={lot.timestamp}>{new Date(lot.timestamp).toLocaleString()}</span>
                            </div>
                            {lot.url && (
                                <div className="info-item">
                                    <span className="info-label">Source URL:</span>
                                    <span className="info-value">
                                        <a href={lot.url} target="_blank" rel="noopener">View Original</a>
                                    </span>
                                </div>
                            )}
                            {lot.thumbnailCount && (
                                <div className="info-item">
                                    <span className="info-label">Thumbnail Count:</span>
                                    <span className="info-value">{lot.thumbnailCount}</span>
                                </div>
                            )}
                            {lot.imageFilenames && lot.imageFilenames.length > 0 && (
                                <div className="info-item">
                                    <span className="info-label">Image Files:</span>
                                    <span className="info-value">{lot.imageFilenames.length} files</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {lot.description && (
                        <div className="description-section">
                            <h3>Description</h3>
                            <div className="description-content">
                                {lot.description}
                            </div>
                        </div>
                    )}

                    <div className="images-section">
                        <h3>Images ({lot.imageUrls?.length || 0})</h3>
                        {lot.imageUrls && lot.imageUrls.length > 0 ? (
                            <div className="images-grid">
                                {lot.imageUrls.map((imageUrl, index) => (
                                    <div key={index} className="image-item">
                                        <img
                                            src={imageUrl}
                                            alt={`${lot.title} - Image ${index + 1}`}
                                            onclick={`window.open('${imageUrl}', '_blank')`}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-images">
                                <p>No images available for this lot</p>
                            </div>
                        )}
                    </div>
                </div>
            </body>
        </html>
    );
}
