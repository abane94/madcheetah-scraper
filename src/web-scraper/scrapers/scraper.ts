import { startBrowser, navigateToPage, closeBrowser, sleep } from "../utils/puppeteer-utils.ts";
// import type { Lot } from '../../shared/types.ts';
import type { Lot, Search } from "../../shared/types.ts";
import { writeFile, mkdir } from 'node:fs/promises';
import { Browser, type Page } from 'puppeteer';
import { IMAGES_DIR } from "../../env.ts";

const PUPPETEER_THREADS = 3;

export interface ScrapeResult {
    lots: Lot[];
    executionTimeMs: number;
    initialLotCount: number;
    newLotCount: number;
    lotErrors: number;
    ignoredCount: number;
    missingRequirementsCount: number;
}

export class Scraper {
    private browser?: Browser;
    constructor() {
        // Initialize any necessary properties
    }

    async destroy() {
        if (this.browser) {
            try {
                await closeBrowser(this.browser);
            } catch (e) {
                console.error('Could not close main browser', e)
            }
        }
        return;
    }

    async scrape(search: Search, existingData: Record<string, Lot> = {}): Promise<ScrapeResult> {
        const startTime = Date.now();
        const query = search.query;
        const url: string = `https://bid.madcheetah.com/?keyword=${query.replace(/ /g, '+')}&items=all&display=grid&limit=120&page=1`
        const browser = this.browser || await startBrowser();
        this.browser = browser;
        const newLots: Lot[] = [];
        let lotErrors = 0;
        let ignoredCount = 0;
        let missingRequirementsCount = 0;
        const titleRequiredTerms = (search.requiredTitleTerms || []).map(s => s.toLowerCase());
        const descRequiredTerms = (search.requiredDescTerms || []).map(s => s.toLowerCase());
        const titleIgnoreTerms = (search.ignoredTitleTerms || []).map(s => s.toLowerCase());
        const descIgnoreTerms = (search.ignoredDescTerms || []).map(s => s.toLowerCase());

        let page: Page | undefined = undefined;
        let browsers: Browser[] = [];
        let pages: Page[] = [];
        try {
            page = await browser.newPage();
            if (!page) {
                throw new Error('Could not create page');
            }
            for (let i = 0; i < PUPPETEER_THREADS; i++) {
                const b = await startBrowser();
                const p = await b.newPage();
                if (!p) {
                    throw new Error('Could not create page');
                }
                pages.push(p);
                browsers.push(b)
            }
            // toDO have 1 page var for the main search

            await navigateToPage(page, url);

            // Wait for the item tiles grid to load
            await page.waitForSelector(".item-tiles.grid", { timeout: 30000 });

            // console.log("Successfully loaded Mad Cheetah auction page with item tiles");

            // Extract data from auction items that are open or prebidding
            let nextBtn: boolean | null;
            let allAuctionLots: Lot[] = [];
            do {
                nextBtn = await this.getNextPageElement(page);
                const auctionLots: Lot[] = await page.$$eval(
                    ".item-tile.lot",
                    (elements, searchId) => {
                        return elements.map(el => {
                            // Extract relevant data from each auction item
                            const lotId = el?.getAttribute('data-id') || '';
                            const title = el?.querySelector('.item-title')?.textContent?.trim() || '';
                            const lotName = el?.querySelector('.item-number')?.textContent?.trim() || '';
                            const lotNumberLink = el?.querySelector('.item-auction a')?.getAttribute('href') || '';
                            const location = el?.querySelector('.item-list-location a')?.textContent?.trim() || '';
                            const timestamp = (+(el?.querySelector('.item-countdown')?.getAttribute('data-end') || 0)) * 1000;

                            return {
                                id: lotId,
                                lotId,
                                searchId,
                                title,
                                lotName,
                                lotNumber: lotNumberLink?.trim().split("=").pop()!,
                                location,
                                timestamp
                            };
                        });
                    },
                    search.id
                );
                allAuctionLots.push(...auctionLots.filter(l => {
                    for (const term of titleRequiredTerms) {
                        if (!l.title.toLowerCase().includes(term)) {
                            missingRequirementsCount++;
                            return false;
                        }
                    }
                    if (titleRequiredTerms && titleRequiredTerms.length > 0) {
                        // if there are requred terms, and it meets the required terms(it got to this point)
                        //  then its valid, and should not check ignored terms
                        return true;
                    }
                    for (const term of titleIgnoreTerms) {
                        if (l.title.toLowerCase().includes(term)) {
                            ignoredCount++;
                            return false;
                        }
                    }
                    return true;
                }));
                if (nextBtn) {
                    await this.clickNextPage(page)
                }
            } while (nextBtn);

            const initialLotCount = allAuctionLots.length;

            // const results = await scrapeLots(page, '1', allAuctionLots, existingData, search);

            const scrapeStart = Date.now();
            const promises = pages.map((p, idx) => scrapeLots(p, `${idx}`, allAuctionLots, existingData, search));
            const results = await Promise.allSettled<ScrapeLotResults>(promises);
            console.log(`All Promises returned, duration ${Date.now() - scrapeStart }ms`);
            for (const result of results) {
                if (result.status === 'fulfilled') {
                    ignoredCount += result.value.ignoredCount;
                    missingRequirementsCount += result.value.missingRequirementsCount;
                    lotErrors += result.value.lotErrors;
                    newLots.push(...result.value.newLots)
                }
            }

            const executionTimeMs = Date.now() - startTime;

            return {
                lots: newLots,
                executionTimeMs,
                initialLotCount,
                newLotCount: newLots.length,
                lotErrors,
                ignoredCount,
                missingRequirementsCount
            };
        } catch (error) {
            console.error(`Scraping failed for ${query}:`, error);
            throw error;
        } finally {
            pages.forEach(p => p.close())
            await page?.close()
            // browser.forEach(b => )
            for (const b of browsers) {
                try {
                    await closeBrowser(b)
                } catch(e) {
                    console.log('Could not close browser', e)
                }
            }
        }
    }

    // Add more methods as needed for specific scraping tasks
    async getNextPageElement(page: Page): Promise<boolean | null> {
        return page.evaluate(() => {
            const activePageItem = document.querySelector('.pages .page-item.active');
            if (!activePageItem) return null;

            const currentPageNumber = parseInt(activePageItem.getAttribute('data-page') || '0');
            const nextPageNumber = currentPageNumber + 1;

            // Find the next page element
            const nextPageItem = document.querySelector(`.pages .page-item[data-page="${nextPageNumber}"]`);

            // Return true if next page exists, null if we're on the last page
            return nextPageItem ? true : null;
        });
    }

    async clickNextPage(page: Page): Promise<boolean> {
        const hasNextPage = await this.getNextPageElement(page);
        if (!hasNextPage) return false;

        try {
            await page.click('.pages .page-item.active + .page-item a');
        } catch (e) {
            await page.click('.pages .page-item.active + .page-item');
        }
        await page.waitForSelector(".item-tiles.grid", { timeout: 30000 });

        return true;
    }
}

interface ScrapeLotResults {
    ignoredCount: number,
    missingRequirementsCount: number,
    lotErrors: number,
    newLots: Lot[],
}

async function scrapeLots(page: Page, id: string, allAuctionLots: Lot[], existingData: Record<string, Lot>, search: Search): Promise<ScrapeLotResults> {
    const titleRequiredTerms = (search.requiredTitleTerms || []).map(s => s.toLowerCase());
    const descRequiredTerms = (search.requiredDescTerms || []).map(s => s.toLowerCase());
    const titleIgnoreTerms = (search.ignoredTitleTerms || []).map(s => s.toLowerCase());
    const descIgnoreTerms = (search.ignoredDescTerms || []).map(s => s.toLowerCase());
    console.log(`titleRequiredTerms: ${JSON.stringify(titleRequiredTerms)}`);
    console.log(`descRequiredTerms: ${JSON.stringify(descRequiredTerms)}`);
    console.log(`titleIgnoreTerms: ${JSON.stringify(titleIgnoreTerms)}`);
    console.log(`descIgnoreTerms: ${JSON.stringify(descIgnoreTerms)}`);
    let ignoredCount = 0;
    let missingRequirementsCount = 0;
    let lotErrors = 0;
    const newLots: Lot[] = [];

    let lot = allAuctionLots.pop();
    console.log(`Thread ${id} list length: ${allAuctionLots.length}`);
    // for (const lot of allAuctionLots) {
    while (lot) {
        console.log(`Thread ${id} scraping ${lot.lotId}`);
        try {
            const existingLot = existingData[lot.lotId];
            if (existingLot) {
                console.log(`Thread ${id} existing data, about to pop next lot`)
                lot = allAuctionLots.pop();
                continue;
            }

            console.log(lot.title);

            // Title should be checked when iterating all lots to add to the list to scrape

            // if (titleIgnoreTerms.some(term => lot!.title.toLowerCase().includes(term.toLowerCase()))) {
            //     ignoredCount++;
            //     console.log(`Thread ${id} ignoring, about to pop next lot`)
            //     lot = allAuctionLots.pop();
            //     continue;
            // }

            // for (const term of titleRequiredTerms) {
            //     if (!lot?.title.toLowerCase().includes(term)) {
            //         missingRequirementsCount++;
            //         console.log(`Thread ${id} missing requirements, about to pop next lot`)
            //         lot = allAuctionLots.pop();
            //         continue;
            //     }
            // }

            // console.log(`Thread ${id} navigating`)
            let url = `https://bid.madcheetah.com/lot/${lot.lotId}`;
            await navigateToPage(page, url);

            // Wait for the item details to load
            await page.waitForSelector(".item-details", { timeout: 30000 });
            // remove animations
            await page.addStyleTag({
                content: `
                *, *::after, *::before {
                    transition-delay: 0s !important;
                    transition-duration: 0s !important;
                    animation-delay: -0.0001s !important; /* Small negative delay to ensure immediate start */
                    animation-duration: 0s !important;
                    animation-play-state: paused !important;
                }
                `,
            });

            // Extract condition from the lot detail page
            await page.waitForSelector(".item-field.value", { timeout: 30000 });
            const condition = await page.$eval(".item-field.value", el => el.textContent?.trim() || '');
            // console.log('Condition', condition);
            const description = await page.$eval(".item-field > div.item-field-value", el => el.textContent?.trim() || '');

            for (const term of descRequiredTerms) {
                if (!description.toLowerCase().includes(term)) {
                    missingRequirementsCount++;
                    console.log(`Thread ${id} missing requirements, about to pop next lot`)
                    lot = allAuctionLots.pop();
                    continue;
                }
            }

            if (!descRequiredTerms || descRequiredTerms.length == 0) {
                // Only check the ignore terms if there are no required terms, if it gets to this point, then it has the required terms
                if (descIgnoreTerms.some(term => description.toLowerCase().includes(term.toLowerCase()))) {
                    ignoredCount++;
                    console.log(`Thread ${id} ignoring, about to pop next lot`)
                    lot = allAuctionLots.pop();
                    continue;
                }
            }

            lot = lot!;

            // Add condition to the lot data
            lot.condition = condition.replace('Condition: ', '').replace('SHIPPING QUOTE FOR THIS ITEM --> Click Here', '');
            lot.description = description;
            lot.url = url;

            // Click on the item image to open the gallery
            await page.click('.item-image');

            // Wait for the lightbox gallery to load
            await page.waitForSelector('.lg-object.lg-image', { timeout: 10000 });

            // Extract all image URLs from the gallery
            const firstImage: string = (await page.$$eval('.lg-object.lg-image', elements => {
                return elements.map(img => img.getAttribute('src')).filter(src => src);
            }))[0] as string;

            const imageUrlsSet = new Set<string>(); //[firstImage];
            imageUrlsSet.add(firstImage);

            // Count the number of thumbnail items
            // const thumbnailCount = await page.$$eval('.lg-thumb-item', elements => elements.length);

            // for (let i = 1; i < thumbnailCount; i++) {
            //     await page.click(`.lg-thumb-item[data-lg-item-id="${i}"]`);
            //     await sleep(100);
            //     const img: string = (await page.$$eval(`.lg-object.lg-image[data-index="${i}"]`, elements => {
            //         return elements.map(img => img.getAttribute('src')).filter(src => src);
            //     }))[0] as string;
            //     imageUrls.push(img)
            // }
            //
            const thumbCount = await page.$$eval('.lg-thumb-item', elements => elements.length)
            for (let i = 0; i < thumbCount; i++) {
                // await sleep(500);
                await page.click(`.lg-thumb-item[data-lg-item-id="${i}"]`);
                const newImages: string[] = (await page.$$eval('.lg-object.lg-image', elements => elements.map(img => img.getAttribute('src')))) || [];
                // console.log('newImages', newImages)
                // const thumbnailCount = newImages.length;
                // console.log(newImages)
                // imageUrls.push(...newImages);
                newImages.forEach(i => imageUrlsSet.add(i))
            }
            // const newImages: string[] = (await page.$$eval('.lg-object.lg-image', elements => elements.map(img => img.getAttribute('src')))) || [];
            // console.log('newImages', newImages)
            // const thumbnailCount = newImages.length;
            // console.log(newImages)
            // imageUrls.push(...newImages);
            const imageUrls = [...imageUrlsSet];
            const thumbnailCount = imageUrls.length
            console.log(imageUrls);

            // Save images to filesystem
            const imageFilenames: string[] = [];
            const lotImages:string[]  = [];

            // Ensure images directory exists
            const imagesDir = IMAGES_DIR;
            await mkdir(imagesDir, { recursive: true });

            for (let i = 0; i < thumbnailCount; i++) {
                const imageUrl = imageUrls[i];
                const filename = `lot_${lot.lotId}_image_${i + 1}.jpg`;
                const filepath = `${imagesDir}/${filename}`;

                try {
                    const response = await fetch(imageUrl);
                    if (response.ok) {
                        const imageBuffer = await response.arrayBuffer();
                        await writeFile(filepath, new Uint8Array(imageBuffer));
                        imageFilenames.push(filename);
                        // console.log(`Saved image: ${filename}`);
                    }
                } catch (error) {
                    console.error(`Failed to save image ${filename}:`, error);
                    console.log(imageUrl);
                }
            }

            // Add image data to lot
            lot.imageUrls = imageUrls;
            lot.imageFilenames = imageFilenames;
            lot.thumbnailCount = thumbnailCount;

            // Close the lightbox by pressing Escape or clicking close button
            await page.keyboard.press('Escape');

            existingData[lot.lotId] = lot;
            newLots.push(lot);
        } catch (e) {
            lotErrors++;
            console.warn('Error scraping lot: ' + lot?.lotNumber, e)
        }
        console.log(`Thread ${id} finished scraping lot, about to pop next lot`)
        lot = allAuctionLots.pop();
        if (lot) {
            console.log(`Thread ${id} list length: ${allAuctionLots.length}`);
        }
    }
    console.log(`Thread ${id} finished scraping returning`)

    return {
        ignoredCount,
        missingRequirementsCount,
        lotErrors,
        newLots,
    }
}
