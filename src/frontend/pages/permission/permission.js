import PermissionApi from "../../services/permissionApi.js";
import authApi from "../../services/authApi.js"
import {initNavbar} from "../../components/Navbar.js"
document.addEventListener('DOMContentLoaded', async () => {
  initNavbar();
  const isAuthorized = await checkAdminAccess();
  if (isAuthorized) {
    loadPermissionRequests();
  }
  
});

// Kiểm tra xem người dùng có phải Admin hay không
async function checkAdminAccess() {
  try {
    const res = await authApi.getMe()
    // Kiểm tra status
    if (res.status !== 200) {
      window.location.href = "/";
      return false;
    }

    const data = await res.data.result;
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
    if (res.status!==200) return;

    // const result = await res.json();
    renderPermissionRequests(res.data.data || []);
  } catch (err) {
    console.error('Lỗi tải danh sách yêu cầu:', err);
  }
}

// Hiển thị dữ liệu ra bảng
function renderPermissionRequests(requests) {
  const tbody = document.getElementById('permission-request-list');
  tbody.innerHTML = '';

  if (requests.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Không có yêu cầu nào đang chờ</td></tr>';
    return;
  }

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

    const result = await res.json();
    alert(result.message);
    // Load lại danh sách
    if (res.status===200) {
      loadPermissionRequests(); 
    }
  } catch (err) {
    alert('Lỗi kết nối máy chủ');
  }
}