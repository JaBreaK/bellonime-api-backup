import type { NextFunction, Request, Response } from "express";

import { ERROR_MESSAGE } from "@configs/constants.js";
import generatePayload from "@helpers/payload.js";

/** Bentuk minimal error yang membawa HTTP status. */
interface StatusCarryingError {
  status?: number;
}

const DEFAULT_STATUS = 500;

/**
 * 404 adalah kondisi normal (favicon.ico, sw.js, salah ketik URL), bukan bug.
 * Stack trace-nya hanya membuat log ramai tanpa memberi informasi berguna.
 */
const QUIET_STATUSES = new Set([404]);

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function resolveStatus(err: unknown): number {
  const status = (err as StatusCarryingError)?.status;

  return typeof status === "number" ? status : DEFAULT_STATUS;
}

function resolveMessage(err: unknown): string {
  return err instanceof Error && err.message ? err.message : ERROR_MESSAGE.INTERNAL;
}

/** Detail tambahan hanya diekspos di luar production untuk menghindari kebocoran info. */
function buildDebugData(err: unknown, req: Request, status: number) {
  if (isProduction() || QUIET_STATUSES.has(status)) return undefined;

  return {
    error: (err instanceof Error && err.name) || "Error",
    stack: err instanceof Error ? err.stack : undefined,
    path: req.path,
    method: req.method,
  };
}

function logError(err: unknown, req: Request, message: string, status: number): void {
  if (isProduction() || QUIET_STATUSES.has(status)) return;

  console.error(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.error("Message:", message);

  if (err instanceof Error && err.stack) {
    console.error("Stack Trace:", err.stack);
  }
}

/** Middleware terakhir yang menyeragamkan format response error. */
export default function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = resolveStatus(err);
  const message = resolveMessage(err);

  logError(err, req, message, status);

  res.status(status).json(
    generatePayload(res, {
      message,
      data: buildDebugData(err, req, status),
    })
  );
}
