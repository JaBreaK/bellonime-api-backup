import path from "path";
import { fileURLToPath } from "url";
const HELPERS_DIR = path.dirname(fileURLToPath(import.meta.url));
const VIEWS_DIR = path.join(HELPERS_DIR, "..", "public", "views");
export function resolveViewPath(fileName) {
    return path.join(VIEWS_DIR, fileName);
}
export const VIEW_FILE = {
    HOME: "home.html",
    DOCS: "docs.html",
    ANIME_SOURCE: "anime-source.html",
};
