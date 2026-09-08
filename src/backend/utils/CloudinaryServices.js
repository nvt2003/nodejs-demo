import cloudinary from "../config/cloudinaryConfig.js";
import streamifier from "streamifier";
//upload ảnh lên folder avatar của cloudinary
const uploadToCloudinary = (buffer, folder, resourceType) => {
  return new Promise((resolve, reject) => {
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
