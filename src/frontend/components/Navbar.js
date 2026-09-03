import UserApi from "../services/userApi.js";
import AuthApi from "../services/authApi.js";

const Navbar = {
    render() {
        const userJson = localStorage.getItem("user");
        const user = userJson ? JSON.parse(userJson) : null;

        return `
            <header class="main-header" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 24px; background-color: #2c3e50; color: #fff;">
                <div class="header-logo" style="font-weight: bold;">
                    <a href="#" style="color: #fff; text-decoration: none;">My App</a>
                    <a href="/" style="color: #fff; text-decoration: none;">User</a>
                    <a href="/permission" style="color: #fff; text-decoration: none;">Permission</a>
                </div>

                <div class="header-user-action" style="display: flex; align-items: center; gap: 12px;">
                    ${
                        user ? `
                            <img src="${user?.avatar || 'https://via.placeholder.com/35'}" alt="Avatar" style="width: 35px; height: 35px; border-radius: 50%; object-fit: cover;" />
                            <span>${user?.name || 'User'}</span>
                            <button id="logout-btn" type="button" style="padding: 6px 12px; background-color: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;">Đăng xuất</button>
                        ` : `
                            <button id="open-login-btn" type="button" style="padding: 6px 16px; background-color: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">Đăng nhập</button>
                        `
                    }
                </div>
            </header>

            <!-- Modal Form Đăng nhập -->
            <div id="login-modal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000;">
                <div style="background: #fff; width: 350px; margin: 100px auto; padding: 20px; border-radius: 8px; color: #333;">
                    <h3 style="margin-top: 0;">Đăng Nhập</h3>
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; margin-bottom: 4px;">Email:</label>
                        <input type="email" id="login-email" style="width: 100%; padding: 8px; box-sizing: border-box;">
                    </div>
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 4px;">Mật khẩu:</label>
                        <input type="password" id="login-password" style="width: 100%; padding: 8px; box-sizing: border-box;">
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 8px;">
                        <button type="button" id="close-login-btn" style="padding: 8px 16px;">Hủy</button>
                        <button type="button" id="submit-login-btn" style="padding: 8px 16px; background: #3498db; color: white; border: none; border-radius: 4px;">Đăng nhập</button>
                    </div>
                </div>
            </div>
        `;
    },

    afterRender() {
        const openLoginBtn = document.getElementById("open-login-btn");
        const closeLoginBtn = document.getElementById("close-login-btn");
        const submitLoginBtn = document.getElementById("submit-login-btn");
        const logoutBtn = document.getElementById("logout-btn");

        const loginModal = document.getElementById("login-modal");
        const loginEmail = document.getElementById("login-email");
        const loginPassword = document.getElementById("login-password");

        // Mở / Đóng Modal Login
        if (openLoginBtn) openLoginBtn.addEventListener("click", () => loginModal.style.display = "block");
        if (closeLoginBtn) closeLoginBtn.addEventListener("click", () => loginModal.style.display = "none");

        //Xử lý ĐĂNG NHẬP
        if (submitLoginBtn) {
            submitLoginBtn.addEventListener("click", async () => {
                const email = loginEmail.value.trim();
                const password = loginPassword.value.trim();
                //validate
                if (!email || !password) {
                    alert("Vui lòng nhập đầy đủ thông tin!");
                    return;
                }

                submitLoginBtn.disabled = true;
                submitLoginBtn.textContent = "Đang xử lý...";

                try {
                    const res = await UserApi.login({ email, password });
                    //kiểm tra xem đăng nhập thành công chưa
                    if (res && res.status === 200 && res.data?.result) {
                        const user = res.data.result;
                        localStorage.setItem("user", JSON.stringify(user));
                        alert("Đăng nhập thành công!");
                        window.location.reload(); 
                    } else {
                        alert(res.message || "Đăng nhập thất bại!");
                    }
                } catch (error) {
                    console.error("Lỗi đăng nhập:", error);
                    alert("Không thể kết nối đến máy chủ!");
                } finally {
                    submitLoginBtn.disabled = false;
                    submitLoginBtn.textContent = "Đăng nhập";
                }
            });
        }

        //Xử lý ĐĂNG XUẤT
        if (logoutBtn) {
            logoutBtn.addEventListener("click", async() => {
                const res = await AuthApi.logout()
                if (res?.status===200){
                    localStorage.removeItem("user");
                    alert("Đã đăng xuất!");
                }else{
                    alert("Đăng xuất thất bại!")
                }
                window.location.reload();
            });
        }
    }
};

export default Navbar;
export function initNavbar() { 
    const container = document.getElementById("navbar-container"); 
    // Render HTML của Navbar 
    // Kích hoạt sự kiện đăng nhập / đăng xuất 
    if (container) { 
        container.innerHTML = Navbar.render(); 
        Navbar.afterRender(); 
    } 
}