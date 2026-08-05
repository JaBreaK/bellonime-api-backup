function requiredStringQuery(key) {
    return { key, value: { default: false, required: true, type: "string" } };
}
function requiredStringRoute(placeholder) {
    return { placeholder, value: { default: false, required: true, type: "string" } };
}
export const qQueryParam = requiredStringQuery("q");
export const pageQueryParam = {
    key: "page",
    value: { default: 1, required: false, type: "number" },
};
export const animeIdRouteParam = requiredStringRoute("animeId");
export const genreIdRouteParam = requiredStringRoute("genreId");
export const episodeIdRouteParam = requiredStringRoute("episodeId");
export const serverIdRouteParam = requiredStringRoute("serverId");
export const batchIdRouteParam = requiredStringRoute("batchId");
