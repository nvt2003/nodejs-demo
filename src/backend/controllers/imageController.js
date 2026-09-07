import {uploadImage} from "../utils/CloudinaryServices.js"
import parseFormData from "../utils/parseFormData.js";
import sendJSON from "../utils/sendJson.js"

export const ImageController = {
  //Upload ảnh lên cloudinary
  //Trả về thông tin ảnh (url ảnh)
  upload: async (req, res) => {
    try {
      const formData = await parseFormData(req);

      const file = formData?.file
      //kiểm tra có file không
      if (!file) {
        return sendJSON(res,500,{
          message: "Vui lòng chọn ảnh."
        });
      }

      const result = await uploadImage(file.buffer);

      return sendJSON(res,200,{
        url: result.secure_url
      });

    } catch (error) {
      console.error("Lỗi upload image:", error);
      // Lỗi Cloudinary hết quota/credit
      if (
        error?.http_code === 420 ||
        error?.http_code === 429 ||
        error?.message?.toLowerCase().includes("quota") ||
        error?.message?.toLowerCase().includes("credits") ||
        error?.message?.toLowerCase().includes("resource limit")
      ) {
        return sendJSON(res, 503, {
          message: "Dịch vụ lưu trữ ảnh hiện đã hết dung lượng hoặc hạn mức. Vui lòng thử lại sau."
        });
      }
      return sendJSON(res,500,{
        message: error.message
      });
    }
  }
};
