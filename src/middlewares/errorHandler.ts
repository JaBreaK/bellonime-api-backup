import type { NextFunction, Request, Response } from "express";
import generatePayload from "@helpers/payload.js";
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error("=== ERROR DETAILS ===");
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.error("Message:", err.message);
  console.error("Stack Trace:", err.stack || "No stack trace available");
  console.error("=====================");

  const errorData = process.env.NODE_ENV !== "production" ? {
    error: err.name,
    stack: err.stack,
    path: req.path,
    method: req.method
  } : undefined;

  if (typeof err.status === "number") {
    return res.status(err.status).json(generatePayload(res, {
      message: err.message,
      data: errorData
    }));
  }

  res.status(500).json(generatePayload(res, {
    message: err.message || "Internal Server Error",
    data: errorData
  }));
}
