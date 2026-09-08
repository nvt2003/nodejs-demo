import BACKEND_URL from "../config/config.js";
const API = `${BACKEND_URL}/api/images`
//api/images không cần gắn header, credentials,..
async function request(url, options = {}) {
    const response = await fetch(url, options);

    const data = await response.json();

    return {
        status: response.status,
        data
    };
}
//POST /api/images
const ImageApi = {
    async uploadImage(formData){
        return await request(
            `${API}`,
            {
                method: "POST",
                body: formData
            }
        );
    }
}
export default ImageApi