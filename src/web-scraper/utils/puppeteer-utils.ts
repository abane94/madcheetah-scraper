import { type Browser, type LaunchOptions, type Page, launch } from "puppeteer";
import { CHROME_PATH } from "../../env";

export async function startBrowser(): Promise<Browser> {
    const isProd = process.env.NODE_ENV === 'production'
    try {
        const browser = await launch({
            headless: isProd,
            ignoreHTTPSErrors: true,
            ...(isProd && {executablePath: CHROME_PATH})
        } as any as LaunchOptions);
        return browser;
    } catch (e) {
        console.log(e);
        throw e
    }
}

export async function navigateToPage(page: Page, url: string): Promise<void> {
    await page.goto(url, { waitUntil: "networkidle2" });
}

export async function closeBrowser(browser: Browser): Promise<void> {
    await browser.close();
}


export const sleep = async (ms: number) => new Promise(res => setTimeout(res, ms));
