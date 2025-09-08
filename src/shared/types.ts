export interface Data {
    id: string;
    name: string;
    value: number;
}

export interface ScraperConfig {
    url: string;
    options?: {
        waitForSelector?: string;
        timeout?: number;
    };
}

export const TERM_DELIMITER = '\n';

export interface Lot {
    id: string;
    searchId: string;
    lotId: string;
    title: string;
    lotName: string;
    lotNumber: string;
    location: string;
    timestamp: number;

    url?: string;
    condition?: string;
    description?: string;
    imageUrls?: string[];
    imageFilenames?: string[];
    thumbnailCount?: number;
}

export interface Search {
    id: string;  // generated when creating
    query: string;
    name?: string;
    requiredTitleTerms?: string[];
    requiredDescTerms?: string[];
    ignoredTitleTerms?: string[];
    ignoredDescTerms?: string[];
}

export interface SearchRuns {
    id: string;
    date: string;
    searchId: string;
    executionTimeMs?: number;
    initialLotCount?: number;
    newLotCount?: number;
    errors: number;
    ignored: number;
    missingRequirements: number;
}
