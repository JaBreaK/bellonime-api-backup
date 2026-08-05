import morgan from "morgan";
const LOG_FORMAT = ":method :url :status :response-time ms - :res[content-length] :body :query";
function formatSection(label, value) {
    const hasContent = Object.keys(value || {}).length > 0;
    return hasContent ? `\n   ${label}: ${JSON.stringify(value)}` : "";
}
morgan.token("body", (req) => formatSection("Body", req.body));
morgan.token("query", (req) => formatSection("Query", req.query));
export default function requestLogger() {
    return morgan(LOG_FORMAT);
}
