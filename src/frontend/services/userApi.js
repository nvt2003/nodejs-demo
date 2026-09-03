import BACKEND_URL from "../config/config.js";
const API = `${BACKEND_URL}/api/users`
import { request } from "./api.js";
const UserApi = {
    // GET /api/users
    async getUsers() {

        return await request(API);
    },
    // GET /api/users/:id
    async getUser(id) {
        return await request(
            `${API}/${id}`
        );
    },
    // POST /api/users
    async createUser(data) {
        return await request(
            `${API}`,
            {
                method: "POST",
                body: JSON.stringify(data)
            }
        );
    },
    // PUT /api/users/:id
    async updateUser(id, data) {
        return await request(
            `${API}/${id}`,
            {
                method: "PUT",
                body: JSON.stringify(data)
            }
        );
    },
    // DELETE /api/users/:id
    async deleteUser(id) {
        return await request(
            `${API}/${id}`,
            {
                method: "DELETE"
            }
        );
    },
    // POST /api/export
    async exportCSV() {
        try {
            const response = await fetch(`${API}/export`, {
                method: "POST"
            });
            //Thông báo các lỗi
            if (!response.ok) {
                //Thông báo lỗi phân quyền
                if (response.status === 403){
                    alert("Bạn không có quyền truy cập tính năng này!")
                    return;
                }else{
                    throw new Error('Lỗi khi tải file từ server');
                }
            }
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = 'users_export.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Lỗi export CSV:', error);
            alert('Không thể xuất file CSV: ' + error.message);
        }
    },
    //POST /api/import
    async importCSV(formData) {
        const response = await fetch(`${API}/import`, {
            method: "POST",
            body: formData
        });
        const data = await response.json();
        return {
            status: response.status,
            data: data
        };
    },
    
    // POST /api/users/sendEmail
    async sendEmail(data) {
        return await request(
            `${API}/sendEmail`,
            {
                method: "POST",
                body: JSON.stringify(data)
            }
        );
    },
    //POST /login
    async login(credentials) {
    return await request(`${BACKEND_URL}/login`, {
        method: "POST",
        body: JSON.stringify(credentials)
    });
}
};


export default UserApi;