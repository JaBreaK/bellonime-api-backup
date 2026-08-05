import path from "path";
import { load } from "cheerio";
import animeConfig from "../configs/animeConfig.js";
import { ERROR_MESSAGE, NO_IFRAME_FOUND } from "../configs/constants.js";
import { setResponseError } from "../helpers/error.js";
import { belloFetch } from "../services/dataFetcher.js";
const CIPHER_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const CIPHER_SHIFT = 5;
const IFRAME_SRC_PATTERN = /<iframe[^>]+src="([^"]+)"/i;
export default class AnimeScraper {
    baseUrl;
    baseUrlPath;
    useCookie;
    constructor(baseUrl, baseUrlPath, useCookie = false) {
        this.baseUrl = AnimeScraper.stripTrailingSlashes(baseUrl);
        this.baseUrlPath = this.joinUrlPath([baseUrlPath]);
        this.useCookie = useCookie;
    }
    static stripTrailingSlashes(value) {
        return value.replace(/\/+$/, "");
    }
    deepCopy(value) {
        return structuredClone(value);
    }
    joinUrlPath(paths) {
        const urlPath = path.join("/", ...paths).replace(/\\/g, "/");
        return AnimeScraper.stripTrailingSlashes(urlPath);
    }
    joinBaseUrl(baseUrl, urlOrPath) {
        if (!urlOrPath)
            return baseUrl;
        if (urlOrPath.includes(baseUrl)) {
            return baseUrl + urlOrPath.replace(baseUrl, "");
        }
        if (urlOrPath.startsWith("/")) {
            return baseUrl + urlOrPath;
        }
        return baseUrl;
    }
    str(value) {
        return value?.trim() || "";
    }
    num(value) {
        return Number(value?.trim()) || null;
    }
    generateSlug(url) {
        if (typeof url !== "string")
            return "";
        const segments = url.split("/").filter(Boolean);
        return segments.at(-1)?.trim() || "";
    }
    generateSourceUrl(urlOrPath) {
        if (!animeConfig.response.sourceUrl)
            return undefined;
        return this.joinBaseUrl(this.baseUrl, urlOrPath);
    }
    generateHref(...paths) {
        if (!animeConfig.response.href)
            return undefined;
        return this.joinUrlPath([this.baseUrlPath, ...paths]);
    }
    generateSrcFromIframeTag(html) {
        return html?.match(IFRAME_SRC_PATTERN)?.[1] ?? NO_IFRAME_FOUND;
    }
    toCamelCase(value) {
        return value
            .split(" ")
            .map((word, index) => index === 0 ? word.toLowerCase() : `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
            .join(" ")
            .replace(/[!@#$%^&*]| /g, "");
    }
    checkEmptyData(isEmpty) {
        if (isEmpty)
            setResponseError(404, ERROR_MESSAGE.NOT_FOUND_DATA);
    }
    static shiftCharacters(input, shift) {
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
    enrawr(input) {
        return AnimeScraper.shiftCharacters(input, CIPHER_SHIFT);
    }
    derawr(input) {
        return AnimeScraper.shiftCharacters(input, -CIPHER_SHIFT);
    }
    async scrape(props, parser) {
        const targetPath = this.joinUrlPath([props.path]);
        const html = await belloFetch(this.baseUrl + targetPath, this.baseUrl, {
            method: "GET",
            responseType: "text",
            ...props.axiosConfig,
        }, this.useCookie);
        return parser(load(html), this.deepCopy(props.initialData));
    }
}
