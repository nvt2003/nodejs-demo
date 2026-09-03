import BACKEND_URL from "../config/config.js";
import { request } from "./api.js";
const API = `${BACKEND_URL}/api/images`

// async function request(url, options = {}) {
//     const response = await fetch(url, options);

//     const data = await response.json();

//     return {
//         status: response.status,
//         data
//     };
// }

//POST /api/images
const imageApi = {
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
export default imageApi