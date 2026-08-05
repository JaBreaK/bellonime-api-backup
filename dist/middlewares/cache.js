import path from "path";
import { CLIENT_CACHE_MAX_AGE_MINUTES } from "../configs/constants.js";
import { cache, defaultTTL } from "../libs/lruCache.js";
const MINUTE_IN_MS = 1000 * 60;
function buildCacheKey(req) {
    return path.join(req.originalUrl, "/").replace(/\\/g, "/");
}
function sendCached(res, cached) {
    if (typeof cached === "object")
        return res.json(cached);
    if (typeof cached === "string")
        return res.send(cached);
    return res.send(String(cached));
}
function captureJsonResponse(res, key, ttl) {
    const originalJson = res.json.bind(res);
    res.json = (body) => {
        if (res.statusCode < 399 && body.ok) {
            cache.set(key, body, { ttl });
        }
        return originalJson(body);
    };
}
function captureTextResponse(res, key, ttl) {
    const originalSend = res.send.bind(res);
    res.send = (body) => {
        if (res.statusCode < 399) {
            cache.set(key, body, { ttl });
        }
        return originalSend(body);
    };
}
export function serverCache(ttl, responseType = "json") {
    return (req, res, next) => {
        const key = buildCacheKey(req);
        const cached = cache.get(key);
        if (cached)
            return sendCached(res, cached);
        const resolvedTTL = ttl ? MINUTE_IN_MS * ttl : defaultTTL;
        if (responseType === "json") {
            captureJsonResponse(res, key, resolvedTTL);
        }
        else {
            captureTextResponse(res, key, resolvedTTL);
        }
        next();
    };
}
export function clientCache(maxAge = CLIENT_CACHE_MAX_AGE_MINUTES) {
    const maxAgeInSeconds = maxAge * 60;
    return (_req, res, next) => {
        res.setHeader("Cache-Control", `public, max-age=${maxAgeInSeconds}`);
        next();
    };
}
