import crypto from 'crypto';
import sessionModel from '../models/sessonModel.js';

// Tạo session và lưu DB
// trả về sessionId
export async function createSession(user) {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); 

  await sessionModel.createSession(sessionId, user.id, user.role, expiresAt);
  return sessionId;
}

// Lấy thông tin session từ Cookie
// trả về session
export async function getSession(req) {
  const cookieHeader = req.headers.cookie;
  //trả về null nếu không có cookie
  if (!cookieHeader) return null;

  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => c.trim().split('='))
  );

  const sessionId = cookies['sessionId'];
  //trả về null nếu không tìm thấy thông tin session trong cookie
  if (!sessionId) return null;

  return await sessionModel.findValidSession(sessionId);
}
export function destroySession(req) {
  const cookieHeader = req.headers.cookie;
  //tránh lỗi khi cookie rỗng
  if (!cookieHeader) {
    console.log("Không có cookie");
    return;
  }
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [key, ...v] = c.trim().split('=');
      return [key, v.join('=')];
    })
  );

  const sessionId = cookies['sessionId'];
  sessionModel.deleteSession(sessionId);
}