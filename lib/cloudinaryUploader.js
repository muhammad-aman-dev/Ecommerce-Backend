// utils/cloudinaryUploader.js
import cloudinary from "../config/cloudinary.js";

// Upload a file to Cloudinary
export const uploadToCloudinary = async (filePath, folder = "default") => {
  if (!filePath) return null;

  try {
    const response = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "image"
    });

    const url = response.secure_url;
    console.log("Image Added...", url);

    return url;
  } catch (err) {
    console.error("Cloudinary Upload Error:", err);
    return null;
  }
};
// Delete file from Cloudinary
export const deleteFromCloudinary = async (url) => {
  if (!url) return null;

  try {
    const parts = url.split("/");
    const file = parts[parts.length - 1];
    const folder = parts[parts.length - 2];
    const publicId = `${folder}/${file.split(".")[0]}`;

    const result = await cloudinary.uploader.destroy(publicId);
    console.log("Deleted from Cloudinary:", result);
    return result;
  } catch (err) {
    console.error("Cloudinary delete error:", err);
    return null;
  }
};