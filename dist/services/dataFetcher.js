import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { gotScraping } from "got-scraping";
import { CookieJar } from "tough-cookie";
import { CLOUDFLARE_CHALLENGE_TITLE, CREDENTIALS_PLACEHOLDER, FETCH, } from "../configs/constants.js";
const SERVICES_DIR = path.dirname(fileURLToPath(import.meta.url));
const CREDENTIALS_PATH = path.resolve(SERVICES_DIR, "..", "credentials.json");
function readCredentials() {
    if (!fs.existsSync(CREDENTIALS_PATH)) {
        throw new Error("File credentials.json tidak ditemukan di dalam folder src!");
    }
    return JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf-8"));
}
function isPlaceholder(value) {
    return !value || value.includes(CREDENTIALS_PLACEHOLDER);
}
function normalizeBody(body) {
    if (typeof body === "string")
        return body;
    if (Buffer.isBuffer(body))
        return body.toString("utf-8");
    if (typeof body === "object")
        return JSON.stringify(body);
    return String(body);
}
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
async function buildCloudflareSession(targetDomain) {
    const { userAgent, cfCookie } = readCredentials();
    if (isPlaceholder(userAgent) || isPlaceholder(cfCookie)) {
        throw new Error("Harap isi userAgent dan cfCookie yang valid di dalam src/credentials.json");
    }
    const cookieJar = new CookieJar();
    await cookieJar.setCookie(`cf_clearance=${cfCookie}`, `https://${targetDomain}`);
    return { cookieJar, userAgent };
}
function buildRequestOptions(url, referer, options, session) {
    return {
        url,
        ...(session ? { cookieJar: session.cookieJar } : {}),
        http2: false,
        retry: { limit: 0 },
        timeout: { request: FETCH.REQUEST_TIMEOUT_MS },
        headerGeneratorOptions: {
            browsers: [{ name: "chrome" }],
            operatingSystems: ["windows"],
        },
        ...options,
        headers: {
            ...(session ? { "User-Agent": session.userAgent } : {}),
            Referer: referer,
            ...options?.headers,
        },
    };
}
async function requestOnce(url, referer, options, useCookie, targetDomain) {
    const session = useCookie ? await buildCloudflareSession(targetDomain) : undefined;
    const startTime = Date.now();
    const response = await gotScraping(buildRequestOptions(url, referer, options, session));
    const body = normalizeBody(response.body);
    const duration = Date.now() - startTime;
    if (duration > FETCH.SLOW_REQUEST_THRESHOLD_MS) {
        console.warn(`[SLOW FETCH] ${url} took ${duration}ms`);
    }
    if (response.statusCode === 403) {
        throw new Error("HTTP 403 – cf_clearance cookie kadaluarsa atau tidak valid. " +
            "Perbarui credentials.json dengan cookie baru dari browser.");
    }
    if (response.statusCode !== 200) {
        throw new Error(`HTTP Error ${response.statusCode}`);
    }
    if (body.includes(CLOUDFLARE_CHALLENGE_TITLE)) {
        throw new Error("Kena challenge Cloudflare");
    }
    return { ...response, body };
}
async function fetchWithRetry(url, referer, options, useCookie = false) {
    const targetDomain = new URL(url).hostname;
    let lastError = null;
    for (let attempt = 1; attempt <= FETCH.MAX_RETRIES; attempt++) {
        try {
            return await requestOnce(url, referer, options, useCookie, targetDomain);
        }
        catch (error) {
            const failure = error instanceof Error ? error : new Error(String(error));
            if (failure.message.includes("403"))
                throw failure;
            console.debug(`[DEBUG] Error at attempt ${attempt}:`, failure.message);
            lastError = failure;
        }
        if (attempt < FETCH.MAX_RETRIES)
            await delay(FETCH.RETRY_DELAY_MS);
    }
    throw new Error(`Gagal fetch setelah ${FETCH.MAX_RETRIES} percobaan. Error: ${lastError?.message}`);
}
export async function belloFetch(url, referer, options, useCookie = false) {
    const response = await fetchWithRetry(url, referer, options, useCookie);
    return response.body;
}
export async function getFinalUrl(url, referer, options, useCookie = false) {
    const response = await fetchWithRetry(url, referer, { ...options, method: "HEAD" }, useCookie);
    return response.url;
}
export function getFinalUrls(urls, referer, config) {
    return Promise.all(urls.map((url) => getFinalUrl(url, referer, config.options, config.useCookie).catch(() => url)));
}
