import http from "http";
import { fileURLToPath } from "node:url";
import {userController} from "./controllers/userController.js";
const PORT = process.env.PORT
import sendJSON from './utils/sendJson.js'
import {ImageController} from "./controllers/imageController.js";
import serveStatic from "./serveStatic.js";

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

        // GET /api/users/export
        if (req.method === "GET" && req.url === "/api/users/export") {
            return await userController.exportCSV(req, res);
        }
        // POST /api/users/import
        if (req.method === "POST" && req.url === "/api/users/import") {
            return await userController.importCSV(req, res);
        }
        // POST /api/users/sendEmail
        if (req.method === "POST" && req.url === "/api/users/sendEmail") {
            return await userController.sendEmail(req, res);
        }

        // GET /api/users
        if (req.method === "GET" && req.url === "/api/users") {
            return await userController.getUsers(req, res);
        }
        
        // GET /api/users/{id}
        if (req.method === "GET" && req.url.startsWith("/api/users/")) {
            // const url = new URL(req.url, `${HOST}:${PORT}`);

            // const userId = url.pathname.split("/")[3];

            const userId = req.url.split("/")[3];
            return await userController.getUserById(
                req,
                res,
                userId
            );
        }
        // POST /api/users
        if (req.method === "POST" && req.url === "/api/users") {
            return await userController.createUser(req, res);
        }
        
        // PUT /api/users/{id}
        if (req.method === "PUT" && req.url.startsWith("/api/users/")) {
            // const url = new URL(req.url, `${HOST}:${PORT}`);

            // const userId = url.pathname.split("/")[3];

            const userId = req.url.split("/")[3];
            return await userController.updateUser(
                req,
                res,
                userId
            );
        }
        // DELETE /api/users
        if (req.method === "DELETE" && req.url.startsWith("/api/users/")) {
            const userId = req.url.split("/")[3];

            return await userController.deleteUser(
                req,
                res,
                userId
            );
        }
        //route POST /login
        if (req.method === "POST" && req.url === "/login") {
            return await userController.checklogin(req, res);
        }
        //route POST /api/images
        if (req.method === "POST" && req.url === "/api/images") {
            return await ImageController.upload(req, res);
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