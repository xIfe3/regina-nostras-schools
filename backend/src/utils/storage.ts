import crypto from "crypto";
import path from "path";
import multer from "multer";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

/**
 * File storage on Cloudflare R2 (S3-compatible).
 *
 * Required env:
 *   R2_ACCOUNT_ID         Cloudflare account ID
 *   R2_ACCESS_KEY_ID      R2 API token access key
 *   R2_SECRET_ACCESS_KEY  R2 API token secret
 *   R2_BUCKET             bucket name
 *   R2_PUBLIC_URL         public URL of the bucket (r2.dev URL or custom domain), e.g. https://files.example.com
 */

const ROOT_FOLDER = "regina-nostras-schools";

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "text/csv": ".csv",
  "application/csv": ".csv",
};

// Keep files in memory until they are sent to R2
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (MIME_EXTENSIONS[file.mimetype]) cb(null, true);
    else
      cb(new Error("Invalid file type. Only JPEG, PNG, GIF, WEBP, PDF, DOC, and CSV files are allowed."));
  },
});

export const isStorageConfigured = () =>
  Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET &&
      process.env.R2_PUBLIC_URL
  );

let client: S3Client | null = null;
const getClient = () => {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return client;
};

const publicBase = () => (process.env.R2_PUBLIC_URL || "").replace(/\/+$/, "");

/**
 * Upload a file to R2 and return its public URL.
 * Keys are random so URLs cannot be guessed.
 */
export const uploadFile = async (
  file: Express.Multer.File,
  options: { folder?: string } = {}
): Promise<string> => {
  if (!isStorageConfigured()) {
    throw new Error("File storage is not configured (set the R2_* environment variables)");
  }
  const folder = (options.folder || "general").replace(/^\/+|\/+$/g, "");
  const ext =
    MIME_EXTENSIONS[file.mimetype] || path.extname(file.originalname || "").toLowerCase() || "";
  const key = `${ROOT_FOLDER}/${folder}/${new Date().getFullYear()}/${crypto.randomUUID()}${ext}`;

  try {
    await getClient().send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
  } catch (error) {
    console.error("R2 upload error:", error);
    throw new Error("Failed to upload file");
  }
  return `${publicBase()}/${key}`;
};

/** Delete a file previously uploaded with uploadFile. Ignores URLs that are not in our bucket. */
export const deleteFile = async (url: string) => {
  const base = publicBase();
  if (!isStorageConfigured() || !base || !url.startsWith(`${base}/`)) return;
  const key = decodeURIComponent(url.slice(base.length + 1));
  try {
    await getClient().send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key }));
  } catch (error) {
    console.error("R2 delete error:", error);
  }
};
