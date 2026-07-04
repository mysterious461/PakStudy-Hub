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

  await storageFile.save(file.buffer, {
    metadata: {
      contentType: file.mimetype,
      metadata: {
        originalName: file.originalname,
        ownerId: userId,
      },
    },
    resumable: false,
  });

  const [signedUrl] = await storageFile.getSignedUrl({
    action: "read",
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
  });

  return {
    path,
    url: signedUrl,
    contentType: file.mimetype,
    size: file.size,
    originalName: file.originalname,
  };
}
