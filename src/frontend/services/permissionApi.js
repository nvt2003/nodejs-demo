import BACKEND_URL from "../config/config.js";
import { request } from "./api.js";

const PERMISSION_API = `${BACKEND_URL}/api`;

const PermissionApi = {
  // POST api/request-permission
  async requestPermission(role) {
    return await request(`${PERMISSION_API}/request-permission`, {
      method: "POST",
      body: JSON.stringify({ role })
    });
  },

  // GET /api/permission-requests
  async getPendingRequests() {
    return await request(`${PERMISSION_API}/permission-requests`);
  },

  // POST /api/handle-permission
  async handlePermission(requestId, action) {
    return await request(`${PERMISSION_API}/handle-permission`, {
      method: "POST",
      body: JSON.stringify({ requestId, action })
    });
  }
};

export default PermissionApi;