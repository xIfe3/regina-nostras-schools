import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer to store files in memory temporarily
const storage = multer.memoryStorage();

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/csv",
      "application/csv",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only JPEG, PNG, GIF, WEBP, PDF, DOC, and CSV files are allowed."
        )
      );
    }
  },
});

export const uploadFile = async (
  fileInput: Express.Multer.File | Buffer,
  options: {
    folder?: string;
    transformation?: any[];
  } = {}
) => {
  try {
    const { folder = "general", transformation } = options;

    let uploadOptions: any = {
      folder: `regina-nostras-schools/${folder}`,
      resource_type: "auto",
    };

    if (transformation) {
      uploadOptions.transformation = transformation;
    }

    let result;

    if (Buffer.isBuffer(fileInput)) {
      // Handle buffer upload
      result = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(uploadOptions, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          })
          .end(fileInput);
      });
    } else {
      // Handle multer file upload (from memory storage)
      result = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(uploadOptions, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          })
          .end(fileInput.buffer);
      });
    }

    return (result as any).secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload file");
  }
};

export const deleteFile = async (publicId: string) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw new Error("Failed to delete file");
  }
};

export { cloudinary };
