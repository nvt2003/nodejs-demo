import userModel from "../models/userModel.js";
import sendJSON from "../utils/sendJson.js";
import getBody from "../utils/getBody.js";
import parseFormData from "../utils/parseFormData.js";
import csv from 'fast-csv';
import Busboy from 'busboy';
import sendEmail from "../utils/sendEmail.js";

export const userController={
    //lấy danh sách user gồm id, name, email, password, avatar
    getUsers:async(req,res)=>{
        try{
            const users = await userModel.getUsers();
            //Kiểm tra xem đã lấy dữ liệu chưa
            if (users){
                return sendJSON(res, 200, {
                    message:'Lấy người dùng thành công!',
                    result:users
                });
            }else{
                return sendJSON(res, 500,{
                    message:'Có lỗi xảy ra khi lấy dữ liệu!'
                })
            }
        }catch(error){
            console.log("Lỗi: ",error.message)
            return sendJSON(res,500,{
                message:error.message
            })
        }
    },
    //lấy thông tin user gồm id, name, email, password, avatar
    getUserById: async (req, res,userId) => {
        try {

            const user = await userModel.getUserById(userId);

            if (user) {
                return sendJSON(res,200,{
                    message: 'Lấy người dùng thành công!',
                    result: user
                });
            } else {
                return sendJSON(res,404,{
                    message: 'Không tìm thấy người dùng!'
                });
            }

        } catch (error) {
            console.log("Lỗi: ", error.message);

            return sendJSON(res,500,{
                message: error.message
            });
        }
    },
    //tạo user với name, email, password, avatar (url, không bắt buộc)
    createUser:async(req,res)=>{
        try{
            const { name, email, password, avatar } = await getBody(req)
            
            //kiểm tra dữ liệu rỗng
            if (!name || !email || !password) {
                return sendJSON(res, 400, {
                    message: "Vui lòng cung cấp email hoặc password cần sửa!"
                });
            }
            //Kiểm tra xem đã thêm thành công chưa
            if (await userModel.createUser(name, email, password, avatar)) {
                return sendJSON(res,200,{
                    message:'Thêm người dùng thành công!',
                })
            }else{
                return sendJSON(res,500,{
                    message:'Có lỗi xảy ra trong quá trình thêm!'
                })
            }
        }catch(error){
            console.log("Lỗi: ",error.message)
            return sendJSON(res,500,{
                message:error.message
            })
        }
    },
    //cập nhật user với name, email, password, avatar (url, không bắt buộc)
    updateUser: async (req, res, userId) => {
        try {
            const { name, email, password, avatar } = await getBody(req)

            // Kiểm tra dữ liệu rỗng
            if (!name && !email && !password) {
                return sendJSON(res, 400, {
                    message: "Vui lòng cung cấp ít nhất một thông tin (name, email, password hoặc avatar) để sửa!"
                });
            }

            const isUpdated = await userModel.updateUser(userId, name, email, password, avatar);

            // Nếu update thành công
            if (isUpdated) {
                return sendJSON(res, 200, {
                    message: 'Sửa người dùng thành công!',
                    ...(avatar && { avatar })
                });
            } else {
                return sendJSON(res, 400, {
                    message: 'Không tìm thấy người dùng hoặc dữ liệu không có sự thay đổi!'
                });
            }
        } catch (error) {
            console.log("Lỗi: ", error.message);
            return sendJSON(res, 500, {
                message: error.message
            });
        }
    },
    //delete a user by id
    deleteUser:async(req,res,id)=>{
        try{
            const user = await userModel.getUserById(id)
            //Kiểm tra xem dữ liệu tồn tại không
            if (user){
                //Kiểm tra xem đã xóa thành công chưa
                if (await userModel.deleteUser(id)){
                    return sendJSON(res,200,{
                        message:'Xóa người dùng thành công!',
                        result:user
                    })
                }else{
                    return sendJSON(res,500,{
                        message:'Có lỗi xảy ra trong quá trình xóa!'
                    })
                }
            }else{
                return sendJSON(res,404,{
                    message:'Không tìm thấy dữ liệu để xóa!'
                })
            }
        }catch(error){
            console.log("Lỗi: ",error.message)
            return sendJSON(res,500,{
                message:error.message
            })
        }
    },
    //Xuất file csv vào thư mục download mặc định của trình duyệt
    exportCSV: async (req, res) => {
        try {
            const rows = await userModel.getUsers();

            res.writeHead(200, {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': 'attachment; filename="users_export.csv"',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS'
            });

            const csvStream = csv.format({ headers: true });
            csvStream.pipe(res);

            rows.forEach(row => csvStream.write(row));
            csvStream.end();

        } catch (error) {
            console.error('Lỗi khi export CSV:', error.message);
            return sendJSON(res, 500, { message: 'Không thể xuất file CSV: ' + error.message });
        }
    },
    //nhập dữ liệu từ file csv đã chọn
    importCSV: async (req, res) => {
        try {
            const contentType = req.headers['content-type'] || '';
            //kiểm tra file đúng dạng chưa
            if (!contentType.includes('multipart/form-data')) {
                return sendJSON(res, 400, { message: 'Vui lòng gửi file dưới dạng multipart/form-data' });
            }

            const users = await new Promise((resolve, reject) => {
                const busboy = Busboy({ headers: req.headers });
                const parsedUsers = [];
                let parseStream = null;

                busboy.on('file', (fieldname, fileStream) => {
                    parseStream = fileStream
                        .pipe(csv.parse({ 
                            headers: headers => headers.map(h => h?.replace(/^\uFEFF/, '').trim().toLowerCase()),
                            ignoreEmpty: true 
                        }))
                        .on('data', (row) => {
                            //nếu hàng tên mà email có dữ liệu
                            if (row.name && row.email) {
                                parsedUsers.push({
                                    name: row.name.trim(),
                                    email: row.email.trim(),
                                    password: row.password ? row.password.trim() : '123456',
                                    avatar: row.avatar ? row.avatar.trim() : null
                                });
                            }
                        })
                        .on('error', (err) => reject(err));
                });

                busboy.on('finish', () => {
                    // Nếu fileStream có chạy, đợi parseStream kết thúc hoàn toàn
                    if (parseStream) {
                        parseStream.on('end', () => resolve(parsedUsers));
                    } else {
                        resolve(parsedUsers);
                    }
                });

                busboy.on('error', (err) => reject(err));

                req.pipe(busboy);
            });

            // 2. Kiểm tra dữ liệu sau khi ĐÃ READ XONG 100%
            if (!users || users.length === 0) {
                return sendJSON(res, 400, { message: 'File CSV trống hoặc không có dữ liệu hợp lệ!' });
            }

            let successCount = 0;
            //Tiến hành Insert vào Database bằng userModel.createUser
            for (const user of users) {
                try {
                    const isCreated = await userModel.createUser(
                        user.name,
                        user.email,
                        user.password,
                        user.avatar
                    );
                    //đếm số dòng insert thành công
                    if (isCreated) successCount++;
                } catch (err) {
                    console.error(`Lỗi khi tạo user ${user.email}:`, err.message);
                }
            }

            return sendJSON(res, 200, {
                message: `Import hoàn tất! Đã thêm thành công ${successCount}/${users.length} người dùng.`,
                count: successCount
            });

        } catch (error) {
            console.error('Lỗi khi import CSV:', error.message);
            return sendJSON(res, 500, { message: 'Lỗi import CSV: ' + error.message });
        }
    },
    //gửi mail với resend
    sendEmail: async(req,res)=>{
        const { to, subject, content } = await getBody(req);
        try{
            const response = await sendEmail(to,subject,content);
            //nếu thành công
            if (response){
                return sendJSON(res,200,{
                    message:"Gửi email thành công"
                })
            }else {
            return sendJSON(res,500,{
                message:"Gửi email thất bại"
            })
        }
        }catch(error){
            return sendJSON(res,500,{
                message:"Gửi email thất bại"
            })
        }
    },
    //Kiểm tra thông tin đăng nhập
    checklogin: async(req,res)=>{
        const {email,password} = await getBody(req);
        try{
            const response = await userModel.checklogin(email,password);
            //kiểm tra xem đăng nhập thành công không
            if (response&&response.length>0){
                return sendJSON(res,200,{
                    message:"Đăng nhập thành công",
                    result:response[0]
                })
            }else{
                return sendJSON(res,500,{
                    message:"Không tìm thấy thông tin đăng nhập! Sai tài khoản hoặc mật khẩu!",
                    result:response[0]
                })
            }
        }catch(error){
            return sendJSON(res,500,{
                message:"Đăng nhập thất bại"
            })
        }
    }
}