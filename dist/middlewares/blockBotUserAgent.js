const BLOCKED_USER_AGENT_KEYWORD = "node";
function isHeaderCheckDisabled() {
    return process.env.ALLOWED_NO_HEADER === "true";
}
export default function blockBotUserAgent(req, res, next) {
    if (isHeaderCheckDisabled())
        return next();
    const userAgent = req.get("User-Agent") ?? "";
    if (userAgent.toLowerCase().includes(BLOCKED_USER_AGENT_KEYWORD)) {
        res.status(403).send("Forbidden");
        return;
    }
    next();
}
