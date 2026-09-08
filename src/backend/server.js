import http from "http";
import {userController} from "./controllers/userController.js";
const PORT = process.env.PORT
import sendJSON from './utils/sendJson.js'
import {ImageController} from "./controllers/imageController.js";
import serveStatic from "./serveStatic.js";
import { authController } from "./controllers/authController.js";
import {checkRole} from "./utils/auth.js"
import {permissionController} from "./controllers/permissionController.js"
import sessionModel from "./models/sessonModel.js";
import { isDuplicateRequest, isRateLimited } from "./utils/rateLimiter.js";
import { generateRequestSignature } from "./utils/requestSignature.js";

//=====CORS=====
function handleCORS(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    // XỬ LÝ PREFLIGHT REQUEST
    if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return true; 
    }
    return false;
}
//Kiểm tra xem request có phải api không
function isApiRoute(req) {
    return req.url.startsWith('/api/');
}
//=====API=====
const server = http.createServer(async (req, res) => {
    //=======xử lí spam api============
    if (isApiRoute(req)) {
        const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
        const requestId = generateRequestSignature(req, req.parsedBody);

        // Kiểm tra Rate Limit theo IP (Chặn spam quá nhiều request/giây)
        // Giới hạn: 10 request / 10 giây
        if (isRateLimited(clientIp, 10, 10000)) { 
            return sendJSON(res, 429, {
                error: 'Too Many Requests',
                message: 'Bạn đang thao tác quá nhanh. Vui lòng thử lại sau 10 giây!',
            });
        }

        // CHẶN TRÙNG LẶP CHO CÁC METHOD THAY ĐỔI DỮ LIỆU (POST, PUT, DELETE)
        // Bỏ qua kiểm tra Duplicate đối với phương thức GET
        if (req.method !== 'GET' && requestId && isDuplicateRequest(requestId, 3000)) {
            return sendJSON(res, 409, {
                error: 'Conflict',
                message: 'Yêu cầu này đang được xử lý, vui lòng không nhấn liên tục!',
            });
        }
    }
    //=======xử lí api============
    const isOptions = handleCORS(req, res);
    //Kiểm tra và phản hồi Preflight OPTIONS ngay lập tức
    if (isOptions) return;
    try {
        //==========các api không yêu cầu đăng nhập=============================
        // Health check
        if (req.method === "GET" && req.url === "/health") {
            return sendJSON(res, 200, {
                status: "ok",
                timestamp: new Date().toISOString()
            });
        }
        
        //route POST /login
        if (req.method === "POST" && req.url === "/login") {
            return await authController.login(req, res);
        }
        //==========các api yêu cầu người dùng đăng nhập==========================
        //route POST /logout
        if (req.method === "POST" && req.url === "/api/logout") {
            return await checkRole([],authController.logout(req,res));
        }
        //route GET /api/me
        if (req.method === "GET" && req.url === "/api/me") {
            return await checkRole([],authController.getMe)(req,res);
        }
        // POST /api/request-permission
        if (req.method === 'POST' && req.url === '/api/request-permission') {
            return await checkRole([], permissionController.requestPermission)(req, res);
        }
        
        //=========các api yêu cầu quyền sửa (edit, admin)=======================
        // POST /api/users/export
        if (req.method === "POST" && req.url === "/api/users/export") {
            return await checkRole(['admin','edit'],
                userController.exportCSV)(req, res);
        }
        // POST /api/users/import
        if (req.method === "POST" && req.url === "/api/users/import") {
            return await checkRole(['admin','edit'],
                userController.importCSV)(req, res);
        }
        // POST /api/users/sendEmail
        if (req.method === "POST" && req.url === "/api/users/sendEmail") {
            return await checkRole(['admin','edit'],
                userController.sendEmail)(req, res);
        }

        // POST /api/users
        if (req.method === "POST" && req.url === "/api/users") {
            return await checkRole(['admin','edit'],
                userController.createUser)(req, res);
        }
        
        // PUT /api/users/{id}
        if (req.method === "PUT" && req.url.startsWith("/api/users/")) {
            // const url = new URL(req.url, `${HOST}:${PORT}`);

            // const userId = url.pathname.split("/")[3];
            
            const userId = req.url.split("/")[3];
            return checkRole(
                ['admin', 'edit'],
                (req, res) => userController.updateUser(req, res, userId)
            )(req, res);
        }
        // DELETE /api/users
        if (req.method === "DELETE" && req.url.startsWith("/api/users/")) {
            const userId = req.url.split("/")[3];

            return checkRole(
                ['admin', 'edit'],
                (req, res) => userController.deleteUser(req, res, userId)
            )(req, res);
        }
        //route POST /api/images
        if (req.method === "POST" && req.url === "/api/images") {
            return await checkRole(['admin','edit'],
                ImageController.upload)(req, res);
        }
        //=========các api yêu cầu quyền xem (view, edit, admin)=======================

        // GET /api/users
        if (req.method === "GET" && req.url === "/api/users") {
            return await checkRole(['admin','view','edit'],userController.getUsers)(req, res);
        }
        
        // GET /api/users/{id}
        if (req.method === "GET" && req.url.startsWith("/api/users/")) {

            const userId = req.url.split("/")[3];
            return checkRole(
                ['admin', 'view', 'edit'],
                (req, res) => userController.getUserById(req, res, userId)
            )(req, res);
        }

        //=========các api yêu cầu quyền admin=======================
        // GET /api/permission-requests
        if (req.method === 'GET' && req.url === '/api/permission-requests') {
            return await checkRole(['admin'], permissionController.getPendingRequests)(req, res);
        }

        // POST /api/handle-permission
        if (req.method === 'POST' && req.url === '/api/handle-permission') {
            return await checkRole(['admin'], permissionController.handlePermissionRequest)(req, res);
        }
        // GET /api/user-with-roles
        if (req.method === 'GET' && req.url === '/api/users-with-roles') {
        return await checkRole(['admin'], permissionController.getUsersWithRoles)(req, res);
        }

        // POST /api/revoke-role
        if (req.method === 'POST' && req.url === '/api/revoke-role') {
        return await checkRole(['admin'], permissionController.revokeRole)(req, res);
        }
        // =========================
        // FRONTEND
        // =========================

        if (req.method === "GET") {
            return serveStatic(req, res);
        }

        return sendJSON(res, 404, {
            error: "Not found"
        });

    } catch (err) {
        console.error(err);

        if (err.message === "UNAUTHORIZED") {
            return sendJSON(res, 401, {
                error: "Unauthorized"
            });
        }

        if (err.message === "Invalid JSON") {
            return sendJSON(res, 400, {
                error: "Invalid JSON"
            });
        }

        return sendJSON(res, 500, {
            error: "Lỗi server"
        });
    }
});
//=====Xóa tự động các session hết hạn mỗi ngày=====
const cleanExpiredSessions = async () => {
    try {
        const deletedCount = await sessionModel.cleanExpiredSessions();
        //đếm số session đã xóa và log lại
        if (deletedCount > 0) {
            console.log(
                `[Session Cleanup] Đã xóa ${deletedCount} session hết hạn`
            );
        }
    } catch (error) {
        console.error('[Session Cleanup] Lỗi:', error.message);
    }
};
cleanExpiredSessions();
setInterval(cleanExpiredSessions, 24 * 60 * 60 * 1000);

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});