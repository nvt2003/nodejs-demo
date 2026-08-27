import Busboy from "busboy";

function parseFormData(req) {
    return new Promise((resolve, reject) => {
        const busboy = Busboy({
            headers: req.headers
        });

        const formData = {
            fields: {},
            file: null
        };

        busboy.on("field", (name, value) => {
            formData.fields[name] = value;
        });

        busboy.on("file", (name, file, info) => {
            const chunks = [];

            file.on("data", chunk => {
                chunks.push(chunk);
            });

            file.on("end", () => {
                formData.file = {
                    fieldname: name,
                    filename: info.filename,
                    mimeType: info.mimeType,
                    buffer: Buffer.concat(chunks)
                };
            });
        });

        busboy.on("finish", () => {
            resolve(formData);
        });

        busboy.on("error", reject);

        req.pipe(busboy);
    });
}

export default parseFormData;