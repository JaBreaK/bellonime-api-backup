import cors from "cors";

const ORIGIN_SEPARATOR = ",";
const WILDCARD_ORIGIN = "*";

function readAllowedOrigins(): string[] {
  return process.env.ALLOWED_ORIGINS?.split(ORIGIN_SEPARATOR) ?? [];
}

/**
 * CORS berbasis whitelist dari env `ALLOWED_ORIGINS`.
 * Request tanpa origin (mis. curl / same-origin) tetap diizinkan.
 */
export default function corsMiddleware() {
  const allowedOrigins = readAllowedOrigins();

  return cors({
    origin: (origin, callback) => {
      const isAllowed =
        !origin || allowedOrigins.includes(WILDCARD_ORIGIN) || allowedOrigins.includes(origin);

      if (isAllowed) return callback(null, true);

      callback(new Error("Not allowed by CORS"));
    },
  });
}
