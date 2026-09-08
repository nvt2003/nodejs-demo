import crypto from 'node:crypto';

// Hàm tự tạo fingerprint duy nhất cho mỗi thao tác của Client
// Dùng để kiểm soát trách user spam 1 request nhiều lần
export function generateRequestSignature(req, bodyData) {
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
  const method = req.method;
  const url = req.url;
  
  const rawString = `${clientIp}_${method}_${url}_${JSON.stringify(bodyData || {})}`;
  
  return crypto.createHash('md5').update(rawString).digest('hex');
}