import cloudinary from "../config/cloudinaryConfig.js";
import streamifier from "streamifier";
//upload ảnh lên folder avatar của cloudinary
const uploadToCloudinary = (buffer, folder, resourceType, maxSizeMB = 5) => {
  return new Promise((resolve, reject) => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    //Giới hạn kích thước ảnh (mặc định là 5MB)
    if (buffer.length > maxSizeBytes) {
      return reject(
        new Error(`Kích thước file vượt quá giới hạn cho phép (${maxSizeMB}MB).`)
      );
    }
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};

export const uploadImage = (buffer) =>
    uploadToCloudinary(buffer, "avatar", "image");
