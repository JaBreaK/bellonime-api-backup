export const FETCH = {
    MAX_RETRIES: 3,
    RETRY_DELAY_MS: 2000,
    REQUEST_TIMEOUT_MS: 5000,
    SLOW_REQUEST_THRESHOLD_MS: 3000,
    RESOLVE_URL_TIMEOUT_MS: 10000,
};
export const CREDENTIALS_PLACEHOLDER = "GANTI_DENGAN";
export const CLOUDFLARE_CHALLENGE_TITLE = "<title>Just a moment...</title>";
export const CACHE_TTL_MINUTES = {
    STATIC: undefined,
    LISTING: 10,
    DETAIL: 30,
    STREAM: 3,
};
export const CLIENT_CACHE_MAX_AGE_MINUTES = 1;
export const ERROR_MESSAGE = {
    NOT_FOUND_DATA: "data tidak ditemukan",
    NOT_FOUND_PAGE: "halaman tidak ditemukan",
    INTERNAL: "Internal Server Error",
};
export const NO_IFRAME_FOUND = "No iframe found";
