import BACKEND_URL from "../config/config.js";
import { request } from "./api.js";

const AUTH_API = `${BACKEND_URL}/api`;

const AuthApi = {
  // GET /api/me
  async getMe() {
    return await request(`${AUTH_API}/me`);
  },

  // POST /api/login
  async login(credentials) {
    return await request(`${AUTH_API}/login`, {
      method: "POST",
      body: JSON.stringify(credentials)
    });
  },

  // POST /api/logout
  async logout() {
    return await request(`${AUTH_API}/logout`, {
      method: "POST"
    });
  }
};

export default AuthApi;