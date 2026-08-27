import connection from '../config/db.js';

const sessionModel = {
  // Tạo session mới 
  // trả về true/false
  createSession: async (sessionId, userId, role, expiresAt) => {
    const query = `
      INSERT INTO sessions (id, user_id, role, expires_at) 
      VALUES (?, ?, ?, ?)
    `;
    const [results] = await connection.query(query, [sessionId, userId, role, expiresAt]);
    return results.affectedRows > 0;
  },

  // Lấy session theo ID và kiểm tra xem còn hạn hay không
  // trả về thông in session (id, userId, role, expires_at)
  // hoặc null
  findValidSession: async (sessionId) => {
    const query = `
      SELECT id, user_id, role, expires_at 
      FROM sessions 
      WHERE id = ? AND expires_at > NOW()
    `;
    const [rows] = await connection.query(query, [sessionId]);
    return rows[0] || null;
  },

  // Xóa 1 session cụ thể (Đăng xuất khỏi thiết bị hiện tại)
  // trả về true/false
  deleteSession: async (sessionId) => {
    const query = 'DELETE FROM sessions WHERE id = ?';
    const [results] = await connection.query(query, [sessionId]);
    return results.affectedRows > 0;
  },

  // Xóa tất cả session của 1 user (Đăng xuất khỏi tất cả thiết bị)
  // trả về true/false
  deleteAllUserSessions: async (userId) => {
    const query = 'DELETE FROM sessions WHERE user_id = ?';
    const [results] = await connection.query(query, [userId]);
    return results.affectedRows > 0;
  },

  // Dọn dẹp các session đã hết hạn (Chạy định kỳ tự động)
  // trả về số lượng dòng bị ảnh hưởng
  cleanExpiredSessions: async () => {
    const query = 'DELETE FROM sessions WHERE expires_at <= NOW()';
    const [results] = await connection.query(query);
    return results.affectedRows;
  }
};

export default sessionModel;