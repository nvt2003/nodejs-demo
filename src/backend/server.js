import http from "http";
import { fileURLToPath } from "node:url";
import {userController} from "./controllers/userController.js";
const PORT = process.env.PORT
import sendJSON from './utils/sendJson.js'
import {ImageController} from "./controllers/imageController.js";
import serveStatic from "./serveStatic.js";
import { authController } from "./controllers/authController.js";
import {checkRole} from "./utils/auth.js"
import {permissionController} from "./controllers/permissionController.js"

const __filename = fileURLToPath(import.meta.url);
//CORS
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
//API
const server = http.createServer(async (req, res) => {
    const isOptions = handleCORS(req, res);
    //Kiểm tra và phản hồi Preflight OPTIONS ngay lập tức
    if (isOptions) return;
    try {
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
        //==========required login==========================
        //route POST /logout
        if (req.method === "POST" && req.url === "/api/logout") {
            return await checkRole([],authController.logout(req,res));
        }
        //route GET /me
        if (req.method === "GET" && req.url === "/api/me") {
            return await checkRole([],authController.getMe)(req,res);
        }
        // POST /api/request-permission
        if (req.method === 'POST' && req.url === '/api/request-permission') {
            return await checkRole([], permissionController.requestPermission)(req, res);
        }
        //=========allow view=======================

        // GET /api/users
        if (req.method === "GET" && req.url === "/api/users") {
            return await checkRole(['admin','view'],userController.getUsers)(req, res);
        }
        
        // GET /api/users/{id}
        if (req.method === "GET" && req.url.startsWith("/api/users/")) {
            // const url = new URL(req.url, `${HOST}:${PORT}`);

            // const userId = url.pathname.split("/")[3];

            const userId = req.url.split("/")[3];
            return await checkRole(['admin','view'],
                userController.getUserById(
                req,
                res,
                userId
            )(req, res));
        }

        //=========allow edit=======================
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
            return await checkRole(['admin','edit'],
                userController.updateUser(
                req,
                res,
                userId
            )(req, res));
        }
        // DELETE /api/users
        if (req.method === "DELETE" && req.url.startsWith("/api/users/")) {
            const userId = req.url.split("/")[3];

            return await checkRole(['admin','edit'],
                userController.deleteUser(
                req,
                res,
                userId
            )(req, res));
        }
        //route POST /api/images
        if (req.method === "POST" && req.url === "/api/images") {
            return await checkRole(['admin','edit'],
                ImageController.upload)(req, res);
        }
        //=========admin=======================
        // GET api/permission-requests
        if (req.method === 'GET' && req.url === '/api/permission-requests') {
            return await checkRole(['admin'], permissionController.getPendingRequests)(req, res);
        }

        // POST api/handle-permission
        if (req.method === 'POST' && req.url === '/api/handle-permission') {
            return await checkRole(['admin'], permissionController.handlePermissionRequest)(req, res);
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

// server.listen(PORT, () => {
//     console.log(`API đang chạy tại ${HOST}:${PORT}`);
// });
server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});