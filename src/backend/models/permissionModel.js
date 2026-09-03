import connection from '../config/db.js';

const permissionModel = {
  // Tạo yêu cầu xin cấp quyền mới
  createRequest: async (userId, requestedRole) => {
    const query = `
      INSERT INTO permission_requests (user_id, requested_role) 
      VALUES (?, ?)
    `;
    const [results] = await connection.query(query, [userId, requestedRole]);
    return results.affectedRows > 0;
  },

  // Kiểm tra xem user đã có yêu cầu PENDING cho role này chưa (tránh spam gửi trùng)
  hasPendingRequest: async (userId, requestedRole) => {
    const query = `
      SELECT id FROM permission_requests 
      WHERE user_id = ? AND requested_role = ? AND status = 'PENDING'
    `;
    const [rows] = await connection.query(query, [userId, requestedRole]);
    return rows.length > 0;
  },
  //Lấy requests đang chờ duyệt
  getPendingRequests: async () => {
    const query = `
      SELECT pr.id, pr.user_id, u.name, u.email, pr.requested_role, pr.created_at
      FROM permission_requests pr
      JOIN users u ON pr.user_id = u.id
      WHERE pr.status = 'PENDING'
      ORDER BY pr.created_at DESC
    `;
    const [rows] = await connection.query(query);
    return rows;
  },

  // Cập nhật trạng thái yêu cầu (APPROVED hoặc REJECTED)
  updateStatus: async (requestId, status) => {
    const query = 'UPDATE permission_requests SET status = ? WHERE id = ?';
    const [results] = await connection.query(query, [status, [requestId]]);
    return results.affectedRows > 0;
  },

  // Lấy chi tiết 1 request theo ID
  getRequestById: async (requestId) => {
    const query = 'SELECT * FROM permission_requests WHERE id = ?';
    const [rows] = await connection.query(query, [requestId]);
    return rows[0] || null;
  },
  // Lấy danh sách người dùng đã được cấp quyền (trừ 'admin')
  getUsersWithRoles: async () => {
    const query = `
      SELECT id, name, email, role, avatar
      FROM users
      WHERE role IS NOT NULL 
        AND role != '' 
        AND LOWER(role) != 'admin'
      ORDER BY id DESC
    `;
    const [rows] = await connection.query(query);
    return rows;
  },

  // Thu hồi/Hủy cấp quyền của 1 user bằng cách xóa role
  revokeRole: async (userId) => {
    const query = `
      UPDATE users 
      SET role = '' 
      WHERE id = ? AND LOWER(role) != 'admin'
    `;
    const [results] = await connection.query(query, [userId]);
    return results.affectedRows > 0;
  }
};

export default permissionModel;