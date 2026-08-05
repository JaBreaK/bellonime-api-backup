import path from "path";

import { load, type CheerioAPI } from "cheerio";
import type { Options } from "got-scraping";

import animeConfig from "@configs/animeConfig.js";
import { ERROR_MESSAGE, NO_IFRAME_FOUND } from "@configs/constants.js";
import { setResponseError } from "@helpers/error.js";
import { belloFetch } from "@services/dataFetcher.js";

/** Alfabet yang dipakai cipher `encodeId` / `decodeId`. */
const CIPHER_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const CIPHER_SHIFT = 5;
const IFRAME_SRC_PATTERN = /<iframe[^>]+src="([^"]+)"/i;

interface ScrapeProps<T> {
  path: string;
  initialData: T;
  axiosConfig?: Options;
}

type ScrapeParser<T> = ($: CheerioAPI, data: T) => Promise<T>;

/**
 * Base class untuk seluruh parser sumber anime.
 * Menyediakan utilitas pembentuk URL, normalisasi nilai, dan alur scrape
 * (fetch HTML → load Cheerio → jalankan parser).
 */
export default class AnimeScraper {
  protected baseUrl: string;
  protected baseUrlPath: string;
  protected useCookie: boolean;

  constructor(baseUrl: string, baseUrlPath: string, useCookie = false) {
    this.baseUrl = AnimeScraper.stripTrailingSlashes(baseUrl);
    this.baseUrlPath = this.joinUrlPath([baseUrlPath]);
    this.useCookie = useCookie;
  }

  /** Menghapus semua garis miring di akhir string. */
  private static stripTrailingSlashes(value: string): string {
    return value.replace(/\/+$/, "");
  }

  private deepCopy<T>(value: T): T {
    return structuredClone(value);
  }

  private joinUrlPath(paths: string[]): string {
    const urlPath = path.join("/", ...paths).replace(/\\/g, "/");

    return AnimeScraper.stripTrailingSlashes(urlPath);
  }

  private joinBaseUrl(baseUrl: string, urlOrPath?: string): string {
    if (!urlOrPath) return baseUrl;

    if (urlOrPath.includes(baseUrl)) {
      return baseUrl + urlOrPath.replace(baseUrl, "");
    }

    if (urlOrPath.startsWith("/")) {
      return baseUrl + urlOrPath;
    }

    return baseUrl;
  }

  /** Membersihkan string dari spasi berlebih; `undefined` menjadi string kosong. */
  protected str(value?: string): string {
    return value?.trim() || "";
  }

  /** Mengubah string menjadi angka; nilai tidak valid / nol menjadi `null`. */
  protected num(value?: string): number | null {
    return Number(value?.trim()) || null;
  }

  /** Mengambil segmen terakhir sebuah URL sebagai slug. */
  protected generateSlug(url?: string): string {
    if (typeof url !== "string") return "";

    const segments = url.split("/").filter(Boolean);

    return segments.at(-1)?.trim() || "";
  }

  /** URL sumber asli; dikembalikan hanya jika diaktifkan lewat config. */
  protected generateSourceUrl(urlOrPath?: string): string | undefined {
    if (!animeConfig.response.sourceUrl) return undefined;

    return this.joinBaseUrl(this.baseUrl, urlOrPath);
  }

  /** Path internal API; dikembalikan hanya jika diaktifkan lewat config. */
  protected generateHref(...paths: string[]): string | undefined {
    if (!animeConfig.response.href) return undefined;

    return this.joinUrlPath([this.baseUrlPath, ...paths]);
  }

  /** Mengekstrak atribut `src` dari tag iframe pertama pada sebuah HTML. */
  protected generateSrcFromIframeTag(html?: string): string {
    return html?.match(IFRAME_SRC_PATTERN)?.[1] ?? NO_IFRAME_FOUND;
  }

  /** Mengubah label sumber (mis. "Total Episode") menjadi key camelCase. */
  protected toCamelCase(value: string): string {
    return value
      .split(" ")
      .map((word, index) =>
        index === 0 ? word.toLowerCase() : `${word.charAt(0).toUpperCase()}${word.slice(1)}`
      )
      .join(" ")
      .replace(/[!@#$%^&*]| /g, "");
  }

  /** Melempar 404 bila hasil scrape dianggap kosong. */
  protected checkEmptyData(isEmpty: boolean): void {
    if (isEmpty) setResponseError(404, ERROR_MESSAGE.NOT_FOUND_DATA);
  }

  /** Caesar cipher sederhana untuk menyamarkan id server sumber. */
  private static shiftCharacters(input: string, shift: number): string {
    let output = "";

    for (const char of input) {
      const index = CIPHER_ALPHABET.indexOf(char);

      if (index === -1) {
        output += char;
        continue;
      }

      const length = CIPHER_ALPHABET.length;

      output += CIPHER_ALPHABET[(index + shift + length) % length];
    }

    return output;
  }

  /** Menyandikan id server agar tidak terekspos apa adanya. */
  protected enrawr(input: string): string {
    return AnimeScraper.shiftCharacters(input, CIPHER_SHIFT);
  }

  /** Kebalikan dari {@link enrawr}. */
  protected derawr(input: string): string {
    return AnimeScraper.shiftCharacters(input, -CIPHER_SHIFT);
  }

  /** Mengambil halaman sumber lalu menjalankan parser Cheerio di atasnya. */
  protected async scrape<T>(props: ScrapeProps<T>, parser: ScrapeParser<T>): Promise<T> {
    const targetPath = this.joinUrlPath([props.path]);

    const html = await belloFetch(
      this.baseUrl + targetPath,
      this.baseUrl,
      {
        method: "GET",
        responseType: "text",
        ...props.axiosConfig,
      } as unknown as Options,
      this.useCookie
    );

    return parser(load(html), this.deepCopy(props.initialData));
  }
}
