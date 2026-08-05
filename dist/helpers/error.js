import { ERROR_MESSAGE } from "../configs/constants.js";
export class AppError extends Error {
    status;
    constructor(status = 500, message = ERROR_MESSAGE.INTERNAL) {
        super(message);
        this.name = "AppError";
        this.status = status;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
export function setResponseError(status, message) {
    throw new AppError(status ?? 500, message ?? "An unexpected error occurred");
}
