import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { gotScraping, type Options } from "got-scraping";
import { CookieJar } from "tough-cookie";

import {
  CLOUDFLARE_CHALLENGE_TITLE,
  CREDENTIALS_PLACEHOLDER,
  FETCH,
} from "@configs/constants.js";

interface Credentials {
  userAgent: string;
  cfCookie: string;
}

/** Bagian response yang benar-benar dipakai aplikasi. */
interface FetchResponse {
  body: string;
  url: string;
  statusCode: number;
}

const SERVICES_DIR = path.dirname(fileURLToPath(import.meta.url));
const CREDENTIALS_PATH = path.resolve(SERVICES_DIR, "..", "credentials.json");

function readCredentials(): Credentials {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error("File credentials.json tidak ditemukan di dalam folder src!");
  }

  return JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf-8")) as Credentials;
}

function isPlaceholder(value?: string): boolean {
  return !value || value.includes(CREDENTIALS_PLACEHOLDER);
}

function normalizeBody(body: unknown): string {
  if (typeof body === "string") return body;
  if (Buffer.isBuffer(body)) return body.toString("utf-8");
  if (typeof body === "object") return JSON.stringify(body);

  return String(body);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Menyiapkan cookie jar Cloudflare dari credentials.json.
 *
 * Credentials sengaja dibaca ulang setiap percobaan supaya perubahan dari luar
 * (misalnya script pembaru cookie) langsung terpakai tanpa restart server.
 */
async function buildCloudflareSession(targetDomain: string) {
  const { userAgent, cfCookie } = readCredentials();

  if (isPlaceholder(userAgent) || isPlaceholder(cfCookie)) {
    throw new Error(
      "Harap isi userAgent dan cfCookie yang valid di dalam src/credentials.json"
    );
  }

  const cookieJar = new CookieJar();

  await cookieJar.setCookie(`cf_clearance=${cfCookie}`, `https://${targetDomain}`);

  return { cookieJar, userAgent };
}

function buildRequestOptions(
  url: string,
  referer: string,
  options: Options | undefined,
  session: { cookieJar: CookieJar; userAgent: string } | undefined
) {
  return {
    url,
    ...(session ? { cookieJar: session.cookieJar } : {}),
    http2: false, // MATIKAN HTTP2 MENCEGAH STUCK TIMEOUT
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

async function requestOnce(
  url: string,
  referer: string,
  options: Options | undefined,
  useCookie: boolean,
  targetDomain: string
): Promise<FetchResponse> {
  const session = useCookie ? await buildCloudflareSession(targetDomain) : undefined;
  const startTime = Date.now();

  const response = await gotScraping(
    buildRequestOptions(url, referer, options, session) as never
  );
  const body = normalizeBody(response.body);
  const duration = Date.now() - startTime;

  if (duration > FETCH.SLOW_REQUEST_THRESHOLD_MS) {
    console.warn(`[SLOW FETCH] ${url} took ${duration}ms`);
  }

  // 403 = sesi Cloudflare kadaluarsa. Mengulang dengan cookie yang sama tidak
  // akan pernah berhasil, jadi langsung gagalkan dengan pesan yang jelas.
  if (response.statusCode === 403) {
    throw new Error(
      "HTTP 403 – cf_clearance cookie kadaluarsa atau tidak valid. " +
        "Perbarui credentials.json dengan cookie baru dari browser."
    );
  }

  if (response.statusCode !== 200) {
    throw new Error(`HTTP Error ${response.statusCode}`);
  }

  if (body.includes(CLOUDFLARE_CHALLENGE_TITLE)) {
    throw new Error("Kena challenge Cloudflare");
  }

  return { ...response, body } as unknown as FetchResponse;
}

async function fetchWithRetry(
  url: string,
  referer: string,
  options?: Options,
  useCookie = false
): Promise<FetchResponse> {
  const targetDomain = new URL(url).hostname;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= FETCH.MAX_RETRIES; attempt++) {
    try {
      return await requestOnce(url, referer, options, useCookie, targetDomain);
    } catch (error) {
      const failure = error instanceof Error ? error : new Error(String(error));

      // Error non-retriable diteruskan langsung.
      if (failure.message.includes("403")) throw failure;

      console.debug(`[DEBUG] Error at attempt ${attempt}:`, failure.message);
      lastError = failure;
    }

    if (attempt < FETCH.MAX_RETRIES) await delay(FETCH.RETRY_DELAY_MS);
  }

  throw new Error(
    `Gagal fetch setelah ${FETCH.MAX_RETRIES} percobaan. Error: ${lastError?.message}`
  );
}

/** Mengambil body HTML/JSON dari sebuah URL sumber. */
export async function belloFetch(
  url: string,
  referer: string,
  options?: Options,
  useCookie = false
): Promise<string> {
  const response = await fetchWithRetry(url, referer, options, useCookie);

  return response.body;
}

/** Mengikuti redirect sebuah URL dan mengembalikan URL akhirnya. */
export async function getFinalUrl(
  url: string,
  referer: string,
  options?: Options,
  useCookie = false
): Promise<string> {
  const response = await fetchWithRetry(
    url,
    referer,
    { ...options, method: "HEAD" } as unknown as Options,
    useCookie
  );

  return response.url;
}

/**
 * Versi paralel dari {@link getFinalUrl}. URL yang gagal di-resolve
 * dikembalikan apa adanya agar hasil tetap sejajar dengan input.
 */
export function getFinalUrls(
  urls: string[],
  referer: string,
  config: { options?: Options; useCookie?: boolean }
): Promise<string[]> {
  return Promise.all(
    urls.map((url) =>
      getFinalUrl(url, referer, config.options, config.useCookie).catch(() => url)
    )
  );
}
