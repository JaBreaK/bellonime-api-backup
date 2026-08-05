import type { NextFunction, Request, RequestHandler, Response } from "express";

type MaybeAsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void> | void;

/**
 * Membungkus handler agar error (sync maupun async) otomatis diteruskan ke
 * `next()`. Menghilangkan blok `try/catch` identik yang sebelumnya diulang
 * di setiap method controller.
 */
export function asyncHandler(handler: MaybeAsyncHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
