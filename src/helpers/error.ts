import { ERROR_MESSAGE } from "@configs/constants.js";

/** Error aplikasi yang membawa HTTP status code. */
export class AppError extends Error {
  public readonly status: number;

  constructor(status = 500, message: string = ERROR_MESSAGE.INTERNAL) {
    super(message);
    this.name = "AppError";
    this.status = status;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Melempar {@link AppError}. Return type `never` membuat TypeScript paham
 * bahwa kode setelah pemanggilannya tidak akan pernah dieksekusi.
 */
export function setResponseError(status?: number, message?: string): never {
  throw new AppError(status ?? 500, message ?? "An unexpected error occurred");
}
