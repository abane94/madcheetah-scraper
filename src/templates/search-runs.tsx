import { Fragment } from 'hono/jsx'
import type { Search, SearchRuns } from '../shared/types'

type Props = {
  searchRuns: SearchRuns[]
  searches: Search[]
}

function getSearchNameOrQuery(searches: Search[], searchId: string) {
  const search = searches.find(s => s.id === searchId)
  if (!search) return '(deleted)'
  return search.name?.trim() ? search.name : search.query
}

export function SearchRunsPage({ searchRuns, searches }: Props) {
  return (
    <html>
      <head>
        <title>Recent Search Runs</title>
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
          .runs-table-container {
            background: white;
            border-radius: 8px;
            padding: 24px;
            margin: 0 auto;
            max-width: 1100px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.07);
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1em;
            background: white;
          }
          th, td {
            padding: 10px 8px;
            text-align: center;
          }
          th {
            background: #f8f9fa;
            color: #222;
            font-weight: 600;
            border-bottom: 2px solid #e0e0e0;
          }
          tr:nth-child(even) {
            background: #fafbfc;
          }
          tr:hover {
            background: #f1f3f6;
          }
          a {
            color: #1976d2;
            text-decoration: none;
            font-size: 15px;
          }
          a:hover {
            text-decoration: underline;
          }
          .no-data {
            text-align: center;
            padding: 40px;
            background: white;
            border-radius: 8px;
          }
          @media (max-width: 900px) {
            .runs-table-container { padding: 8px; }
            table, th, td { font-size: 13px; }
          }
        `}</style>
      </head>
      <body>
        <div className="runs-table-container">
          <a href="/">← Back to Home</a>
          <h1>Recent Search Runs (Past 5 Days)</h1>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Search</th>
                <th>Execution Time (ms)</th>
                <th>Initial Lots</th>
                <th>New Lots</th>
                <th>Errors</th>
                <th>Ignored</th>
                <th>Missing Requirements</th>
              </tr>
            </thead>
            <tbody>
              {searchRuns.length === 0 && (
                <tr>
                  <td colSpan={8} className="no-data">No runs in the past 5 days.</td>
                </tr>
              )}
              {searchRuns.map(run => (
                <tr>
                  <td>{new Date(typeof run.date === 'number' ? run.date : Date.parse(run.date)).toLocaleString()}</td>
                  <td>{getSearchNameOrQuery(searches, run.searchId)}</td>
                  <td>{run.executionTimeMs ?? '-'}</td>
                  <td>{run.initialLotCount ?? '-'}</td>
                  <td>{run.newLotCount ?? '-'}</td>
                  <td>{run.errors ?? '-'}</td>
                  <td>{run.ignored ?? '-'}</td>
                  <td>{run.missingRequirements ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </body>
    </html>
  )
}
