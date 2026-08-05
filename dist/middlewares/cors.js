import cors from "cors";
const ORIGIN_SEPARATOR = ",";
const WILDCARD_ORIGIN = "*";
function readAllowedOrigins() {
    return process.env.ALLOWED_ORIGINS?.split(ORIGIN_SEPARATOR) ?? [];
}
export default function corsMiddleware() {
    const allowedOrigins = readAllowedOrigins();
    return cors({
        origin: (origin, callback) => {
            const isAllowed = !origin || allowedOrigins.includes(WILDCARD_ORIGIN) || allowedOrigins.includes(origin);
            if (isAllowed)
                return callback(null, true);
            callback(new Error("Not allowed by CORS"));
        },
    });
}
