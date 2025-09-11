import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { DATA_DIR } from '../env';

export interface DbDocument {
    id: string;
    [key: string]: any;
}

export class JsonDatabase {
    private dataDir: string;

    constructor(dataDir: string = './data') {
        this.dataDir = dataDir;
        this.ensureDataDir();
    }

    private ensureDataDir(): void {
        if (!existsSync(this.dataDir)) {
            mkdirSync(this.dataDir, { recursive: true });
        }
    }

    private getFilePath(collection: string): string {
        return `${this.dataDir}/${collection}.json`;
    }

    private readCollection<T extends DbDocument>(collection: string): T[] {
        try {
            const filePath = this.getFilePath(collection);
            if (!existsSync(filePath)) {
                return [];
            }
            const data = readFileSync(filePath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`Error reading collection ${collection}:`, error);
            return [];
        }
    }

    private writeCollection<T extends DbDocument>(collection: string, data: T[]): void {
        try {
            const filePath = this.getFilePath(collection);
            const dirPath = dirname(filePath);
            if (!existsSync(dirPath)) {
                mkdirSync(dirPath, { recursive: true });
            }
            writeFileSync(filePath, JSON.stringify(data, null, 4));
        } catch (error) {
            console.error(`Error writing collection ${collection}:`, error);
            throw new Error(`Failed to save collection ${collection}`);
        }
    }

    // Find operations
    findAll<T extends DbDocument>(collection: string): T[] {
        return this.readCollection<T>(collection);
    }

    findById<T extends DbDocument>(collection: string, id: string): T | null {
        const items = this.readCollection<T>(collection);
        return items.find(item => item.id === id) || null;
    }

    findOne<T extends DbDocument>(collection: string, predicate: (item: T) => boolean): T | null {
        const items = this.readCollection<T>(collection);
        return items.find(predicate) || null;
    }

    findMany<T extends DbDocument>(collection: string, predicate: (item: T) => boolean): T[] {
        const items = this.readCollection<T>(collection);
        return items.filter(predicate);
    }

    // Create operations
    create<T extends DbDocument>(collection: string, item: T): T {
        const items = this.readCollection<T>(collection);

        // Check if item with same ID already exists
        if (items.find(existing => existing.id === item.id)) {
            throw new Error(`Item with ID ${item.id} already exists in collection ${collection}`);
        }

        items.push(item);
        this.writeCollection(collection, items);
        return item;
    }

    createMany<T extends DbDocument>(collection: string, newItems: T[]): T[] {
        const items = this.readCollection<T>(collection);

        // Check for duplicate IDs
        for (const newItem of newItems) {
            if (items.find(existing => existing.id === newItem.id)) {
                throw new Error(`Item with ID ${newItem.id} already exists in collection ${collection}`);
            }
        }

        items.push(...newItems);
        this.writeCollection(collection, items);
        return newItems;
    }

    // Update operations
    updateById<T extends DbDocument>(collection: string, id: string, updates: Partial<T>): T | null {
        const items = this.readCollection<T>(collection);
        const index = items.findIndex(item => item.id === id);

        if (index === -1) {
            return null;
        }

        // Prevent ID changes
        const { id: _, ...safeUpdates } = updates;
        items[index] = { ...items[index], ...safeUpdates };
        this.writeCollection(collection, items);
        return items[index];
    }

    replaceById<T extends DbDocument>(collection: string, id: string, replacement: T): T | null {
        const items = this.readCollection<T>(collection);
        const index = items.findIndex(item => item.id === id);

        if (index === -1) {
            return null;
        }

        // Ensure ID consistency
        replacement.id = id;
        items[index] = replacement;
        this.writeCollection(collection, items);
        return replacement;
    }

    // Delete operations
    deleteById<T extends DbDocument>(collection: string, id: string): T | null {
        const items = this.readCollection<T>(collection);
        const index = items.findIndex(item => item.id === id);

        if (index === -1) {
            return null;
        }

        const deleted = items.splice(index, 1)[0];
        this.writeCollection(collection, items);
        return deleted;
    }

    deleteMany<T extends DbDocument>(collection: string, predicate: (item: T) => boolean): T[] {
        const items = this.readCollection<T>(collection);
        const toDelete: T[] = [];
        const remaining: T[] = [];

        for (const item of items) {
            if (predicate(item)) {
                toDelete.push(item);
            } else {
                remaining.push(item);
            }
        }

        if (toDelete.length > 0) {
            this.writeCollection(collection, remaining);
        }

        return toDelete;
    }

    // Utility operations
    count(collection: string): number {
        return this.readCollection(collection).length;
    }

    exists(collection: string, id: string): boolean {
        return this.findById(collection, id) !== null;
    }

    clear(collection: string): void {
        this.writeCollection(collection, []);
    }
}

// Default instance
export const db = new JsonDatabase(DATA_DIR);
