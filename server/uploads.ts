import multer from "multer";
import { randomUUID } from "crypto";
import { bucket } from "./firebaseAdmin";

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "audio/mpeg",
  "audio/mp4",
  "audio/webm",
  "audio/wav",
]);

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      cb(Object.assign(new Error("Unsupported file type"), { status: 400 }));
      return;
    }
    cb(null, true);
  },
});

export async function saveUploadedFile(userId: string, file: Express.Multer.File, folder = "uploads") {
  const extension = file.originalname.includes(".") ? file.originalname.split(".").pop() : "bin";
  const path = `${folder}/${userId}/${Date.now()}-${randomUUID()}.${extension}`;
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
