import userModel from '../models/userModel.js';
import { createSession, destroySession } from '../utils/session.js';


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
            const user = await userModel.findByEmail(email);
            // Kiểm tra, xác thực thông tin người dùng
            if (!user || user.password !== password) {
            return sendJSON(res, 400, { message: 'Email hoặc mật khẩu không chính xác' });
            }

            const sessionId = await createSession(user);
            const cookieHeader = {
            'Set-Cookie': `sessionId=${sessionId}; HttpOnly; Path=/; SameSite=Lax`
            };

            return sendJSON(res, 200, {
                message: 'Đăng nhập thành công',
                user: { 
                    id: user.id, 
                    name: user.name,
                    role: user.role 
                }
        }, cookieHeader);

        } catch (error) {
            return sendJSON(res, 400, { message: error.message || 'Lỗi xử lý dữ liệu' });
        }
    },
    //Xử lý đăng xuất, xóa phiên đăng nhập
    logout: async(req,res)=>{
        try {
            await destroySession(req);

            const cookieHeader = {
            'Set-Cookie': 'sessionId=; HttpOnly; Path=/; Max-Age=0'
            };

            return sendJSON(res, 200, { message: 'Đăng xuất thành công' }, cookieHeader);
        } catch (error) {
            return sendJSON(res, 500, { message: 'Lỗi máy chủ', error: error.message });
        }
    }
};