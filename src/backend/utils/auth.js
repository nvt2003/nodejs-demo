import { getSession } from './session.js';

// Phân quyền theo Role
// trả về thông tin session
export function authorize(req, res, allowedRoles = []) {
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
//Kiểm tra quyền người dùng
//Nếu đủ quyền thì tiếp tục request với thông tin phiên đăng nhập
export function checkRole(allowedRoles = [], handler) {
  return async (req, res) => {
    const session = await getSession(req);

    //Kiểm tra đăng nhập
    if (!session) {
      return sendJSON(res, 401, { message: 'Chưa đăng nhập hoặc phiên làm việc hết hạn' });
    }

    //Kiểm tra quyền
    if (allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
      return sendJSON(res, 403, { message: 'Bạn không có quyền truy cập API này' });
    }
    req.user = session;
    return await handler(req, res);
  };
}