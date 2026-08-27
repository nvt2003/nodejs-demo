import { getSession } from './session';

// Phân quyền theo Role
// trả về thông tin session
function authorize(req, res, allowedRoles = []) {
  const session = getSession(req);
  //kiểm tra đăng nhập
  if (!session) {
    sendJSON(res, 401, { message: 'Chưa đăng nhập hoặc phiên làm việc hết hạn' });
    return null;
  }
  //kiểm tra quyền
  if (allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
    sendJSON(res, 403, { message: 'Bạn không có quyền truy cập chức năng này' });
    return null;
  }

  return session;
}

module.exports = { authorize };