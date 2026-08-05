import type { NextFunction, Request, Response } from "express";
import path from "path";

import { CLIENT_CACHE_MAX_AGE_MINUTES } from "@configs/constants.js";
import type { Payload } from "@helpers/payload.js";
import { cache, defaultTTL } from "@libs/lruCache.js";

type ResponseType = "json" | "text";

const MINUTE_IN_MS = 1000 * 60;

function buildCacheKey(req: Request): string {
  return path.join(req.originalUrl, "/").replace(/\\/g, "/");
}

function sendCached(res: Response, cached: unknown): Response {
  if (typeof cached === "object") return res.json(cached);
  if (typeof cached === "string") return res.send(cached);

  return res.send(String(cached));
}

/** Merekam response sukses ke cache tanpa mengubah isi yang dikirim ke client. */
function captureJsonResponse(res: Response, key: string, ttl: number): void {
  const originalJson = res.json.bind(res);

  res.json = (body: Payload) => {
    if (res.statusCode < 399 && body.ok) {
      cache.set(key, body, { ttl });
    }

    return originalJson(body);
  };
}

function captureTextResponse(res: Response, key: string, ttl: number): void {
  const originalSend = res.send.bind(res);

  res.send = (body: {}) => {
    if (res.statusCode < 399) {
      cache.set(key, body, { ttl });
    }

    return originalSend(body);
  };
}

/**
 * Cache response di sisi server memakai LRU cache.
 *
 * @param ttl umur cache dalam menit; memakai TTL default bila tidak diisi
 * @param responseType bentuk response yang di-cache
 */
export function serverCache(ttl?: number, responseType: ResponseType = "json") {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = buildCacheKey(req);
    const cached = cache.get(key);

    if (cached) return sendCached(res, cached);

    const resolvedTTL = ttl ? MINUTE_IN_MS * ttl : defaultTTL;

    if (responseType === "json") {
      captureJsonResponse(res, key, resolvedTTL);
    } else {
      captureTextResponse(res, key, resolvedTTL);
    }

    next();
  };
}

/**
 * Menetapkan header `Cache-Control` agar client ikut meng-cache response.
 *
 * @param maxAge umur cache dalam menit
 */
export function clientCache(maxAge: number = CLIENT_CACHE_MAX_AGE_MINUTES) {
  const maxAgeInSeconds = maxAge * 60;

  return (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Cache-Control", `public, max-age=${maxAgeInSeconds}`);

    next();
  };
}
