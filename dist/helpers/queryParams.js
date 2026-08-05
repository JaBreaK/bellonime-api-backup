import { setResponseError } from "./error.js";
const VALID_ORDERS = ["title", "title-reverse", "update", "latest", "popular"];
const DEFAULT_ORDER = "title";
const DEFAULT_PAGE = 1;
function buildErrorMessage(key, validValues) {
    return `masukkan query parameter: ?${key}=${validValues.join("|")}`;
}
export function getOrderParam(req) {
    const { order } = req.query;
    if (typeof order !== "string")
        return DEFAULT_ORDER;
    if (!VALID_ORDERS.includes(order)) {
        setResponseError(400, buildErrorMessage("order", VALID_ORDERS));
    }
    return order === "title-reverse" ? "titlereverse" : order;
}
export function getPageParam(req) {
    const rawPage = req.query.page;
    const errorMessage = buildErrorMessage("page", ["number +"]);
    if (rawPage !== undefined && isNaN(Number(rawPage))) {
        setResponseError(400, errorMessage);
    }
    const page = Number(rawPage) || DEFAULT_PAGE;
    if (page < 1)
        setResponseError(400, errorMessage);
    return page;
}
export function getQParam(req) {
    const { q } = req.query;
    if (q === undefined)
        setResponseError(400, buildErrorMessage("q", ["string"]));
    return typeof q === "string" ? q : "";
}
export function getUrlParam(req) {
    const { url } = req.query;
    if (!url)
        setResponseError(400, buildErrorMessage("url", ["string"]));
    return typeof url === "string" ? url : "";
}
