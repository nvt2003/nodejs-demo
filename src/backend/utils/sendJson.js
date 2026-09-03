function sendJSON(res, statusCode, data, headers = {}) {
    res.writeHead(statusCode, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        ...headers
    });

    res.end(JSON.stringify(data));
}
export function sendJSONWithCookies (req, res, statusCode, data, cookieHeaders = {}) {
    const origin = req.headers?.origin || "*";

    sendJSON(res, statusCode, data, {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
        ...cookieHeaders
    });
}
export default sendJSON;