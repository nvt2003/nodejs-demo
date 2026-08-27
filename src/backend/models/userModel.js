import connection from '../config/db.js';
const userModel = {

  // Thêm dữ liệu (Create)
  createUser: async (name, email, password, avatar = null) => {
      const query = 'INSERT INTO users (name, email, password, avatar) VALUES (?, ?, ?, ?)';
      const [results] = await connection.query(query, [name, email, password, avatar]);
      return results.affectedRows > 0;
  },

  //Đọc dữ liệu (Read)
  getUsers: async() => {
    const query = 'SELECT * FROM users';
    const [results] = await connection.query(query);
    return results;
  },

  // Sửa dữ liệu (Update)
  updateUser: async (id, newName, newEmail, newPassword, newAvatar = null) => {
      let query;
      let params;

      // Nếu có avatar mới thì cập nhật cả avatar, ngược lại giữ nguyên avatar cũ
      if (newAvatar) {
          query = 'UPDATE users SET name = ?, email = ?, password = ?, avatar = ? WHERE id = ?';
          params = [newName, newEmail, newPassword, newAvatar, id];
      } else {
          query = 'UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?';
          params = [newName, newEmail, newPassword, id];
      }

      const [results] = await connection.query(query, params);
      return results.affectedRows > 0;
  },

  //Xóa dữ liệu (Delete)
  deleteUser: async(id) => {
    const query = 'DELETE FROM users WHERE id = ?';
    const [results] = await connection.query(query, [id]);
    return results.affectedRows>0
  },
  //Lấy dữ liệu theo id
  getUserById: async(id) => {
    const query = 'SELECT * FROM users WHERE id = ?';
    const [results] = await connection.query(query,[id]);
    return results;
  },
  //đăng nhập
  checklogin:async(email,password)=>{
    const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
    const [results] = await connection.query(query,[email,password]);
    return results;
  }

}
export default userModel;