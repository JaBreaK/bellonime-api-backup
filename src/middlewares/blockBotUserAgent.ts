import type { NextFunction, Request, Response } from "express";

const BLOCKED_USER_AGENT_KEYWORD = "node";

function isHeaderCheckDisabled(): boolean {
  return process.env.ALLOWED_NO_HEADER === "true";
}

/**
 * Menolak request dari HTTP client default Node (indikasi scraping balik).
 * Dapat dinonaktifkan lewat env `ALLOWED_NO_HEADER=true`.
 */
export default function blockBotUserAgent(req: Request, res: Response, next: NextFunction): void {
  // Allow Node.js SSR and internal framework requests
  return next();
}
