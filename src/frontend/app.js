import UserApi from "./services/userApi.js";
import imageApi from "./services/imageApi.js";
import permissionApi from "./services/permissionApi.js";
import authApi from "./services/authApi.js";
import Navbar from './components/Navbar.js';
const form = document.getElementById("user-form");

const userIdInput = document.getElementById("user-id");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const imageInput = document.getElementById("image");

const userList = document.getElementById("user-list");

const formTitle = document.getElementById("form-title");
const cancelBtn = document.getElementById("cancel-btn");
const exportBtn = document.getElementById("export-btn");
const importBtn = document.getElementById("import-btn");
const csvFileInput = document.getElementById("csv-file-input");
//mail
const emailToInput = document.getElementById("email-to");
const emailSubjectInput = document.getElementById("email-subject");
const emailContentInput = document.getElementById("email-content");

const sendEmailBtn = document.getElementById("send-email-btn");
const emailModal = document.getElementById("email-modal");
const closeEmailModalBtn = document.getElementById("close-email-modal");
const confirmSendEmailBtn = document.getElementById("confirm-send-email");

const ALLOWED_ROLES = ['admin', 'view', 'edit'];
document.addEventListener("DOMContentLoaded", async () => {
  initNavbar();
  const user = await checkPermission();
  const mainContent = document.getElementById("main-content"); 
  const permissionDeniedBox = document.getElementById("permission-denied-box"); 
  const notice = document.getElementById("permission-denied-box-notice"); 
  const requestViewBtn = document.getElementById("request-view-btn"); 
  const requestEditBtn = document.getElementById("request-edit-btn");
  // Nếu có quyền ('Admin', 'View', hoặc 'Edit') -> Hiển thị UI và tải dữ liệu
  // Nếu không có quyền -> Ẩn nội dung chính, hiện hộp gửi yêu cầu
  if (user) {
    mainContent.style.display = "block"; 
    permissionDeniedBox.style.display = "none";
    loadUsers()
    //Nếu chỉ có quyền Xem thì hiển thị thông báo và nút yêu câu quyền Sửa
    if (user.result.role === "view") { 
        permissionDeniedBox.style.display = "block";
        requestViewBtn.style.display = "none"; 
        notice.innerHTML = ` 
        <h2 style="color: #856404; margin-bottom: 10px"> 
            Tài khoản của bạn chỉ có quyền Xem (View) 
        </h2> 
        <p style="color: #6c757d; 
        margin-bottom: 20px"> 
            Bạn có thể xem dữ liệu nhưng không có quyền thực hiện thao tác Sửa. 
            Vui lòng yêu cầu Quản trị viên cấp quyền Sửa (Edit) nếu cần. 
        </p> `;
    } 
    }else { 
        mainContent.style.display = "none"; 
        permissionDeniedBox.style.display = "block"; 
        notice.innerHTML = ` 
        <h2 
        style="color: #dc3545; 
        margin-bottom: 10px"> 
            Bạn không có quyền truy cập trang này 
        </h2> 
        <p 
        style="color: #6c757d; 
        margin-bottom: 20px"> 
            Vui lòng đăng nhập vào tài khoản có quyền hoặc gửi yêu cầu cấp quyền đến Quản trị viên để tiếp tục. 
        </p> `;
        requestViewBtn.style.display = "block"; 
        requestEditBtn.style.display = "block"; 
    }
    
        setupRequestButtons();
    
});

// Hàm kiểm tra Session & Role từ Backend
async function checkPermission() {
  try {
    const res = await authApi.getMe()
    // Chưa đăng nhập, không làm gì
    if (res.status === 401) {
      return null;
    }
    const data = res.data
    // Kiểm tra xem role của user có thuộc danh sách được phép không
    if (data && ALLOWED_ROLES.includes(data.result.role)) {
      return data;
    }
    return null;
  } catch (err) {
    console.error("Lỗi xác thực quyền:", err);
    return null;
  }
}

//Lắng nghe sự kiện cho các nút Yêu cầu quyền (View / Edit)
function setupRequestButtons() {
  const reqViewBtn = document.getElementById("request-view-btn");
  const reqEditBtn = document.getElementById("request-edit-btn");
    //sự kiện yêu cầu quyền xem
  if (reqViewBtn) {
    reqViewBtn.onclick = () => sendPermissionRequest("view");
  }
  //sự kiện yêu cầu quyền xem và được sửa
  if (reqEditBtn) {
    reqEditBtn.onclick = () => sendPermissionRequest("edit");
  }
}

//Hàm gửi xử lý gửi yêu cầu cấp quyền
async function sendPermissionRequest(requestedRole) {
  try {
    const res = await permissionApi.requestPermission(requestedRole)
    alert(res.data.message);
    //Kiểm tra xem nếu người dùng yêu cầu quyền khác thì hỏi có muốn đổi quyền xin cấp không
    if (res.status==400&&res.data?.requestedRole!=requestedRole){
        //Xác nhận đổi quyền trong yêu cầu cấp quyền
        if(confirm(`Bạn có muốn đổi yêu cầu cấp quyền sang ${requestedRole}`)){
            const changeRes = await permissionApi.requestPermission(requestedRole,true)
            //Kiểm tra lại xem quyền đã đổi chưa
            if(changeRes.status===200){
                alert(`Đổi sang xin cấp quyền ${requestedRole} thành công`)
            }else{
                alert(changeRes.data.message);
            }
        }
    }
  }catch (err) {
    alert("Không thể gửi yêu cầu cấp quyền.");
  }
}
// render navbar
function initNavbar() {
    const container = document.getElementById("navbar-container");
        // Render HTML của Navbar vào Container
    if (container) {
        container.innerHTML = Navbar.render();
        //Kích hoạt bắt sự kiện Đăng xuất/Đăng nhập
        Navbar.afterRender();
    }
}
//Hàm lấy danh sách người dùng
async function loadUsers() {
    try {
        const {
            status,
            data
        } = await UserApi.getUsers();
        if (status !== 200) {
            alert(data.message || "Không thể lấy danh sách user");
            return;
        }
        renderUsers(data.result);
    } catch (error) {
        console.error("Lỗi loadUsers:", error);
        alert("Không thể kết nối tới server");
    }
}
//Hàm load UI danh sách người dùng với html
function renderUsers(users) {

    userList.innerHTML = "";
    //nếu chưa có người trong db
    if (!users || users.length === 0) {
        userList.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center;">
                    Chưa có người dùng
                </td>
            </tr>
        `;

        return;
    }
    users.forEach(user => {
        const tr = document.createElement("tr");
        // Nếu user có ảnh
        let imageHTML = "Không có ảnh";
        if (user.avatar || user.image) {
            const imagePath = user.avatar || user.image;
            const src = imagePath.startsWith('http') 
                ? imagePath 
                : ``;

            imageHTML = `<img src="${src}" class="avatar" alt="Avatar">`;
        }
        tr.innerHTML = `
            <td>
                ${user.id}
            </td>
            <td>
                ${imageHTML}
            </td>
            <td>
                ${user.name}
            </td>
            <td>
                ${user.email}
            </td>
            <td>
                <button
                    class="btn-edit"
                    data-id="${user.id}"
                >
                    Sửa
                </button>
                <button
                    class="btn-delete"
                    data-id="${user.id}"
                >
                    Xóa
                </button>
            </td>
        `;
        userList.appendChild(tr);
    });
}
//Xử lí khi submit (Nút 'lưu người dùng' và 'sửa người dùng')
form.addEventListener(
    "submit",
    async function (event) {
        event.preventDefault();
        const id = userIdInput.value.trim();
        let avatarUrl = typeof currentAvatarUrl !== "undefined" ? currentAvatarUrl : "";
        const userData = {
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            password: passwordInput.value,
            avatar: ""
        };
        //kiểm tra xem có file được tải lên không
        if (imageInput.files[0]) {
            const imageFormData = new FormData();
            imageFormData.append("image", imageInput.files[0]);

            const imgResponse = await imageApi.uploadImage(imageFormData)
            const { status, data: imgData } = imgResponse;
            //kiểm tra xem upload ảnh thành công chưa
            if (status < 200 || status >= 300 || !imgData.url) {
                throw new Error(
                    imgData.message || "Upload ảnh thất bại!"
                );
            }

            avatarUrl = imgData.url;
            userData.avatar=avatarUrl;
        }
        // bắt buộc nhập tên
        if (!userData.name) {
            alert("Vui lòng nhập tên!");
            nameInput.focus();
            return;
        }
        // email bắt buộc
        if (!userData.email) {
            alert("Vui lòng nhập email!");
            emailInput.focus();
            return;
        }
        // password bắt buộc
        if (!id && !userData.password) {
            alert("Vui lòng nhập mật khẩu!");
            passwordInput.focus();
            return;
        }
        try {
            const result = id 
            ? await UserApi.updateUser(id, userData) 
            : await UserApi.createUser(userData);
            const {
                status,
                data
            } = result;
            //xử lí response status
            if (
                status === 200 ||
                status === 201
            ) {
                alert(
                    data.message ||
                    "Thao tác thành công!"
                );
                resetForm();
                await loadUsers();
            }
            else {
                alert(
                    data.message ||
                    "Có lỗi xảy ra!"
                );
            }
        } catch (error) {
            console.error(
                "Lỗi submit:",
                error
            );
            alert(
                error||"Có lỗi xảy ra!"
            );
        }
    }
);

userList.addEventListener(
    "click",
    function (event) {
        const button =
            event.target.closest("button");
        if (!button) {
            return;
        }
        const id =
            button.dataset.id;
        // gắn hàm cho nút sửa
        if (
            button.classList.contains(
                "btn-edit"
            )
        ) {
            editUser(id);
        }
        // gắn hàm cho nút xóa
        if (
            button.classList.contains(
                "btn-delete"
            )
        ) {
            deleteUser(id);
        }
    }
);
//sửa người dùng với id
async function editUser(id) {
    try {
        const {
            status,
            data
        } = await UserApi.getUser(id);
        // Không tìm thấy người dùng
        if (status === 404) {
            alert(
                data.message ||
                "Không tìm thấy người dùng!"
            );
            return;
        }
        // API lỗi (ngoài 404)
        if (status !== 200) {
            alert(
                data.message ||
                "Không thể lấy thông tin người dùng!"
            );
            return;
        }
        const user = data.result;
        userIdInput.value =
            user.id;
        nameInput.value =
            user.name || "";
        emailInput.value =
            user.email || "";
        passwordInput.value =
            user.password || "";
        imageInput.value =
            "";
        formTitle.textContent =
            "Sửa người dùng";
        cancelBtn.style.display =
            "inline-block";
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    } catch (error) {
        console.error(
            "Lỗi editUser:",
            error
        );
        alert(
            error||"Có lỗi xảy ra!"
        );
    }
}
//Xóa người dùng với id
async function deleteUser(id) {
    const confirmDelete =
        confirm(
            `Bạn có chắc muốn xóa người dùng ID ${id}?`
        );
    //xác nhận xóa
    if (!confirmDelete) {
        return;
    }
    try {
        const {
            status,
            data
        } = await UserApi.deleteUser(id);
        //nếu xóa thành công, thông báo, tải lại danh sách
        if (status === 200) {
            alert(
                data.message ||
                "Xóa thành công!"
            );
            await loadUsers();
        }
        else {
            alert(
                data.message ||
                "Không thể xóa người dùng!"
            );
        }
    } catch (error) {
        console.error(
            "Lỗi deleteUser:",
            error
        );
        alert(
            error||"Có lỗi xảy ra!"
        );
    }
}
//reset các trường trong form
function resetForm() {
    form.reset();
    userIdInput.value =
        "";
    formTitle.textContent =
        "Thêm người dùng";
    cancelBtn.style.display =
        "none";
}
//gán sự kiện reset form
cancelBtn.addEventListener(
    "click",
    function () {
        resetForm();
    }
);
//gán sự kiện xuất file csv vào nút Export CSV
exportBtn.addEventListener("click", async function () {
    await UserApi.exportCSV();
});
//gán sự kiện nhập file csv vào nút Import CSV
importBtn.addEventListener("click", function () {
    csvFileInput.click();
});
//nhập file csv, thêm người dùng từ danh sách vào db
csvFileInput.addEventListener("change", async function () {
    const file = csvFileInput.files[0];
    //kiểm tra file tồn tại không
    if (!file) return;

    // Kiểm tra định dạng file
    if (!file.name.endsWith('.csv')) {
        alert("Vui lòng chỉ chọn file có định dạng .csv!");
        csvFileInput.value = "";
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
        const { status, data } = await UserApi.importCSV(formData);
      //kiểm tra xem thành công không
        if (status === 200 || status === 201) {
            alert(data.message || "Import dữ liệu thành công!");
            await loadUsers();
        } else {
            alert(data.message || "Có lỗi xảy ra khi import!");
        }
    } catch (error) {
        console.error("Lỗi Import CSV:", error);
        alert("Có lỗi xảy ra!");
    } finally {
        csvFileInput.value = "";
    }
});
//gán sự kiện vào nút gửi mail
sendEmailBtn.addEventListener("click", function () {
    emailToInput.value = "";
    emailSubjectInput.value = "";
    emailContentInput.value = "";
    emailModal.style.display = "block";
});
//gán sự kiện tắt form gửi mail
closeEmailModalBtn.addEventListener("click", function () {
    emailModal.style.display = "none";
});
//gán sự kiện vào nút gửi mail
confirmSendEmailBtn.addEventListener("click", async function () {
    const to = emailToInput.value.trim();
    const subject = emailSubjectInput.value.trim();
    const content = emailContentInput.value.trim();

    // Kiểm tra người nhận
    if (!to) {
        alert("Vui lòng nhập email người nhận (hoặc nhập ALL)!");
        emailToInput.focus();
        return;
    }
    // Kiểm tra tiêu đề
    if (!subject) {
        alert("Vui lòng nhập tiêu đề email!");
        emailSubjectInput.focus();
        return;
    }
    // Kiểm tra nội dung
    if (!content) {
        alert("Vui lòng nhập nội dung email!");
        emailContentInput.focus();
        return;
    }

    confirmSendEmailBtn.disabled = true;
    confirmSendEmailBtn.textContent = "Đang gửi...";

    try {
        const res = await UserApi.sendEmail({
            to: to,
            subject: subject,
            content: content
        });

        // Kiểm tra kết quả linh hoạt với dữ liệu trả về từ hàm request
        if (res && (res.status === 200 || res.status === 201 || res.success)) {
            alert(res.message || "Gửi email thành công!");
            emailModal.style.display = "none";
        } else {
            alert((res && res.message) || "Không thể gửi email!");
        }
    } catch (error) {
        console.error("Lỗi gửi email:", error);
        alert("Không thể kết nối tới server!");
    } finally {
        confirmSendEmailBtn.disabled = false;
        confirmSendEmailBtn.textContent = "Gửi";
    }
});