// import type { Lot } from './shared/types.ts';

// export function LotsHomePage({ lots }: { lots: Lot[] }) {
//     console.log(lots)
//     return (
//         <html>
//             <head>
//                 <title>Lots Dashboard</title>
//                 <style>{`
//                     body { font-family: Arial, sans-serif; margin: 40px; background-color: #f5f5f5; }
//                     h1 { color: #333; margin-bottom: 30px; }
//                     table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
//                     th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
//                     th { background-color: #f8f9fa; font-weight: bold; }
//                     tr:hover { background-color: #f8f9fa; }
//                     .lot-image { width: 60px; height: 60px; object-fit: cover; border-radius: 4px; }
//                     .lot-title { font-weight: bold; color: #007bff; }
//                     .lot-location { color: #666; font-size: 0.9em; }
//                     .lot-condition { padding: 4px 8px; border-radius: 12px; font-size: 0.8em; }
//                     .condition-good { background-color: #d4edda; color: #155724; }
//                     .condition-fair { background-color: #fff3cd; color: #856404; }
//                     .condition-poor { background-color: #f8d7da; color: #721c24; }
//                     .api-info { margin-top: 30px; padding: 20px; background: white; border-radius: 8px; }
//                     .api-info h2 { margin-top: 0; }
//                     .api-endpoint { background: #f8f9fa; padding: 8px 12px; border-radius: 4px; font-family: monospace; margin: 5px 0; }
//                     .no-data { text-align: center; padding: 40px; background: white; border-radius: 8px; }
//                 `}</style>
//             </head>
//             <body>
//                 <h1>Lots Dashboard ({lots.length} lots)</h1>

//                 {lots.length === 0 ? (
//                     <div className="no-data">
//                         <h3>No lots found</h3>
//                         <p>The data file might be empty or missing. Try running the scraper first.</p>
//                     </div>
//                 ) : (
//                     <LotsTable lots={lots} />
//                 )}

//                 <ApiInfo />
//             </body>
//         </html>
//     );
// }

// export function LotDetailPage({ lot }: { lot: Lot }) {
//     return (
//         <html>
//             <head>
//                 <title>{lot.title} - Lot Details</title>
//                 <style>{`
//                     body { font-family: Arial, sans-serif; margin: 40px; background-color: #f5f5f5; }
//                     .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
//                     .back-link { color: #007bff; text-decoration: none; padding: 8px 16px; background: white; border-radius: 4px; }
//                     .back-link:hover { background: #f8f9fa; }
//                     .lot-detail { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
//                     .lot-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
//                     .info-section h3 { margin-top: 0; color: #333; border-bottom: 2px solid #007bff; padding-bottom: 8px; }
//                     .info-item { margin: 10px 0; }
//                     .info-label { font-weight: bold; color: #666; }
//                     .info-value { margin-left: 10px; }
//                     .condition-badge { padding: 6px 12px; border-radius: 16px; font-size: 0.9em; font-weight: bold; }
//                     .condition-good { background-color: #d4edda; color: #155724; }
//                     .condition-fair { background-color: #fff3cd; color: #856404; }
//                     .condition-poor { background-color: #f8d7da; color: #721c24; }
//                     .images-section { margin-top: 30px; }
//                     .images-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; margin-top: 20px; }
//                     .image-item { background: #f8f9fa; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
//                     .image-item img { width: 100%; height: 200px; object-fit: cover; cursor: pointer; transition: transform 0.2s; }
//                     .image-item img:hover { transform: scale(1.05); }
//                     .no-images { text-align: center; padding: 40px; color: #666; background: #f8f9fa; border-radius: 8px; }
//                     .description-section { margin-top: 30px; }
//                     .description-content { background: #f8f9fa; padding: 20px; border-radius: 8px; line-height: 1.6; }
//                 `}</style>
//             </head>
//             <body>
//                 <div className="header">
//                     <h1>{lot.title}</h1>
//                     <a href="/" className="back-link">← Back to Lots</a>
//                 </div>

//                 <div className="lot-detail">
//                     <div className="lot-info">
//                         <div className="info-section">
//                             <h3>Basic Information</h3>
//                             <div className="info-item">
//                                 <span className="info-label">Lot ID:</span>
//                                 <span className="info-value">{lot.lotId}</span>
//                             </div>
//                             <div className="info-item">
//                                 <span className="info-label">Lot Name:</span>
//                                 <span className="info-value">{lot.lotName}</span>
//                             </div>
//                             <div className="info-item">
//                                 <span className="info-label">Lot Number:</span>
//                                 <span className="info-value">#{lot.lotNumber}</span>
//                             </div>
//                             <div className="info-item">
//                                 <span className="info-label">Location:</span>
//                                 <span className="info-value">{lot.location}</span>
//                             </div>
//                             {lot.condition && (
//                                 <div className="info-item">
//                                     <span className="info-label">Condition:</span>
//                                     <span className={`condition-badge condition-${lot.condition.toLowerCase()}`}>
//                                         {lot.condition}
//                                     </span>
//                                 </div>
//                             )}
//                         </div>

//                         <div className="info-section">
//                             <h3>Additional Details</h3>
//                             <div className="info-item">
//                                 <span className="info-label">Timestamp:</span>
//                                 <span className="info-value">{new Date(lot.timestamp).toLocaleString()}</span>
//                             </div>
//                             {lot.url && (
//                                 <div className="info-item">
//                                     <span className="info-label">Source URL:</span>
//                                     <span className="info-value">
//                                         <a href={lot.url} target="_blank" rel="noopener">View Original</a>
//                                     </span>
//                                 </div>
//                             )}
//                             {lot.thumbnailCount && (
//                                 <div className="info-item">
//                                     <span className="info-label">Thumbnail Count:</span>
//                                     <span className="info-value">{lot.thumbnailCount}</span>
//                                 </div>
//                             )}
//                             {lot.imageFilenames && lot.imageFilenames.length > 0 && (
//                                 <div className="info-item">
//                                     <span className="info-label">Image Files:</span>
//                                     <span className="info-value">{lot.imageFilenames.length} files</span>
//                                 </div>
//                             )}
//                         </div>
//                     </div>

//                     {lot.description && (
//                         <div className="description-section">
//                             <h3>Description</h3>
//                             <div className="description-content">
//                                 {lot.description}
//                             </div>
//                         </div>
//                     )}

//                     <div className="images-section">
//                         <h3>Images ({lot.imageUrls?.length || 0})</h3>
//                         {lot.imageUrls && lot.imageUrls.length > 0 ? (
//                             <div className="images-grid">
//                                 {lot.imageUrls.map((imageUrl, index) => (
//                                     <div key={index} className="image-item">
//                                         <img
//                                             src={imageUrl}
//                                             alt={`${lot.title} - Image ${index + 1}`}
//                                             onclick={`window.open('${imageUrl}', '_blank')`}
//                                         />
//                                     </div>
//                                 ))}
//                             </div>
//                         ) : (
//                             <div className="no-images">
//                                 <p>No images available for this lot</p>
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             </body>
//         </html>
//     );
// }

// function LotsTable({ lots }: { lots: Lot[] }) {
//     console.log(`rendering table ${lots}`)
//     return (
//         <table>
//             <thead>
//                 <tr>
//                     <th>Image</th>
//                     <th>Lot ID</th>
//                     <th>Title</th>
//                     <th>Location</th>
//                     <th>Condition</th>
//                     <th>Description</th>
//                     <th>Timestamp</th>
//                 </tr>
//             </thead>
//             <tbody>
//                 {lots.map((lot: Lot) => (
//                     <LotRow key={lot.lotId} lot={lot} />
//                 ))}
//             </tbody>
//         </table>
//     );
// }

// function LotRow({ lot }: { lot: Lot }) {
//     console.log(`rendering lot: ${lot.lotName}`)
//     return (
//         <tr data-id={lot.lotId}>
//             <td>
//                 {lot.imageUrls && lot.imageUrls.length > 0 ? (
//                     <img src={lot.imageUrls[0]} alt={lot.title} className="lot-image" />
//                 ) : (
//                     <div style="width: 60px; height: 60px; background: #eee; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #999;">
//                         No Image
//                     </div>
//                 )}
//             </td>
//             <td>{lot.lotId}</td>
//             <td>
//                 <div className="lot-title">
//                     <a href={`/lots/${lot.lotId}`} style="color: #007bff; text-decoration: none;">
//                         {lot.title}
//                     </a>
//                 </div>
//                 <div style="font-size: 0.9em; color: #666;">{lot.lotName}</div>
//                 <div style="font-size: 0.8em; color: #999;">#{lot.lotNumber}</div>
//             </td>
//             <td className="lot-location">{lot.location}</td>
//             <td>
//                 {lot.condition && (
//                     <span className={`lot-condition condition-${lot.condition.toLowerCase()}`}>
//                         {lot.condition}
//                     </span>
//                 )}
//             </td>
//             <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis;">
//                 {lot.description && lot.description.length > 100
//                     ? lot.description.substring(0, 100) + '...'
//                     : lot.description}
//             </td>
//             <td>{new Date(lot.timestamp).toLocaleDateString()}</td>
//         </tr>
//     );
// }

// function ApiInfo() {
//     return (
//         <div className="api-info">
//             <h2>API Endpoints</h2>
//             <div className="api-endpoint">GET /lots - Get all lots</div>
//             <div className="api-endpoint">GET /lots/:id - Get lot by ID</div>
//             <div className="api-endpoint">POST /lots - Create new lot</div>
//             <div className="api-endpoint">PUT /lots/:id - Update lot</div>
//             <div className="api-endpoint">PATCH /lots/:id - Partially update lot</div>
//             <div className="api-endpoint">DELETE /lots/:id - Delete lot</div>
//         </div>
//     );
// }

// // Re-export templates from organized files
// export { LotsHomePage } from './templates/home.tsx';
// export { LotDetailPage } from './templates/detail.tsx';
// export { ApiInfo } from './templates/components.tsx';
