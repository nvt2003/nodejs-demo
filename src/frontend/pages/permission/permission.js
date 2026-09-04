import PermissionApi from "../../services/permissionApi.js";
import authApi from "../../services/authApi.js"
import {initNavbar} from "../../components/Navbar.js"
document.addEventListener('DOMContentLoaded', async () => {
  initNavbar();
  const isAuthorized = await checkAdminAccess();
  //Kiểm tra quyền, chỉ admin được truy cập
  if (isAuthorized) {
    loadPermissionRequests();
    loadAssignedUsers();
  }
  
});

// Kiểm tra xem người dùng có phải Admin hay không
async function checkAdminAccess() {
  try {
    const res = await authApi.getMe()
    // Nếu không có thông in người dùng thì đưa về trang chính
    if (res.status !== 200) {
      window.location.href = "/";
      return false;
    }

    const data = await res.data.result;
    //Kiểm tra quyền
    //Trang này chỉ admin được truy cập vào
    //Trả về trang chính
    if (data.role !== 'admin') {
      alert('Bạn không có quyền truy cập trang này!');
      window.location.href = '/';
      return false;
    }

    return true;
  } catch (err) {
    window.location.href = '/';
    return false;
  }
}

// Lấy danh sách các yêu cầu cấp quyền từ Server
async function loadPermissionRequests() {
  try {
    const res = await PermissionApi.getPendingRequests()
    //Nếu không có danh sách (null) thì bỏ qua render
    if (res.status!==200) return;

    // const result = await res.json();
    renderPermissionRequests(res.data.data || []);
  } catch (err) {
    console.error('Lỗi tải danh sách yêu cầu:', err);
  }
}

//Render UI danh sách request
function renderPermissionRequests(requests) {
  const tbody = document.getElementById('permission-request-list');
  tbody.innerHTML = '';
  //Nếu không có request nào thì hiển thị không có
  if (requests.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Không có yêu cầu nào đang chờ</td></tr>';
    return;
  }
  //render danh sách các request
  requests.forEach(req => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${req.name}</td>
      <td>${req.email}</td>
      <td><b style="color: #007bff;">${req.requested_role}</b></td>
      <td>${new Date(req.created_at).toLocaleString()}</td>
      <td>
        <button class="btn-approve" data-id="${req.id}" style="background-color: #28a745; color: white; border: none; padding: 6px 12px; border-radius: 3px; cursor: pointer;">Duyệt</button>
        <button class="btn-reject" data-id="${req.id}" style="background-color: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 3px; cursor: pointer;">Từ chối</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Gán sự kiện cho các nút Phê duyệt / Từ chối
  tbody.querySelectorAll('.btn-approve').forEach(btn => {
    btn.onclick = () => processPermission(btn.dataset.id, 'APPROVE');
  });
  tbody.querySelectorAll('.btn-reject').forEach(btn => {
    btn.onclick = () => processPermission(btn.dataset.id, 'REJECT');
  });
}

// Gửi yêu cầu Duyệt hoặc Từ chối lên Server
async function processPermission(requestId, action) {
  const actionText = action === 'APPROVE' ? 'duyệt' : 'từ chối';
  //Xác nhận đồng ý hoặc từ chối yêu cầu
  if (!confirm(`Bạn có chắc chắn muốn ${actionText} yêu cầu này?`)) return;

  try {
    const res = await PermissionApi.handlePermission(requestId,action)
    //const result = await res.json();
    alert(res.data.message);
    // Load lại danh sách
    if (res.status===200) {
      loadPermissionRequests(); 
      loadAssignedUsers();
    }
  } catch (err) {
    alert('Có lỗi xảy ra!');
  }
}
//Lấy danh sách người dùng đã được cấp quyền
async function loadAssignedUsers() {
  try {
    const res = await PermissionApi.getUsersWithRoles();
    //Kiểm tra lấy danh sách người dùng đã được cấp quyền và render
    if (res.status === 200) {
      const users = res.data?.result || res.data?.data || [];
      renderAssignedUsers(users);
    }
  } catch (err) {
    console.error('Lỗi tải danh sách người dùng có quyền:', err);
  }
}
//Render dữ liệu danh sách người dùng đã được cấp quyền
function renderAssignedUsers(users) {
  const tbody = document.getElementById('assigned-users-list');
  //Kiểm tra bảng đã tồn tại chưa
  if (!tbody) return;
  tbody.innerHTML = '';
  //Nếu chưa có ai thì hiển thị chưa có
  if (!users || users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Chưa có người dùng nào được cấp quyền</td></tr>';
    return;
  }
  //Render bảng danh sách người dùng đã được cấp quyền
  users.forEach(user => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${user.name}</td>
      <td>${user.email}</td>
      <td><b style="color: #28a745;">${user.role==='view'?'Xem':user.role==='edit'?'Sửa':'Không rõ'}</b></td>
      <td>
        <button class="btn-revoke" data-id="${user.id}" style="background-color: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 3px; cursor: pointer;">Hủy quyền</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Gán sự kiện cho các nút "Hủy quyền"
  tbody.querySelectorAll('.btn-revoke').forEach(btn => {
    btn.onclick = () => handleRevokeRole(btn.dataset.id);
  });
}
//Thu hồi/Hủy quyền đã cấp
async function handleRevokeRole(userId) {
  //Xác nhận hủy
  if (!confirm('Bạn có chắc chắn muốn hủy quyền của người dùng này?')) return;

  try {
    const res = await PermissionApi.revokeRole(userId);
    alert(res.data?.message || 'Hủy quyền thành công');
    // Tải lại bảng sau khi hủy
    if (res.status === 200) {
      loadAssignedUsers();
    }
  } catch (err) {
    alert('Lỗi khi kết nối tới máy chủ');
  }
}