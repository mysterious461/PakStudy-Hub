import multer from "multer";
import { randomUUID } from "crypto";
import { bucket } from "./firebaseAdmin";

const allowedMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "application/csv",
  "application/zip",
  "application/x-zip-compressed",
  "application/x-rar-compressed",
  "application/vnd.rar",
  "application/x-7z-compressed",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/webm",
  "audio/wav",
  "video/mp4",
]);

const allowedExtensions = new Set([
  "pdf",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
  "txt",
  "csv",
  "zip",
  "rar",
  "7z",
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
  "mp3",
  "mp4",
]);

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const extension = extensionFor(file.originalname);
    if (!allowedMimeTypes.has(file.mimetype) && !allowedExtensions.has(extension)) {
      cb(Object.assign(new Error("Unsupported file type"), { status: 400 }));
      return;
    }
    cb(null, true);
  },
});

export function extensionFor(fileName: string) {
  return fileName.includes(".") ? fileName.split(".").pop()!.toLowerCase() : "bin";
}

function safeSegment(value: string) {
  return value
    .trim()
    .replace(/[\\/#?%*:|"<>]/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 90) || "Unspecified";
}

export async function saveUploadedFile(
  userId: string,
  file: Express.Multer.File,
  folder = "uploads",
  segments: string[] = [],
) {
  const extension = extensionFor(file.originalname);
  const organizedPath = segments.length ? `${segments.map(safeSegment).join("/")}/` : `${userId}/`;
  const path = `${folder}/${organizedPath}${Date.now()}-${randomUUID()}.${extension}`;
  const storageFile = bucket.file(path);
  const downloadToken = randomUUID();

  try {
    await storageFile.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
        metadata: {
          originalName: file.originalname,
          ownerId: userId,
          firebaseStorageDownloadTokens: downloadToken,
        },
      },
      resumable: false,
    });
  } catch (error: any) {
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET || "the Firebase Admin default bucket";
    const message = String(error?.message || "");
    if (message.toLowerCase().includes("bucket") && message.toLowerCase().includes("exist")) {
      throw Object.assign(
        new Error(`Firebase Storage bucket "${bucketName}" was not found. Check Cloud Run FIREBASE_STORAGE_BUCKET and Firebase Console > Storage.`),
        { status: 500 },
      );
    }
    throw error;
  }

  const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${downloadToken}`;

  return {
    path,
    url,
    contentType: file.mimetype,
    size: file.size,
    originalName: file.originalname,
  };
}
