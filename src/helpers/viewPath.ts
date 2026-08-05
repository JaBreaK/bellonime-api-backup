import path from "path";
import { fileURLToPath } from "url";

const HELPERS_DIR = path.dirname(fileURLToPath(import.meta.url));
const VIEWS_DIR = path.join(HELPERS_DIR, "..", "public", "views");

/**
 * Menghasilkan absolute path ke sebuah file view di `public/views`.
 * Dipakai bersama oleh main controller maupun controller tiap sumber anime,
 * sehingga perhitungan `../../..` yang rapuh tidak perlu diulang-ulang.
 */
export function resolveViewPath(fileName: string): string {
  return path.join(VIEWS_DIR, fileName);
}

export const VIEW_FILE = {
  HOME: "home.html",
  DOCS: "docs.html",
  ANIME_SOURCE: "anime-source.html",
} as const;
