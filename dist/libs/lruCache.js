import { LRUCache } from "lru-cache";
const SIX_HOURS_IN_MS = 1000 * 60 * 60 * 6;
const MAX_CACHED_ENTRIES = 80;
export const defaultTTL = SIX_HOURS_IN_MS;
export const cache = new LRUCache({
    max: MAX_CACHED_ENTRIES,
    allowStale: false,
    updateAgeOnGet: false,
    updateAgeOnHas: false,
    ttl: defaultTTL,
});
