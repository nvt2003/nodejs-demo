import permissionModel from '../models/permissionModel.js';
import userModel from '../models/userModel.js';
import sendJSON from '../utils/sendJson.js';
import getBody from '../utils/getBody.js';
import { destroyAllUserSessions } from '../utils/session.js';
export const permissionController = {
    //yêu cầu quyền truy cập
    requestPermission: async(req, res) => {
        try {
            const userId = req.user?.user_id || req.user?.userId;
            // Kiểm tra session
            if (!userId) {
            return sendJSON(res, 401, { message: 'Phiên làm việc không hợp lệ' });
            }

            const { role, isChange } = await getBody(req);

            // Kiểm tra quyền hợp lệ
            if (!role || !['view', 'edit', 'admin'].includes(role)) {
            return sendJSON(res, 400, { message: 'Quyền yêu cầu không hợp lệ (Chấp nhận: view, edit, admin)' });
            }

            const pending = await permissionModel.hasPendingRequest(userId, role);
            // Kiểm tra trùng lặp yêu cầu đang chờ duyệt
            if (pending&&isChange!=true) {
            return sendJSON(res, 400, { 
                message: `Bạn đã gửi yêu cầu cấp quyền trước đó và đang chờ duyệt.`,
                pendingRole: pending.requested_role
                });
            }
            const uRole = await userModel.getRoleById(userId);
            //Kiểm tra xem người dùng đã có quyền đó chưa
            if (uRole.role == role){
                return sendJSON(res,400, {message:`Bạn đã có quyền ${role==='view'?'xem (view)':role==='edit'?'sửa (edit)':''}`})
            }
            let isSuccess;
            //Kiểm tra xem người dùng có yêu cầu đổi request không
            if (isChange==true){
                isSuccess = await permissionModel.updateRequest(userId, role);
            }else{
                isSuccess = await permissionModel.createRequest(userId, role);
            }
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
            const { requestId, action, role } = await getBody(req);
            //kiểm tra dữ liệu, bắt buộc cần id và approve hoặc reject
            if (!requestId || !['APPROVE', 'REJECT'].includes(action)) {
            return sendJSON(res, 400, { message: 'Dữ liệu không hợp lệ' });
            }

            const request = await permissionModel.getRequestById(requestId);
            //Kiểm tra request tồn tại hay là đang chờ duyệt không
            if (!request || request.status !== 'PENDING') {
            return sendJSON(res, 404, { message: 'Yêu cầu không tồn tại hoặc đã được xử lý' });
            }
            // Kiểm tra người dùng có thay đổi role trong lúc duyệt 
            // Khiến UI render không kịp, thông tin không khớp
            console.log(role)
            if (request.requested_role!=role){
                return sendJSON(res, 400,{
                    message:`Thông tin không khớp!
                    \nCó thể người dùng đã chuyển sang xin cấp quyền ${request.requested_role} trong lúc duyệt
                    \nTải lại trang để cập nhật thông tin mới`
                })
            }
            // Cập nhật role mới cho user và đổi trạng thái request thành APPROVED
            // Ngược lại đổi trạng thái request thành REJECTED
            if (action === 'APPROVE') {
                await userModel.updateUserRole(request.user_id, request.requested_role);
                await permissionModel.updateStatus(requestId, 'APPROVED');
                await destroyAllUserSessions(request.user_id);
                return sendJSON(res, 200, { message: `Đã duyệt quyền ${request.requested_role} cho người dùng thành công` });

            } else {
                await permissionModel.updateStatus(requestId, 'REJECTED');

                return sendJSON(res, 200, { message: 'Đã từ chối yêu cầu cấp quyền' });
            }

        } catch (error) {
            return sendJSON(res, 500, { message: 'Lỗi máy chủ', error: error.message });
        }
    },
    //Lấy danh sách người dùng đã được cấp quyền
    getUsersWithRoles: async(req, res) =>{
        try {
            const users = await permissionModel.getUsersWithRoles();
            return sendJSON(res, 200, {
            message: 'Lấy danh sách người dùng có quyền thành công',
            result: users
            });
        } catch (error) {
            return sendJSON(res, 500, { message: 'Lỗi máy chủ', error: error.message });
        }
    },
    //Thu hồi/Hủy cấp quyền cho người dùng
    revokeRole: async(req, res) =>{
        try {
            const {userId} = await getBody(req);
            //Nếu không có thông tin người dùng, trả về lỗi
            if (!userId) {
            return sendJSON(res, 400, { message: 'Thiếu thông tin người dùng (userId)' });
            }
            const success = await permissionModel.revokeRole(userId);
            //Nếu không thành công, trả về lỗi
            if (!success) {
                return sendJSON(res, 400, { message: 'Không thể thu hồi quyền (Người dùng không tồn tại hoặc là Admin)' });
            }
            await destroyAllUserSessions(userId);
            return sendJSON(res, 200, { message: 'Thu hồi quyền thành công' });
        } catch (error) {
            return sendJSON(res, 500, { message: 'Lỗi máy chủ', error: error.message });
        }
    }
}