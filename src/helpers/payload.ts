import type { Response } from "express";
import http from "http";

export interface Pagination {
  currentPage?: number;
  totalPages?: number;
  hasPrevPage?: boolean;
  prevPage?: number | null;
  hasNextPage?: boolean;
  nextPage?: number | null;
}

export interface PayloadProps<T = unknown> {
  message?: string;
  data?: T;
  pagination?: Pagination;
}

export interface Payload<T = unknown> {
  statusCode: number;
  statusMessage: string;
  message: string;
  ok: boolean;
  data: T | null;
  pagination: Pagination | null;
}

/** Status 4xx dan 5xx dianggap tidak ok. */
function isSuccessStatus(statusCode: number): boolean {
  return statusCode < 400;
}

/** Membentuk envelope response yang seragam untuk seluruh endpoint. */
export default function generatePayload<T = unknown>(
  res: Response,
  props?: PayloadProps<T>
): Payload<T> {
  const { statusCode } = res;

  return {
    statusCode,
    statusMessage: http.STATUS_CODES[statusCode] ?? "",
    message: props?.message ?? "",
    ok: isSuccessStatus(statusCode),
    data: props?.data ?? null,
    pagination: props?.pagination ?? null,
  };
}
