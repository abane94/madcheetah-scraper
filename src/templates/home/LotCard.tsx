import type { Lot } from '../../shared/types.ts';

export function LotCard({ lot }: { lot: Lot }) {
    return (
        <div className="lot-card" data-id={lot.lotId} data-search-id={lot.searchId}>
            <div className="lot-image-container">
                {lot.imageUrls && lot.imageUrls.length > 0 ? (
                    <img src={lot.imageUrls[0]} alt={lot.title} className="lot-image" />
                ) : (
                    <div className="no-image">No Image Available</div>
                )}
            </div>
            <div className="lot-content">
                <a href={`/lots/${lot.lotId}`} className="lot-title">
                    {lot.title}
                </a>
                <div className="lot-meta">
                    {lot.lotName} • #{lot.lotNumber} • ID: {lot.lotId}
                </div>
                {lot.location && (
                    <div className="lot-location">📍 {lot.location}</div>
                )}
                {lot.condition && (
                    <span className={`lot-condition condition-${lot.condition.toLowerCase()}`}>
                        {lot.condition}
                    </span>
                )}
                {lot.description && (
                    <div className="lot-description">
                        {lot.description.length > 120
                            ? lot.description.substring(0, 120) + '...'
                            : lot.description}
                    </div>
                )}
                <div className="lot-timestamp" data-time={lot.timestamp}>
                    {new Date(lot.timestamp).toLocaleString()}
                </div>
            </div>
        </div>
    );
}
