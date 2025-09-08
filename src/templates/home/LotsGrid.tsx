import type { Lot } from '../../shared/types.ts';
import { LotCard } from './LotCard.tsx';

export function LotsGrid({ lots }: { lots: Record<string, Lot[]> }) {
    return (
        <>
            <style>{`
                .lots-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 20px;
                    margin-bottom: 48px;
                }
                .lot-card {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    overflow: hidden;
                    transition: transform 0.2s, box-shadow 0.2s;
                    cursor: pointer;
                }
                .lot-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
                }
                .lot-image-container {
                    width: 100%;
                    height: 200px;
                    background: #eee;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    padding: 8px;
                }
                .lot-image {
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                    border-radius: 4px;
                }
                .no-image {
                    color: #999;
                    font-size: 14px;
                    text-align: center;
                }
                .lot-content {
                    padding: 16px;
                }
                .lot-title {
                    font-weight: bold;
                    color: #007bff;
                    font-size: 16px;
                    margin-bottom: 8px;
                    text-decoration: none;
                    display: block;
                }
                .lot-title:hover {
                    text-decoration: underline;
                }
                .lot-meta {
                    font-size: 12px;
                    color: #666;
                    margin-bottom: 8px;
                }
                .lot-location {
                    color: #666;
                    font-size: 14px;
                    margin-bottom: 8px;
                }
                .lot-condition {
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                    display: inline-block;
                    margin-bottom: 8px;
                }
                .condition-good { background-color: #d4edda; color: #155724; }
                .condition-fair { background-color: #fff3cd; color: #856404; }
                .condition-poor { background-color: #f8d7da; color: #721c24; }
                .lot-description {
                    color: #555;
                    font-size: 14px;
                    line-height: 1.4;
                    margin-bottom: 8px;
                }
                .lot-timestamp {
                    color: #999;
                    font-size: 12px;
                }

                @media (max-width: 768px) {
                    .lots-grid { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px; }
                    .lot-image-container { height: 160px; padding: 6px; }
                    .lot-content { padding: 12px; }
                }

                @media (max-width: 480px) {
                    .lots-grid { grid-template-columns: 1fr; }
                    .lot-image-container { height: 140px; padding: 4px; }
                }
            `}</style>

                {Object.keys(lots).sort().map(day => (
                    <div>
                        <h2 id={day} data-date={day}>{new Date(`${day}T12:00:00`).toDateString()}</h2>
                        <hr></hr>
                        <div className="lots-grid">
                        {lots[day].map((lot: Lot) => (
                            <LotCard key={lot.lotId} lot={lot} />
                        ))}
                        </div>
                    </div>
                ))}
        </>
    );
}
