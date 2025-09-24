import type { Lot } from '../../shared/types.ts';

const DESCRIPTION_CHAR_LIMIT = 500;
const CONDITION_CHAR_LIMIT = 100;

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
                {/* Prominent End Time */}
                <div
                    className="lot-endtime-prominent"
                    data-time={lot.timestamp}
                    style={{
                        fontWeight: 'bold',
                        color: '#b22222',
                        fontSize: '1.1em',
                        marginBottom: '0.5em',
                        background: '#fffbe6',
                        padding: '0.25em 0.5em',
                        borderRadius: '4px',
                        display: 'inline-block'
                    }}
                >
                    Ends: {new Date(lot.timestamp).toLocaleString()}
                </div>
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
                        {lot.condition.length > CONDITION_CHAR_LIMIT
                            ? lot.condition.substring(0, CONDITION_CHAR_LIMIT) + '...'
                            : lot.condition}
                    </span>
                )}
                {lot.description && (
                    <div
                        className="lot-description lot-description-clamp"
                        style={{
                            display: '-webkit-box',
                            WebkitBoxOrient: 'vertical',
                            WebkitLineClamp: 8,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}
                    >
                        {lot.description}
                    </div>
                )}
                {/* Easy link to original URL */}
                {lot.url && (
                    <a
                        href={lot.url}
                        className="lot-original-link"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-block',
                            marginTop: '0.75em',
                            padding: '0.4em 1em',
                            background: '#007bff',
                            color: '#fff',
                            borderRadius: '4px',
                            textDecoration: 'none',
                            fontWeight: 'bold'
                        }}
                    >
                        View Original Listing
                    </a>
                )}
            </div>
        </div>
    );
}
