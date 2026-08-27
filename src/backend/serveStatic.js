function serveStatic(req, res) {
    const filePath = path.join(
        frontendPath,
        req.url === "/" ? "index.html" : req.url
    );

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            return res.end("Not Found");
        }

        const ext = path.extname(filePath);

        const contentTypes = {
            ".html": "text/html",
            ".js": "application/javascript",
            ".css": "text/css",
            ".json": "application/json",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".svg": "image/svg+xml"
        };

        res.writeHead(200, {
            "Content-Type":
                contentTypes[ext] || "application/octet-stream"
        });

        res.end(data);
    });
}