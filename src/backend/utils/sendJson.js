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
export function sendJSONWithCookies (res, statusCode, data, cookies = null, customHeaders = {}) {
  const origin = res.req?.headers?.origin || '*';

  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    ...customHeaders
  };

  // Xử lý gắn Cookie vào Header (nếu có)
  if (cookies) {
    if (Array.isArray(cookies)) {
      headers['Set-Cookie'] = cookies;
    } else if (typeof cookies === 'string') {
      headers['Set-Cookie'] = [cookies];
    }
  }

  // 4. Gửi Response
  res.writeHead(statusCode, headers);
  res.end(JSON.stringify(data));
}
export default sendJSON;