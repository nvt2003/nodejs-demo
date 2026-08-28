import permissionModel from '../models/permissionModel.js';
import sendJSON from '../utils/response.js';
import getBody from '../utils/getBody.js';
export const permissionModel = {
    requestPermission: async(req, res) => {
        try {
            const userId = req.user?.user_id || req.user?.userId;
            // Kiểm tra session
            if (!userId) {
            return sendJSON(res, 401, { message: 'Phiên làm việc không hợp lệ' });
            }

            const { role } = await getBody(req);

            // Lấy dữ liệu từ Request Body
            if (!role || !['view', 'edit', 'admin'].includes(role)) {
            return sendJSON(res, 400, { message: 'Quyền yêu cầu không hợp lệ (Chấp nhận: view, edit, admin)' });
            }

            const isPending = await permissionModel.hasPendingRequest(userId, role);
            // Kiểm tra trùng lặp yêu cầu đang chờ duyệt
            if (isPending) {
            return sendJSON(res, 400, { message: `Bạn đã gửi yêu cầu quyền ${role} trước đó và đang chờ duyệt.` });
            }

            const isSuccess = await permissionModel.createRequest(userId, role);

            if (isSuccess) {
            return sendJSON(res, 200, { 
                message: `Đã gửi yêu cầu xin quyền ${role} thành công. Vui lòng chờ Admin phê duyệt!` 
            });
            }

            return sendJSON(res, 500, { message: 'Gửi yêu cầu thất bại' });

        } catch (error) {
            return sendJSON(res, 500, { message: 'Lỗi máy chủ', error: error.message });
        }
    }
}
