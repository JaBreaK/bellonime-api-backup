import { load } from "cheerio";
import { belloFetch } from "../services/dataFetcher.js";
import animeConfig from "../configs/animeConfig.js";
import path from "path";
import { setResponseError } from "../helpers/error.js";
export default class AnimeScraper {
    baseUrl;
    baseUrlPath;
    useCookie;
    constructor(baseUrl, baseUrlPath, useCookie = false) {
        this.baseUrl = this.generateBaseUrl(baseUrl);
        this.baseUrlPath = this.generateUrlPath([baseUrlPath]);
        this.useCookie = useCookie;
    }
    deepCopy(obj) {
        if (obj === null || typeof obj !== "object")
            return obj;
        if (Array.isArray(obj)) {
            return obj.map((item) => this.deepCopy(item));
        }
        const result = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                result[key] = this.deepCopy(obj[key]);
            }
        }
        return result;
    }
    generateBaseUrl(baseUrl) {
        let hapusDariBelakang = true;
        while (hapusDariBelakang) {
            if (baseUrl[baseUrl.length - 1] === "/") {
                baseUrl = baseUrl.slice(0, baseUrl.length - 1);
            }
            else {
                hapusDariBelakang = false;
            }
        }
        return baseUrl;
    }
    generateUrlPath(paths) {
        let urlPath = path.join("/", ...paths).replace(/\\/g, "/");
        let hapusDariBelakang = true;
        while (hapusDariBelakang) {
            if (urlPath.endsWith("/")) {
                urlPath = urlPath.slice(0, -1);
            }
            else {
                hapusDariBelakang = false;
            }
        }
        return urlPath;
    }
    generateUrl(baseUrl, urlOrPath) {
        if (urlOrPath) {
            if (urlOrPath.includes(baseUrl)) {
                baseUrl = baseUrl + urlOrPath.replace(baseUrl, "");
            }
            if (!urlOrPath.includes(baseUrl)) {
                if (urlOrPath.startsWith("/")) {
                    baseUrl = baseUrl + urlOrPath;
                }
            }
        }
        return baseUrl;
    }
    str(string) {
        return string?.trim() || "";
    }
    num(string) {
        return Number(string?.trim()) || null;
    }
    generateSlug(url) {
        if (typeof url !== "string")
            return "";
        const urlArr = url.split("/").filter((url) => url !== "");
        return urlArr[urlArr.length - 1]?.trim() || "";
    }
    generateSourceUrl(urlOrPath) {
        if (animeConfig.response.sourceUrl) {
            return this.generateUrl(this.baseUrl, urlOrPath);
        }
        return undefined;
    }
    generateHref(...paths) {
        if (animeConfig.response.href) {
            return this.generateUrlPath([this.baseUrlPath, ...paths]);
        }
        return undefined;
    }
    generateSrcFromIframeTag(html) {
        const iframeMatch = html?.match(/<iframe[^>]+src="([^"]+)"/i);
        const src = iframeMatch ? iframeMatch[1] : "No iframe found";
        return src;
    }
    toCamelCase(str) {
        return str
            .split(" ")
            .map((item, index) => {
            if (index === 0) {
                item = item.toLowerCase();
            }
            else {
                item = item[0].toUpperCase() + item.slice(1);
            }
            return item;
        })
            .join(" ")
            .replace(/[!@#$%^&*]| /g, "");
    }
    checkEmptyData(errorCondition) {
        if (errorCondition)
            setResponseError(404, "data tidak ditemukan");
    }
    enrawr(input) {
        let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let shift = 5;
        let encoded = "";
        for (let i = 0; i < input.length; i++) {
            let char = input[i];
            let index = chars.indexOf(char);
            if (index !== -1) {
                let newIndex = (index + shift) % chars.length;
                encoded += chars[newIndex];
            }
            else {
                encoded += char;
            }
        }
        return encoded;
    }
    derawr(enrawr) {
        let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let shift = 5;
        let decoded = "";
        for (let i = 0; i < enrawr.length; i++) {
            let char = enrawr[i];
            let index = chars.indexOf(char);
            if (index !== -1) {
                let newIndex = (index - shift + chars.length) % chars.length;
                decoded += chars[newIndex];
            }
            else {
                decoded += char;
            }
        }
        return decoded;
    }
    async scrape(props, parser) {
        const path = this.generateUrlPath([props.path]);
        const htmlData = await belloFetch(this.baseUrl + path, this.baseUrl, {
            method: "GET",
            responseType: "text",
            ...props.axiosConfig,
        }, this.useCookie);
        const $ = load(htmlData);
        const data = parser($, this.deepCopy(props.initialData));
        return data;
    }
}
