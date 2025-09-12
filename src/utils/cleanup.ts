import fs from 'fs/promises'
import path from 'path'
import { readLots } from '../api.ts'
import type { SearchRuns, Lot } from '../shared/types.ts'
import { db } from '../shared/db.ts'
import { IMAGES_DIR } from '../env.ts'

const SEARCH_RUNS_COLLECTION = 'searchRuns';
const SEARCH_RUNS_RETENTION_DAYS = 7;

export async function cleanupOldSearchRuns() {
    console.log('Checking for old search runs to clean up...');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - SEARCH_RUNS_RETENTION_DAYS);
    const cutoffDateString = cutoffDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    const allSearchRuns = db.findAll<SearchRuns>(SEARCH_RUNS_COLLECTION);
    const oldSearchRuns = allSearchRuns.filter(run => run.date < cutoffDateString);

    if (oldSearchRuns.length === 0) {
        console.log('No old search runs found');
        return;
    }

    console.log(`Found ${oldSearchRuns.length} search runs older than ${SEARCH_RUNS_RETENTION_DAYS} days to clean up`);

    // Delete old search runs
    for (const searchRun of oldSearchRuns) {
        try {
            db.deleteById(SEARCH_RUNS_COLLECTION, searchRun.id);
            console.log(`Deleted search run from ${searchRun.date} (ID: ${searchRun.id})`);
        } catch (error) {
            console.warn(`Failed to delete search run ${searchRun.id}:`, error);
        }
    }

    console.log(`Cleaned up ${oldSearchRuns.length} old search runs`);
}

export async function cleanupExpiredLots() {
    console.log('Checking for expired lots to clean up...');

    const lots = readLots();
    const now = new Date();
    const expiredLots: Lot[] = [];
    const activeLots: Lot[] = [];

    // Separate expired and active lots
    lots.forEach(lot => {
        const lotEndTime = new Date(lot.timestamp);
        if (lotEndTime < now) {
            expiredLots.push(lot);
        } else {
            activeLots.push(lot);
        }
    });

    if (expiredLots.length === 0) {
        console.log('No expired lots found');
    } else {
        console.log(`Found ${expiredLots.length} expired lots to clean up`);
    }

    // Delete images for expired lots
    for (const lot of expiredLots) {
        if (lot.imageFilenames && lot.imageFilenames.length > 0) {
            for (const imagePath of lot.imageFilenames) {
                try {
                    const fullImagePath = path.join(IMAGES_DIR, imagePath);
                    await fs.unlink(fullImagePath);
                    console.log(`Deleted image: ${imagePath}`);
                } catch (error) {
                    console.warn(`Failed to delete image ${imagePath}:`);
                }
            }
        }
    }

    // Check for orphan images
    console.log('Checking for orphan images...');
    const imagesDir = IMAGES_DIR;

    try {
        const imageFiles = await fs.readdir(imagesDir);
        const activeLotIds = new Set(activeLots.map(lot => lot.lotId));
        const orphanImages: string[] = [];

        for (const filename of imageFiles) {
            // Check if image follows the naming pattern: lot_${lotId}_image_${number}.jpg
            const match = filename.match(/^lot_(.+)_image_\d+\.jpg$/);
            if (match) {
                const lotId = match[1];
                if (!activeLotIds.has(lotId)) {
                    orphanImages.push(filename);
                }
            }
        }

        if (orphanImages.length > 0) {
            console.log(`Found ${orphanImages.length} orphan images to delete`);
            for (const filename of orphanImages) {
                try {
                    await fs.unlink(path.join(imagesDir, filename));
                    console.log(`Deleted orphan image: ${filename}`);
                } catch (error) {
                    console.warn(`Failed to delete orphan image ${filename}:`, error);
                }
            }
        } else {
            console.log('No orphan images found');
        }
    } catch (error) {
        console.warn('Failed to check for orphan images:', error);
    }

    // Update lots file with only active lots
    if (expiredLots.length > 0) {
        const { writeLots } = await import('../api.ts');
        writeLots(activeLots);
        console.log(`Cleaned up ${expiredLots.length} expired lots and their images`);
    }

    console.log('Lot cleanup completed');
}
