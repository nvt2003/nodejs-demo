// Bộ nhớ lưu trữ số lần request theo IP (Rate Limit)
const ipRateMap = new Map();

// Bộ nhớ lưu các Request ID đang hoặc vừa xử lý (Idempotency)
const activeRequests = new Set();

//Chặn Spam dồn dập theo IP (Rate Limiter)
export function isRateLimited(ip, limit = 10, windowMs = 10000) {
  const now = Date.now();
  // chưa có request nào, khởi tạo bộ đếm
  if (!ipRateMap.has(ip)) {
    ipRateMap.set(ip, { count: 1, startTime: now });
    return false;
  }

  const record = ipRateMap.get(ip);

  // Hết khung thời gian -> Reset đếm lại
  if (now - record.startTime > windowMs) {
    record.count = 1;
    record.startTime = now;
    return false;
  }

  record.count += 1;
  return record.count > limit;
}

//Chặn Request trùng lặp cùng lúc
export function isDuplicateRequest(requestId, lockTimeMs = 5000) {
  // requestId không tồn tại trả về false, không làm gì nữa
  if (!requestId) return false;

  // Nếu ID đã tồn tại -> Request trùng đang gửi dồn dập
  if (activeRequests.has(requestId)) {
    return true;
  }

  activeRequests.add(requestId);

  setTimeout(() => {
    activeRequests.delete(requestId);
  }, lockTimeMs);

  return false;
}

setInterval(() => {
  const now = Date.now();
  // Dọn dẹp RAM định kỳ cho Rate Limit
  for (const [ip, record] of ipRateMap.entries()) {
    // Xóa ip không hoạt động sau 1p
    if (now - record.startTime > 60000) {
      ipRateMap.delete(ip);
    }
  }
}, 60000);