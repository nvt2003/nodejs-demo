import userModel from "../models/userModel.js";
import sendJSON from "../utils/sendJson.js";
import getBody from "../utils/getBody.js";
import csv from 'fast-csv';
import Busboy from 'busboy';
import iconv from "iconv-lite";
import sendEmail from "../utils/sendEmail.js";

export const userController={
    //lấy danh sách user gồm id, name, email, password, avatar
    getUsers:async(req,res)=>{
        try{
            const users = await userModel.getUsers();
            //Kiểm tra xem đã lấy dữ liệu chưa
            //thành công thì trả về dữ liệu danh sách users
            //không thì trả về lỗi
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
            //Kiểm tra xem đã lấy dữ liệu user thành công chưa
            //thành công thì trả về dữ liệu user
            //không thì trả về lỗi
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
    //tạo user với name, email, password, avatar (avatar không bắt buộc)
    createUser:async(req,res)=>{
        try{
            const { name, email, password, avatar } = await getBody(req)
            //kiểm tra dữ liệu rỗng
            if (!name || !email || !password) {
                return sendJSON(res, 400, {
                    message: "Vui lòng cung cấp tên, email, mật khẩu để tạo!"
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
            if (error.message.includes('users.unique_email'))
                return sendJSON(res,500,{
                    message:'Email đã tồn tại'
                })
            return sendJSON(res,500,{
                message:error.message
            })
        }
    },
    //cập nhật user với name, email, password, avatar (password, avatar không bắt buộc)
    updateUser: async (req, res, userId) => {
        try {
            let { name, email, password, avatar } = await getBody(req)
            // Kiểm tra dữ liệu rỗng
            if (!name && !email) {
                return sendJSON(res, 400, {
                    message: "Vui lòng cung cấp thông tin tên, email để sửa!"
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
    //xóa user theo id
    deleteUser:async(req,res,id)=>{
        try{
            const user = await userModel.getUserById(id)
            //Kiểm tra xem dữ liệu tồn tại không
            //trả về lỗi 404 nếu không tìm thấy
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
    //Xuất file csv tên users_export.csv vào thư mục download mặc định của trình duyệt
    exportCSV: async (req, res) => {
        try {
            const rows = await userModel.getUsers();

            res.writeHead(200, {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': 'attachment; filename="users_export.csv"',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS'
            });

            res.write(Buffer.from('\uFEFF', 'utf8'));
            const csvStream = csv.format({ headers: true });
            csvStream.pipe(res);

            rows.forEach(row => csvStream.write(row));
            csvStream.end();

        } catch (error) {
            console.error('Lỗi khi export CSV:', error.message);
            return sendJSON(res, 500, { 
                message: 'Không thể xuất file CSV: ' + error.message 
            });
        }
    },
    //nhập dữ liệu từ file csv đã chọn
    importCSV: async (req, res) => {
        try {
            const contentType = req.headers['content-type'] || '';
            //kiểm tra file đúng dạng chưa
            if (!contentType.includes('multipart/form-data')) {
                return sendJSON(res, 400, { 
                    message: 'Vui lòng gửi file dưới dạng multipart/form-data' 
                });
            }

            const users = await new Promise((resolve, reject) => {
                const busboy = Busboy({ headers: req.headers });
                let fileChunks = [];
                let hasFile = false;

                busboy.on("file", (fieldname, fileStream) => {
                    hasFile = true;
                    fileStream.on("data", (chunk) => {
                        fileChunks.push(chunk);
                    });
                    fileStream.on("end", () => {
                        try {
                            const buffer = Buffer.concat(fileChunks);
                            let content;
                            // Nếu có UTF-8 BOM
                            // Không thì thử đọc utf-8
                            if (
                                buffer[0] === 0xEF &&
                                buffer[1] === 0xBB &&
                                buffer[2] === 0xBF
                            ) {
                                content = buffer
                                    .subarray(3)
                                    .toString("utf8");

                            } else {
                                const utf8 = buffer.toString("utf8");
                                //Xử lí utf-8
                                //không phải thì xử lí Fallback Windows-1258
                                if (!utf8.includes("\uFFFD")) {
                                    content = utf8;
                                } else {
                                    content = iconv.decode(
                                        buffer,
                                        "win1258"
                                    );
                                }
                            }

                            const parsedUsers = [];

                            csv.parseString(content, {
                                headers: headers =>
                                    headers.map(h =>
                                        h
                                            ?.replace(/^\uFEFF/, "")
                                            .trim()
                                            .toLowerCase()
                                    ),
                                ignoreEmpty: true,
                                trim: true
                            })
                            .on("data", row => {
                                //Kiểm tra thông tin tên và email
                                //Đủ thì thêm vào danh sách chuẩn bị nhập vào db
                                //Mật khẩu nếu không có thì để mặc định
                                //Avatar không bắt buộc
                                if (row.name && row.email) {
                                    parsedUsers.push({
                                        name: row.name.trim(),
                                        email: row.email.trim(),
                                        password: row.password
                                            ? row.password.trim()
                                            : "123456",
                                        avatar: row.avatar
                                            ? row.avatar.trim()
                                            : null
                                    });
                                }
                            })
                            .on("end", () => {
                                resolve(parsedUsers);
                            })
                            .on("error", reject);

                        } catch (error) {
                            reject(error);
                        }
                    });
                    fileStream.on("error", reject);
                });
                busboy.on("finish", () => {
                    if (!hasFile) {
                        resolve([]);
                    }
                });
                busboy.on("error", reject);
                req.pipe(busboy);
            });

            // Kiểm tra dữ liệu sau khi ĐÃ READ XONG 100%
            if (!users || users.length === 0) {
                return sendJSON(res, 400, { 
                    message: 'File CSV trống hoặc không có dữ liệu hợp lệ!' 
                });
            }

            let successCount = 0;
            //Tiến hành thêm user theo danh sách đã đọc vào Database 
            for (const user of users) {
                try {
                    const isCreated = await userModel.createUser(
                        user.name,
                        user.email,
                        user.password,
                        user.avatar
                    );
                    //đếm số user thêm thành công
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
            return sendJSON(res, 500, { 
                message: 'Lỗi import CSV: ' + error.message 
            });
        }
    },
    //gửi mail với resend
    //mail gửi mặc định của resend: onboarding@resend.dev
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
    //trả về thông tin user gồm id,name,email,avatar,role
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