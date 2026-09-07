import { getSession } from './session.js';
import sendJSON from './sendJson.js';

//Kiểm tra quyền người dùng
//Nếu đủ quyền thì tiếp tục request với thông tin phiên đăng nhập
export function checkRole(allowedRoles = [], handler) {
  return async (req, res) => {
    try{
      const session = await getSession(req);
      //Kiểm tra đăng nhập
      if (!session) {
        return sendJSON(res, 401, { 
          message: 'Chưa đăng nhập hoặc phiên làm việc hết hạn' 
        });
      }
      //Kiểm tra quyền
      if (allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
        return sendJSON(res, 403, { 
          message: 'Bạn không có quyền truy cập chức năng này' 
        });
      }
      req.user = session;
      return await handler(req, res);
    }catch (error) {
      console.error("Lỗi Server:", error);
      return sendJSON(res, 500, { message: 'Lỗi hệ thống' });
    }
  };
}