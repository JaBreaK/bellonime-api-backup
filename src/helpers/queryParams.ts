import type { Request } from "express";

import { setResponseError } from "./error.js";

const VALID_ORDERS = ["title", "title-reverse", "update", "latest", "popular"] as const;
const DEFAULT_ORDER = "title";
const DEFAULT_PAGE = 1;

function buildErrorMessage(key: string, validValues: readonly string[]): string {
  return `masukkan query parameter: ?${key}=${validValues.join("|")}`;
}

/** Query `?order=`; nilai tidak valid menghasilkan 400. */
export function getOrderParam(req: Request): string {
  const { order } = req.query;

  if (typeof order !== "string") return DEFAULT_ORDER;

  if (!VALID_ORDERS.includes(order as (typeof VALID_ORDERS)[number])) {
    setResponseError(400, buildErrorMessage("order", VALID_ORDERS));
  }

  return order === "title-reverse" ? "titlereverse" : order;
}

/** Query `?page=`; harus berupa angka positif. */
export function getPageParam(req: Request): number {
  const rawPage = req.query.page;
  const errorMessage = buildErrorMessage("page", ["number +"]);

  if (rawPage !== undefined && isNaN(Number(rawPage))) {
    setResponseError(400, errorMessage);
  }

  const page = Number(rawPage) || DEFAULT_PAGE;

  if (page < 1) setResponseError(400, errorMessage);

  return page;
}

/** Query `?q=`; wajib ada. */
export function getQParam(req: Request): string {
  const { q } = req.query;

  if (q === undefined) setResponseError(400, buildErrorMessage("q", ["string"]));

  return typeof q === "string" ? q : "";
}

/** Query `?url=`; wajib ada dan tidak boleh kosong. */
export function getUrlParam(req: Request): string {
  const { url } = req.query;

  if (!url) setResponseError(400, buildErrorMessage("url", ["string"]));

  return typeof url === "string" ? url : "";
}
