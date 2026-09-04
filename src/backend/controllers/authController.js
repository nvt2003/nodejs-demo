import userModel from '../models/userModel.js';
import { createSession, destroySession } from '../utils/session.js';
import sendJSON, { sendJSONWithCookies } from '../utils/sendJson.js';
import getBody from '../utils/getBody.js';


export const authController = {
    //Xử lí đăng nhập, lưu thông tin phiên đăng nhập
    //trả về thông tin người đăng nhập
    login: async(req,res)=>{
        try {
            const { email, password } = await getBody(req);
            //validate
            if (!email || !password) {
            return sendJSON(res, 400, { message: 'Vui lòng nhập đầy đủ email và mật khẩu' });
            }
            const user = await userModel.checklogin(email,password);
            // Kiểm tra, xác thực thông tin người dùng
            if (!user) {
            return sendJSON(res, 400, { message: 'Email hoặc mật khẩu không chính xác' });
            }
            const sessionId = await createSession(user);
            const cookieHeader = {
            'Set-Cookie': `sessionId=${sessionId}; HttpOnly; Path=/; SameSite=Lax`
            };

            return sendJSON(res, 200, {
                message: 'Đăng nhập thành công',
                result: user
        }, cookieHeader);

        } catch (error) {
            return sendJSON(res, 400, { message: error.message || 'Lỗi xử lý dữ liệu' });
        }
    },
    //Xử lý đăng xuất, xóa phiên đăng nhập
    logout: async(req,res)=>{
        try {
            destroySession(req);

            const cookieHeader = {
            'Set-Cookie': 'sessionId=; HttpOnly; Path=/; Max-Age=0'
            };

            return sendJSONWithCookies(req,res, 200, { message: 'Đăng xuất thành công' }, cookieHeader);
        } catch (error) {
            return sendJSON(res, 500, { message: 'Lỗi máy chủ', error: error.message });
        }
    },
    //lấy dữ liệu đăng nhập
    getMe: async(req,res)=>{
        try {
            // Kiểm tra sự tồn tại của Cookie header
            if (!req.headers?.cookie) {
            return sendJSON(res, 401, { message: 'Không tìm thấy cookie phiên đăng nhập' });
            }
            const currentUserId = req.user?.user_id || req.user?.id;
            // Kiểm tra session hiện tại
            if (!currentUserId) {
                return sendJSON(res, 401, { message: 'Phiên làm việc không hợp lệ hoặc đã hết hạn' });
            }
            
            const user = await userModel.getUserById(currentUserId);
            //không tìm được user
            if (!user) {
                return sendJSON(res, 404, { message: 'Tài khoản không tồn tại trên hệ thống' });
            }
            return sendJSON(res, 200, {
                message:"Lấy thông tin thành công",
                result: user
            });
        } catch (error) {
            return sendJSON(res, 500, { 
                message: 'Lỗi máy chủ khi lấy thông tin người dùng', 
                error: error.message 
                });
            }
    }
}