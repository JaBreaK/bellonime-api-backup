import { gotScraping } from 'got-scraping';
import { CookieJar } from 'tough-cookie';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
function getLatestCredentials() {
    const credsPath = path.resolve(__dirname, '..', 'credentials.json');
    if (!fs.existsSync(credsPath)) {
        throw new Error('File credentials.json tidak ditemukan di dalam folder src!');
    }
    const rawData = fs.readFileSync(credsPath, 'utf-8');
    return JSON.parse(rawData);
}
function normalizeBody(body) {
    if (typeof body === 'string')
        return body;
    if (Buffer.isBuffer(body))
        return body.toString('utf-8');
    if (typeof body === 'object')
        return JSON.stringify(body);
    return String(body);
}
async function _internalFetch(url, ref, options, useCookie = false) {
    const retries = 3;
    let lastError = null;
    const targetDomain = new URL(url).hostname;
    for (let attempt = 1; attempt <= retries; attempt++) {
        let cookieJar;
        let resolvedUserAgent;
        if (useCookie) {
            const { userAgent, cfCookie } = getLatestCredentials();
            if (!userAgent || !cfCookie || userAgent.includes('GANTI_DENGAN') || cfCookie.includes('GANTI_DENGAN')) {
                throw new Error('Harap isi userAgent dan cfCookie yang valid di dalam src/credentials.json');
            }
            cookieJar = new CookieJar();
            await cookieJar.setCookie(`cf_clearance=${cfCookie}`, `https://${targetDomain}`);
            resolvedUserAgent = userAgent;
        }
        try {
            const startTime = Date.now();
            const response = await gotScraping({
                url,
                ...(cookieJar ? { cookieJar } : {}),
                http2: false,
                retry: { limit: 0 },
                timeout: {
                    request: 5000
                },
                headerGeneratorOptions: {
                    browsers: [{ name: 'chrome' }],
                    operatingSystems: ['windows'],
                },
                ...options,
                headers: {
                    ...(resolvedUserAgent ? { 'User-Agent': resolvedUserAgent } : {}),
                    'Referer': ref,
                    ...options?.headers,
                },
            });
            const body = normalizeBody(response.body);
            const duration = Date.now() - startTime;
            if (duration > 3000) {
                console.warn(`[SLOW FETCH] ${url} took ${duration}ms on attempt ${attempt}`);
            }
            if (response.statusCode === 403) {
                throw new Error(`HTTP 403 – cf_clearance cookie kadaluarsa atau tidak valid. ` +
                    `Perbarui credentials.json dengan cookie baru dari browser.`);
            }
            if (response.statusCode === 200) {
                if (body.includes('<title>Just a moment...</title>')) {
                    lastError = new Error(`Kena challenge Cloudflare di percobaan ke-${attempt}`);
                }
                else {
                    return { ...response, body };
                }
            }
            else {
                lastError = new Error(`HTTP Error ${response.statusCode}`);
            }
        }
        catch (error) {
            if (error.message?.includes('403'))
                throw error;
            console.debug(`[DEBUG] Error at attempt ${attempt}:`, error.message);
            lastError = error;
        }
        if (attempt < retries)
            await new Promise(resolve => setTimeout(resolve, 2000));
    }
    throw new Error(`Gagal fetch setelah ${retries} percobaan. Error: ${lastError?.message}`);
}
export async function belloFetch(url, ref, options, useCookie = false) {
    const response = await _internalFetch(url, ref, options, useCookie);
    return response.body;
}
export async function getFinalUrl(url, ref, options, useCookie = false) {
    const response = await _internalFetch(url, ref, {
        ...options,
        method: 'HEAD',
    }, useCookie);
    return response.url;
}
export async function getFinalUrls(urls, ref, config) {
    const promises = urls.map(url => getFinalUrl(url, ref, config.options, config.useCookie).catch(() => url));
    return Promise.all(promises);
}
