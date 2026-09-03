import permissionModel from '../models/permissionModel.js';
import userModel from '../models/userModel.js';
import sendJSON from '../utils/sendJson.js';
import getBody from '../utils/getBody.js';
export const permissionController = {
    //yêu cầu quyền truy cập
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
            //gửi yêu cầu thành công
            if (isSuccess) {
            return sendJSON(res, 200, { 
                message: `Đã gửi yêu cầu xin quyền ${role} thành công. Vui lòng chờ Admin phê duyệt!` 
            });
            }

            return sendJSON(res, 500, { message: 'Gửi yêu cầu thất bại' });

        } catch (error) {
            return sendJSON(res, 500, { message: 'Lỗi máy chủ', error: error.message });
        }
    },
    //lấy danh sách các yêu cầu quyền truy cập
    getPendingRequests: async(req, res) =>{
        try {
            const requests = await permissionModel.getPendingRequests();
            return sendJSON(res, 200, { data: requests });
        } catch (error) {
            return sendJSON(res, 500, { message: 'Lỗi máy chủ', error: error.message });
        }
    },
    //Phê duyệt hoặc Từ chối yêu cầu (Chỉ Admin)
    handlePermissionRequest: async(req, res) =>{
        try {
            const { requestId, action } = await getBody(req);
            //kiểm tra xem là approve hay reject
            if (!requestId || !['APPROVE', 'REJECT'].includes(action)) {
            return sendJSON(res, 400, { message: 'Dữ liệu không hợp lệ' });
            }

            // Lấy thông tin request
            const request = await permissionModel.getRequestById(requestId);
            if (!request || request.status !== 'PENDING') {
            return sendJSON(res, 404, { message: 'Yêu cầu không tồn tại hoặc đã được xử lý' });
            }

            if (action === 'APPROVE') {
            // Cập nhật role mới cho user trong bảng users
            await userModel.updateUserRole(request.user_id, request.requested_role);
            // Đổi trạng thái request thành APPROVED
            await permissionModel.updateStatus(requestId, 'APPROVED');

            return sendJSON(res, 200, { message: `Đã duyệt quyền ${request.requested_role} cho người dùng thành công` });
            } else {
            // Đổi trạng thái request thành REJECTED
            await permissionModel.updateStatus(requestId, 'REJECTED');

            return sendJSON(res, 200, { message: 'Đã từ chối yêu cầu cấp quyền' });
            }

        } catch (error) {
            return sendJSON(res, 500, { message: 'Lỗi máy chủ', error: error.message });
        }
    }
}