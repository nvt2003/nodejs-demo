import BACKEND_URL from "../config/config.js";
const API = `${BACKEND_URL}/api/users`

async function request(url, options = {}) {
    const response = await fetch(url, options);

    const data = await response.json();

    return {
        status: response.status,
        data
    };
}
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
    exportCSV() {
        window.location.href = `${API}/export`;
    },

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