import { getSession } from './session';

// Phân quyền theo Role
// trả về thông tin session
function authorize(req, res, allowedRoles = []) {
  const session = getSession(req);
  //kiểm tra đăng nhập
  if (!session) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Chưa đăng nhập' }));
    return null;
  }
  //kiểm tra quyền
  if (allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Không có quyền truy cập' }));
    return null;
  }

  return session;
}

module.exports = { authorize };