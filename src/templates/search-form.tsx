import type { Search } from '../shared/types.ts';
import { TERM_DELIMITER } from '../shared/types.ts';

export function SearchFormPage({ search, isEdit = false }: {
    search?: Search,
    isEdit?: boolean
}) {
    const title = isEdit ? 'Edit Search' : 'Create New Search';
    const submitText = isEdit ? 'Update Search' : 'Create Search';

    console.log(search?.query)
    console.log(JSON.stringify(search))

    return (
        <html>
            <head>
                <title>{title}</title>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <style>{`
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #f5f5f5;
                    }

                    .container {
                        background: white;
                        padding: 30px;
                        border-radius: 10px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }

                    h1 {
                        color: #2c3e50;
                        margin-bottom: 30px;
                        text-align: center;
                    }

                    .form-group {
                        margin-bottom: 20px;
                    }

                    label {
                        display: block;
                        margin-bottom: 5px;
                        font-weight: 600;
                        color: #555;
                    }

                    input[type="text"], textarea {
                        width: 100%;
                        padding: 12px;
                        border: 2px solid #ddd;
                        border-radius: 6px;
                        font-size: 14px;
                        box-sizing: border-box;
                    }

                    input[type="text"]:focus, textarea:focus {
                        border-color: #007bff;
                        outline: none;
                    }

                    textarea {
                        height: 80px;
                        resize: vertical;
                    }

                    .help-text {
                        font-size: 12px;
                        color: #666;
                        margin-top: 5px;
                    }

                    .button-group {
                        display: flex;
                        gap: 15px;
                        margin-top: 30px;
                        justify-content: center;
                    }

                    .btn {
                        padding: 12px 24px;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 600;
                        text-decoration: none;
                        display: inline-block;
                        text-align: center;
                        transition: all 0.2s;
                    }

                    .btn-primary {
                        background: #007bff;
                        color: white;
                    }

                    .btn-primary:hover {
                        background: #0056b3;
                    }

                    .btn-secondary {
                        background: #6c757d;
                        color: white;
                    }

                    .btn-secondary:hover {
                        background: #545b62;
                        text-decoration: none;
                        color: white;
                    }

                    .btn-danger {
                        background: #dc3545;
                        color: white;
                    }

                    .btn-danger:hover {
                        background: #c82333;
                    }
                `}</style>
            </head>
            <body>
                <div className="container">
                    <h1>{title}</h1>

                    <form method="POST" action={isEdit ? `/searches/${search?.id}` : '/searches'}>
                        <div className="form-group">
                            <label htmlFor="query">Search Query *</label>
                            <input
                                type="text"
                                id="query"
                                name="query"
                                defaultValue={search?.query || ''}
                                value={search?.query || ''}
                                required
                            />
                            <div className="help-text">The main search term to look for</div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="name">Search Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                defaultValue={search?.name || ''}
                                value={search?.name || ''}
                            />
                            <div className="help-text">Optional display name for this search (defaults to query)</div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="requiredTitleTerms">Required Title Terms</label>
                            <textarea
                                id="requiredTitleTerms"
                                name="requiredTitleTerms"
                                defaultValue={search?.requiredTitleTerms?.join(TERM_DELIMITER) || ''}
                                placeholder="Enter one term per line&#10;term1&#10;term2&#10;term3"
                                value={search?.requiredTitleTerms?.join(TERM_DELIMITER) || ''}
                            >{search?.requiredTitleTerms?.join(TERM_DELIMITER) || ''}</textarea>
                            <div className="help-text">One term per line - all must appear in the title</div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="requiredDescTerms">Required Description Terms</label>
                            <textarea
                                id="requiredDescTerms"
                                name="requiredDescTerms"
                                defaultValue={search?.requiredDescTerms?.join(TERM_DELIMITER) || ''}
                                value={search?.requiredDescTerms?.join(TERM_DELIMITER) || ''}
                                placeholder="Enter one term per line&#10;term1&#10;term2&#10;term3"
                            >{search?.requiredDescTerms?.join(TERM_DELIMITER) || ''}</textarea>
                            <div className="help-text">One term per line - all must appear in the description</div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="ignoredTitleTerms">Ignored Title Terms</label>
                            <textarea
                                data-terms={JSON.stringify(search?.ignoredTitleTerms)}
                                id="ignoredTitleTerms"
                                name="ignoredTitleTerms"
                                defaultValue={search?.ignoredTitleTerms?.join(TERM_DELIMITER) || ''}
                                value={search?.ignoredTitleTerms?.join(TERM_DELIMITER) || ''}
                                placeholder="Enter one term per line&#10;term1&#10;term2&#10;term3"
                            >{search?.ignoredTitleTerms?.join(TERM_DELIMITER) || ''}</textarea>
                            <div className="help-text">One term per line - exclude from title matches</div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="ignoredDescTerms">Ignored Description Terms</label>
                            <textarea
                                id="ignoredDescTerms"
                                name="ignoredDescTerms"
                                defaultValue={search?.ignoredDescTerms?.join(TERM_DELIMITER) || ''}
                                value={search?.ignoredDescTerms?.join(TERM_DELIMITER) || ''}
                                placeholder="Enter one term per line&#10;term1&#10;term2&#10;term3"
                            >{search?.ignoredDescTerms?.join(TERM_DELIMITER) || ''}</textarea>
                            <div className="help-text">One term per line - exclude from description matches</div>
                        </div>

                        <div className="button-group">
                            <button type="submit" className="btn btn-primary">
                                {submitText}
                            </button>
                            <a href="/" className="btn btn-secondary">
                                Cancel
                            </a>
                            {isEdit && (
                                <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={`deleteSearch('${search?.id}')`}
                                >
                                    Delete Search
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <script dangerouslySetInnerHTML={{
                    __html: `
                    async function deleteSearch(searchId) {
                        if (confirm('Are you sure you want to delete this search? This cannot be undone.')) {
                            try {
                                const response = await fetch('/api/searches/' + searchId, {
                                    method: 'DELETE'
                                });

                                if (response.ok) {
                                    window.location.href = '/';
                                } else {
                                    alert('Failed to delete search. Please try again.');
                                }
                            } catch (error) {
                                alert('Error deleting search. Please try again.');
                            }
                        }
                    }
                    `
                }}></script>
            </body>
        </html>
    );
}
