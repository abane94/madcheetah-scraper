import type { Lot } from "../shared/types.ts";
import { Scraper } from "./scrapers/scraper.ts"
import { writeFileSync } from "fs";

export async function main() {
    const scraper = new Scraper();
    let data = await scraper.scrape('solar panel');

    writeFileSync('./data/lots.json', JSON.stringify(Object.values(data), undefined, 4));
}


// main();
