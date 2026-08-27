import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sendJSON from "./utils/sendJson.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRONTEND_DIR = path.join(__dirname, "../frontend");

export default function serveStatic(req, res) {
    let urlPath = new URL(
        req.url,
        "http://localhost"
    ).pathname;
    //navigate tới trang chính
    if (urlPath === "/") {
        urlPath = "/index.html";
    }

    const filePath = path.join(
        FRONTEND_DIR,
        urlPath
    );
    //file path không khớp, hạn chế quyền truy cập ngoài trang fe
    if (!filePath.startsWith(FRONTEND_DIR)) {
        return sendJSON(res, 403, {
            error: "Forbidden"
        });
    }

    fs.readFile(filePath, (err, data) => {
        //nếu lỗi file path
        if (err) {
            console.error("Static file error:", err);
            return sendJSON(res, 404, {
                error: "File not found"
            });
        }

        const contentTypes = {
            ".html": "text/html; charset=utf-8",
            ".js": "application/javascript",
            ".css": "text/css",
            ".json": "application/json",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".gif": "image/gif",
            ".svg": "image/svg+xml"
        };

        res.writeHead(200, {
            "Content-Type":
                contentTypes[path.extname(filePath)] ||
                "application/octet-stream"
        });

        res.end(data);
    });
}