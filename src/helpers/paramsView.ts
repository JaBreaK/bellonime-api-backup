import type { QueryParam, RouteParam } from "@interfaces/IGlobal.js";

/** Membuat definisi query param wajib bertipe string. */
function requiredStringQuery(key: string): QueryParam {
  return { key, value: { default: false, required: true, type: "string" } };
}

/** Membuat definisi route param wajib bertipe string. */
function requiredStringRoute(placeholder: string): RouteParam {
  return { placeholder, value: { default: false, required: true, type: "string" } };
}

export const qQueryParam = requiredStringQuery("q");

export const pageQueryParam: QueryParam = {
  key: "page",
  value: { default: 1, required: false, type: "number" },
};

export const animeIdRouteParam = requiredStringRoute("animeId");
export const genreIdRouteParam = requiredStringRoute("genreId");
export const episodeIdRouteParam = requiredStringRoute("episodeId");
export const serverIdRouteParam = requiredStringRoute("serverId");
export const batchIdRouteParam = requiredStringRoute("batchId");
