import BACKEND_URL from "../config/config.js";
import { request } from "./api.js";

const PERMISSION_API = `${BACKEND_URL}/api`;

const PermissionApi = {
  // POST api/request-permission
  async requestPermission(role, isChange) {
    return await request(`${PERMISSION_API}/request-permission`, {
      method: "POST",
      body: JSON.stringify({ role,isChange })
    });
  },

  // GET /api/permission-requests
  async getPendingRequests() {
    return await request(`${PERMISSION_API}/permission-requests`);
  },

  // POST /api/handle-permission
  async handlePermission(requestId, action,role) {
    return await request(`${PERMISSION_API}/handle-permission`, {
      method: "POST",
      body: JSON.stringify({ requestId, action,role })
    });
  },
  // GET /api/users-with-roles
  async getUsersWithRoles(){
    return request(`${PERMISSION_API}/users-with-roles`)
  },
  
  //POST /api/revoke-role
  async revokeRole(userId){
     return request(`${PERMISSION_API}/revoke-role`, {
        method: 'POST',
        body: JSON.stringify({ userId })
      })
  }
};

export default PermissionApi;