function getBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";

        req.on("data", chunk => {
            body += chunk.toString();

            // tránh request body quá lớn
            if (body.length > 1024 * 1024) {
                reject(new Error("dữ liệu quá lớn"));
                req.destroy();
            }
        });

        req.on("end", () => {
            try {
                resolve(JSON.parse(body || "{}"));
            } catch {
                reject(new Error("dữ liệu không hợp lệ"));
            }
        });

        req.on("error", reject);
    });
}

export default getBody;