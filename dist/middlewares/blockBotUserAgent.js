const BLOCKED_USER_AGENT_KEYWORD = "node";
function isHeaderCheckDisabled() {
    return process.env.ALLOWED_NO_HEADER === "true";
}
export default function blockBotUserAgent(req, res, next) {
    return next();
}
