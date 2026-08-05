import http from "http";
function isSuccessStatus(statusCode) {
    return statusCode < 400;
}
export default function generatePayload(res, props) {
    const { statusCode } = res;
    return {
        statusCode,
        statusMessage: http.STATUS_CODES[statusCode] ?? "",
        message: props?.message ?? "",
        ok: isSuccessStatus(statusCode),
        data: props?.data ?? null,
        pagination: props?.pagination ?? null,
    };
}
