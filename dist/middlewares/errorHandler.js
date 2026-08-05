import { ERROR_MESSAGE } from "../configs/constants.js";
import generatePayload from "../helpers/payload.js";
const DEFAULT_STATUS = 500;
const QUIET_STATUSES = new Set([404]);
function isProduction() {
    return process.env.NODE_ENV === "production";
}
function resolveStatus(err) {
    const status = err?.status;
    return typeof status === "number" ? status : DEFAULT_STATUS;
}
function resolveMessage(err) {
    return err instanceof Error && err.message ? err.message : ERROR_MESSAGE.INTERNAL;
}
function buildDebugData(err, req, status) {
    if (isProduction() || QUIET_STATUSES.has(status))
        return undefined;
    return {
        error: (err instanceof Error && err.name) || "Error",
        stack: err instanceof Error ? err.stack : undefined,
        path: req.path,
        method: req.method,
    };
}
function logError(err, req, message, status) {
    if (isProduction() || QUIET_STATUSES.has(status))
        return;
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.error("Message:", message);
    if (err instanceof Error && err.stack) {
        console.error("Stack Trace:", err.stack);
    }
}
export default function errorHandler(err, req, res, _next) {
    const status = resolveStatus(err);
    const message = resolveMessage(err);
    logError(err, req, message, status);
    res.status(status).json(generatePayload(res, {
        message,
        data: buildDebugData(err, req, status),
    }));
}
