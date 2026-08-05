/**
 * Nilai-nilai konstan yang sebelumnya tersebar (hardcoded) di berbagai file.
 * Dikumpulkan di sini agar mudah di-tuning tanpa menyentuh business logic.
 */

/** Konfigurasi HTTP fetch ke situs sumber. */
export const FETCH = {
  /** Jumlah maksimal percobaan request sebelum menyerah. */
  MAX_RETRIES: 3,
  /** Jeda antar percobaan (ms). */
  RETRY_DELAY_MS: 2000,
  /** Batas waktu satu request (ms). */
  REQUEST_TIMEOUT_MS: 5000,
  /** Request yang melebihi durasi ini akan dicatat sebagai lambat (ms). */
  SLOW_REQUEST_THRESHOLD_MS: 3000,
  /** Timeout khusus saat me-resolve banyak URL sekaligus (ms). */
  RESOLVE_URL_TIMEOUT_MS: 10000,
} as const;

/** Penanda placeholder yang wajib diganti di `src/credentials.json`. */
export const CREDENTIALS_PLACEHOLDER = "GANTI_DENGAN";

/** Potongan HTML yang menandakan halaman challenge Cloudflare. */
export const CLOUDFLARE_CHALLENGE_TITLE = "<title>Just a moment...</title>";

/** TTL cache server per jenis rute (dalam menit). */
export const CACHE_TTL_MINUTES = {
  /** Data statis seperti daftar rute / genre. */
  STATIC: undefined,
  /** Listing yang sering berubah (home, ongoing, search, dll). */
  LISTING: 10,
  /** Detail anime, episode, dan batch. */
  DETAIL: 30,
  /** Link server streaming yang cepat kadaluarsa. */
  STREAM: 3,
} as const;

/** Cache-Control max-age default untuk client (dalam menit). */
export const CLIENT_CACHE_MAX_AGE_MINUTES = 1;

/** Pesan error yang dipakai berulang kali. */
export const ERROR_MESSAGE = {
  NOT_FOUND_DATA: "data tidak ditemukan",
  NOT_FOUND_PAGE: "halaman tidak ditemukan",
  INTERNAL: "Internal Server Error",
} as const;

/** Nilai default saat tag iframe tidak ditemukan pada HTML sumber. */
export const NO_IFRAME_FOUND = "No iframe found";
