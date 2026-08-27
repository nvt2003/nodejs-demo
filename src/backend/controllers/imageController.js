import {uploadImage} from "../utils/CloudinaryServices.js"
import parseFormData from "../utils/parseFormData.js";
import sendJSON from "../utils/sendJson.js"

export const ImageController = {
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
      console.error("Error in upload image:", error);

      return sendJSON(res,500,{
        message: error.message
      });
    }
  }
};
