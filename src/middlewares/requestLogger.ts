import type { Request } from "express";
import morgan from "morgan";

const LOG_FORMAT = ":method :url :status :response-time ms - :res[content-length] :body :query";

function formatSection(label: string, value: unknown): string {
  const hasContent = Object.keys((value as object) || {}).length > 0;

  return hasContent ? `\n   ${label}: ${JSON.stringify(value)}` : "";
}

morgan.token("body", (req: Request) => formatSection("Body", req.body));
morgan.token("query", (req: Request) => formatSection("Query", req.query));

/** Logger request HTTP dengan tambahan ringkasan body dan query. */
export default function requestLogger() {
  return morgan(LOG_FORMAT);
}
