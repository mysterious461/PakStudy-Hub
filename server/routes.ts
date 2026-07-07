import type { Express, Request, Response } from "express";
import { type Server } from "http";
import { z, ZodError, type ZodSchema } from "zod";
import {
  adminMessageSchema,
  aiTutorMessageSchema,
  contributorResourceSchema,
  createAnswerSchema,
  createQuestionSchema,
  directMessageSchema,
  flashcardSchema,
  pendingCourseSchema,
  purchaseSchema,
  reportSchema,
  resourceReviewSchema,
  resourceUploadSchema,
  studyRoomSchema,
  supportMessageSchema,
  updateProfileSchema,
  walletTopUpSchema,
} from "@shared/schema";
import { requireAdmin, requireAuth } from "./auth";
import { logEvent } from "./analytics";
import { createNotePurchaseIntent, createWalletTopUpIntent, requireStripe, stripe } from "./payments";
import { storage } from "./storage";
import { extensionFor, saveUploadedFile, upload } from "./uploads";
import { FieldValue, adminAuth, bucket, db, getFirebaseAdminDiagnostics, toDate } from "./firebaseAdmin";

function trackEvent(eventName: string, userId: string | undefined, properties: Record<string, unknown> = {}) {
  void logEvent(eventName, userId, properties);
}

function parseBody<T extends ZodSchema>(schema: T, req: Request): z.infer<T> {
  return schema.parse(req.body);
}

function sendError(res: Response, error: unknown) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: "Validation failed",
      errors: error.errors.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    });
  }

  const status = typeof error === "object" && error && "status" in error ? Number(error.status) : 500;
  const message = error instanceof Error ? error.message : "Internal Server Error";
  return res.status(status || 500).json({ message });
}

function logApiError(endpoint: string, error: unknown, req?: Request) {
  const status = typeof error === "object" && error && "status" in error ? Number(error.status) : 500;
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(JSON.stringify({
    level: "error",
    endpoint,
    status: status || 500,
    message,
    userId: req?.user?.uid ?? null,
    method: req?.method ?? null,
  }));
}

const asyncRoute =
  (handler: (req: Request, res: Response) => Promise<unknown>, endpointName?: string) =>
  async (req: Request, res: Response) => {
    try {
      const result = await handler(req, res);
      if (!res.headersSent) res.json(result);
    } catch (error) {
      if (endpointName) logApiError(endpointName, error, req);
      sendError(res, error);
    }
  };

function currentUser(req: Request) {
  if (!req.user) throw Object.assign(new Error("Authentication required"), { status: 401 });
  return req.user;
}

async function optionalCurrentUser(req: Request) {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) return undefined;
  try {
    const decoded = await adminAuth.verifyIdToken(header.slice("Bearer ".length).trim());
    const existing = await storage.getUser(decoded.uid);
    return {
      uid: decoded.uid,
      email: decoded.email,
      name: existing?.name || decoded.name || decoded.email?.split("@")[0] || "Student",
      role: existing?.role || "Student",
    };
  } catch {
    return undefined;
  }
}

function parseResourceUploadBody(body: Request["body"]) {
  const tagsValue = typeof body.tags === "string" ? body.tags : "";
  return resourceUploadSchema.parse({
    ...body,
    tags: tagsValue
      .split(",")
      .map((tag: string) => tag.trim())
      .filter(Boolean),
  });
}

function parseTags(value: unknown) {
  return typeof value === "string"
    ? value.split(",").map((tag: string) => tag.trim()).filter(Boolean)
    : [];
}

function parseContributorUploadBody(body: Request["body"]) {
  return contributorResourceSchema.parse({
    ...body,
    course: body.course || body.courseCode,
    subject: body.subject || body.courseTitle,
    tags: parseTags(body.tags),
    hasPermission: body.hasPermission === "true" || body.hasPermission === true,
  });
}

function parseBooleanField(value: unknown) {
  return value === true || value === "true" || value === "1" || value === "yes";
}

function detectFileKind(file: Express.Multer.File) {
  const extension = extensionFor(file.originalname);
  const office = {
    doc: "word",
    docx: "word",
    ppt: "powerpoint",
    pptx: "powerpoint",
    xls: "excel",
    xlsx: "excel",
  } as Record<string, string>;

  if (extension === "pdf" || file.mimetype === "application/pdf") return { extension, category: "pdf", maxSize: 25 * 1024 * 1024 };
  if (office[extension]) return { extension, category: office[extension], maxSize: 50 * 1024 * 1024 };
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(extension) || file.mimetype.startsWith("image/")) return { extension, category: "image", maxSize: 10 * 1024 * 1024 };
  if (["mp3"].includes(extension) || file.mimetype.startsWith("audio/")) return { extension, category: "audio", maxSize: 50 * 1024 * 1024 };
  if (extension === "mp4" || file.mimetype.startsWith("video/")) return { extension, category: "video", maxSize: 100 * 1024 * 1024 };
  if (["zip", "rar", "7z"].includes(extension)) return { extension, category: "archive", maxSize: 100 * 1024 * 1024 };
  if (["txt", "csv"].includes(extension) || file.mimetype.startsWith("text/")) return { extension, category: "text", maxSize: 50 * 1024 * 1024 };
  return { extension, category: "unsupported", maxSize: 0 };
}

function validateContributorFile(file: Express.Multer.File) {
  const fileKind = detectFileKind(file);
  if (fileKind.category === "unsupported") {
    throw Object.assign(new Error("Unsupported file type"), { status: 400 });
  }

  if (file.size > fileKind.maxSize) {
    throw Object.assign(new Error(`${fileKind.category.toUpperCase()} files must be ${Math.round(fileKind.maxSize / (1024 * 1024))} MB or smaller`), { status: 400 });
  }

  return fileKind;
}

function isAdminRoleValue(role?: string) {
  return role === "Admin" || role === "Moderator";
}
function requireStrictAdmin(req: Request) {
  const user = currentUser(req);
  if (user.role !== "Admin") {
    throw Object.assign(new Error("Admin role required for permanent resource deletion"), { status: 403 });
  }
  return user;
}

function deriveStoragePathFromUrl(url?: string) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    const objectMarker = "/o/";
    const objectIndex = parsed.pathname.indexOf(objectMarker);
    if (objectIndex >= 0) {
      return decodeURIComponent(parsed.pathname.slice(objectIndex + objectMarker.length));
    }
    if (parsed.hostname === "storage.googleapis.com") {
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts.length > 1) return decodeURIComponent(parts.slice(1).join("/"));
    }
  } catch {
    return "";
  }
  return "";
}

function storagePathForResource(data: Record<string, any>) {
  return data.storagePath
    || data.storageObjectPath
    || data.filePath
    || data.file?.path
    || deriveStoragePathFromUrl(data.fileUrl || data.file?.url);
}

async function writeResourceAuditLog(input: {
  action: "resource_deleted" | "resource_hidden" | "resource_storage_path_backfill";
  resourceId?: string;
  resourceTitle?: string;
  fileName?: string;
  storagePath?: string;
  performedBy: string;
  performedByEmail?: string;
  result: string;
  errorMessage?: string;
}) {
  await db.collection("adminAuditLogs").add({
    action: input.action,
    resourceId: input.resourceId ?? "",
    resourceTitle: input.resourceTitle ?? "",
    fileName: input.fileName ?? "",
    storagePath: input.storagePath ?? "",
    performedBy: input.performedBy,
    performedByEmail: input.performedByEmail ?? "",
    result: input.result,
    errorMessage: input.errorMessage ?? "",
    createdAt: FieldValue.serverTimestamp(),
  });
}

function normalizePublicResource(id: string, data: Record<string, any>) {
  const isAdminCurated = Boolean(data.isAdminCurated);
  const publicSourceLabel = data.sourceLabel || "PakStudy Hub Team";
  const showAdminNamePublicly = Boolean(data.showAdminNamePublicly);
  const file = data.file ?? {
    path: data.filePath ?? "",
    url: data.fileUrl ?? "",
    contentType: data.fileType ?? "",
    size: data.fileSize ?? 0,
    originalName: data.fileName ?? "",
  };
  return {
    id,
    university: data.university ?? "",
    faculty: data.faculty ?? data.department ?? "",
    department: data.department ?? data.faculty ?? "",
    degree: data.degree ?? "",
    semester: data.semester ?? "",
    course: data.course ?? data.courseCode ?? "",
    courseCode: data.courseCode ?? data.course ?? "",
    courseTitle: data.courseTitle ?? data.subject ?? data.course ?? "",
    subject: data.subject ?? data.courseTitle ?? data.course ?? "",
    resourceCategory: data.resourceCategory ?? data.resourceType ?? "notes",
    resourceType: data.resourceType ?? data.resourceCategory ?? "notes",
    title: data.title ?? "Untitled resource",
    year: data.year ?? new Date().getFullYear(),
    language: data.language ?? "English",
    description: data.description ?? "",
    tags: data.tags ?? [],
    status: data.status ?? data.reviewStatus ?? "pending",
    visibility: data.visibility ?? "private",
    uploadedBy: isAdminCurated ? "" : data.uploadedBy ?? data.uploaderId ?? "",
    uploadedByName: isAdminCurated && !showAdminNamePublicly ? publicSourceLabel : data.uploadedByName ?? data.uploaderName ?? data.uploaderNameSource ?? "Contributor",
    uploaderId: isAdminCurated ? "" : data.uploaderId ?? data.uploadedBy ?? "",
    uploaderEmail: isAdminCurated ? "" : data.uploaderEmail ?? "",
    isAdminCurated,
    sourceType: data.sourceType ?? (isAdminCurated ? "admin_curated" : "contributor_submitted"),
    sourceLabel: publicSourceLabel,
    sourceNote: data.sourceNote ?? "",
    showAdminNamePublicly,
    approvedAt: data.approvedAt ? toDate(data.approvedAt).toISOString() : undefined,
    file,
    fileUrl: data.fileUrl ?? file.url,
    fileName: data.fileName ?? file.originalName,
    fileType: data.fileType ?? file.contentType,
    fileSize: data.fileSize ?? file.size,
    fileCategory: data.fileCategory ?? "",
    fileExtension: data.fileExtension ?? "",
    views: data.views ?? 0,
    downloads: data.downloads ?? 0,
    searchableKeywords: data.searchableKeywords ?? buildResourceKeywords({ id, ...data }),
    createdAt: toDate(data.createdAt).toISOString(),
    updatedAt: data.updatedAt ? toDate(data.updatedAt).toISOString() : undefined,
  };
}

function buildResourceKeywords(resource: Record<string, any>) {
  const values = [
    resource.title,
    resource.courseCode,
    resource.courseTitle,
    resource.course,
    resource.subject,
    resource.university,
    resource.faculty,
    resource.department,
    resource.degree,
    resource.semester,
    resource.resourceCategory,
    resource.resourceType,
    resource.year,
    resource.language,
    resource.uploadedByName,
    resource.uploaderName,
    resource.uploaderNameSource,
    ...(Array.isArray(resource.tags) ? resource.tags : []),
  ];
  return Array.from(new Set(values.flatMap((value) => String(value || "").toLowerCase().split(/[^a-z0-9]+/)).filter(Boolean)));
}

function matchesResourceFilters(resource: any, query: Request["query"], userRole?: string) {
  const isAdmin = isAdminRoleValue(userRole);
  const status = typeof query.status === "string" ? query.status : "";
  const normalizedStatus = status === "needs_changes" ? "changes_requested" : status;
  if (isAdmin && normalizedStatus && normalizedStatus !== "all" && resource.status !== normalizedStatus) return false;
  if (!isAdmin && resource.status !== "approved") return false;

  const filters = [
    ["university", resource.university],
    ["faculty", resource.faculty || resource.department],
    ["degree", resource.degree],
    ["semester", resource.semester],
    ["courseCode", resource.courseCode],
    ["courseTitle", resource.courseTitle],
    ["resourceType", resource.resourceCategory || resource.resourceType],
    ["year", String(resource.year || "")],
    ["language", resource.language],
  ] as const;
  for (const [key, value] of filters) {
    const expected = typeof query[key] === "string" ? String(query[key]).trim().toLowerCase() : "";
    if (expected && !String(value || "").toLowerCase().includes(expected)) return false;
  }

  const search = typeof query.search === "string" ? query.search.trim().toLowerCase() : "";
  if (!search) return true;
  const haystack = [
    resource.title,
    resource.courseCode,
    resource.courseTitle,
    resource.course,
    resource.subject,
    resource.university,
    resource.faculty,
    resource.department,
    resource.degree,
    resource.semester,
    resource.resourceCategory,
    resource.resourceType,
    resource.year,
    resource.language,
    resource.uploadedByName,
    ...(resource.tags || []),
    ...(resource.searchableKeywords || []),
  ].join(" ").toLowerCase();
  return search.split(/\s+/).every((term) => haystack.includes(term));
}

function canViewResource(resource: any, user?: { uid: string; role?: string }) {
  if (resource.status === "approved") return true;
  if (!user) return false;
  return isAdminRoleValue(user.role) || resource.uploaderId === user.uid || resource.uploadedBy === user.uid;
}

const userProfilePatchSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  university: z.string().trim().max(160).optional(),
  department: z.string().trim().max(160).optional(),
  degree: z.string().trim().max(160).optional(),
  grade: z.string().trim().max(80).optional(),
  bio: z.string().trim().max(500).optional(),
});

const contactMessageSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(160),
  category: z.enum(["General inquiry", "Upload problem", "Copyright concern", "Report content", "Partnership", "Technical issue"]),
  message: z.string().min(10).max(2000),
});

const contactStatusSchema = z.object({
  status: z.enum(["new", "reviewed", "resolved"]),
});

type AuthenticatedUser = NonNullable<Request["user"]>;

function normalizeUserProfile(id: string, data: Record<string, any>) {
  const role = data.role === "Admin" || data.role === "Moderator" ? data.role : "Student";
  return {
    id,
    uid: data.uid || id,
    email: data.email || "",
    name: data.name || data.email?.split("@")[0] || "Student Contributor",
    role,
    reputation: Number(data.reputation || 0),
    isBanned: Boolean(data.isBanned),
    university: data.university || "",
    department: data.department || "",
    degree: data.degree || data.track || "",
    grade: data.grade || "",
    bio: data.bio || "",
    createdAt: toDate(data.createdAt).toISOString(),
    updatedAt: data.updatedAt ? toDate(data.updatedAt).toISOString() : undefined,
  };
}

async function getOrCreateUserProfile(user: AuthenticatedUser) {
  const ref = db.collection("users").doc(user.uid);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    await ref.set({
      uid: user.uid,
      email: user.email || `${user.uid}@firebase.local`,
      name: user.name || user.email?.split("@")[0] || "Student Contributor",
      role: "Student",
      reputation: 0,
      isBanned: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  } else {
    const data = snapshot.data() || {};
    const missingCoreFields = !data.uid || !data.email || !data.name;
    if (missingCoreFields) {
      await ref.set({
        uid: data.uid || user.uid,
        email: data.email || user.email || `${user.uid}@firebase.local`,
        name: data.name || user.name || user.email?.split("@")[0] || "Student Contributor",
      }, { merge: true });
    }
  }

  const updated = await ref.get();
  return normalizeUserProfile(updated.id, updated.data() || {});
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "PakStudy Hub API",
      firebaseAdmin: getFirebaseAdminDiagnostics(),
      env: {
        firebaseProjectIdPresent: Boolean(process.env.FIREBASE_PROJECT_ID),
        googleCloudProjectPresent: Boolean(process.env.GOOGLE_CLOUD_PROJECT),
        firebaseStorageBucketPresent: Boolean(process.env.FIREBASE_STORAGE_BUCKET),
        firebaseServiceAccountJsonPresent: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON),
      },
    });
  });

  app.post(
    "/api/contact-messages",
    asyncRoute(async (req) => {
      const input = parseBody(contactMessageSchema, req);
      const ref = db.collection("contactMessages").doc();
      await ref.set({
        ...input,
        status: "new",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { id: ref.id, status: "new" };
    }, "/api/contact-messages"),
  );

  app.get(
    "/api/admin/contact-messages",
    requireAuth,
    requireAdmin,
    asyncRoute(async () => {
      const snap = await db.collection("contactMessages").orderBy("createdAt", "desc").limit(100).get();
      return snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: toDate(doc.data().createdAt).toISOString(),
      }));
    }, "/api/admin/contact-messages"),
  );

  app.patch(
    "/api/admin/contact-messages/:id",
    requireAuth,
    requireAdmin,
    asyncRoute(async (req) => {
      const input = parseBody(contactStatusSchema, req);
      const ref = db.collection("contactMessages").doc(req.params.id);
      await ref.set({ status: input.status, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      const updated = await ref.get();
      return {
        id: updated.id,
        ...updated.data(),
        createdAt: toDate(updated.data()?.createdAt).toISOString(),
      };
    }, "/api/admin/contact-messages"),
  );

  app.get(
    "/api/resources/public",
    asyncRoute(async (req) => {
      const query = db.collection("resources").where("status", "==", "approved");
      const snap = await query.limit(250).get();
      const resources = snap.docs
        .map((doc) => normalizePublicResource(doc.id, doc.data()))
        .filter((resource) => matchesResourceFilters(resource, req.query))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return resources;
    }, "/api/resources/public"),
  );

  app.get(
    "/api/resources/mine",
    requireAuth,
    asyncRoute(async (req) => storage.listResourcesByUploader(currentUser(req).uid), "/api/resources/mine"),
  );

  app.get(
    "/api/resources",
    asyncRoute(async (req) => {
      const snap = await db.collection("resources").where("status", "==", "approved").limit(250).get();
      return snap.docs
        .map((doc) => normalizePublicResource(doc.id, doc.data()))
        .filter((resource) => matchesResourceFilters(resource, req.query))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, "/api/resources"),
  );

  app.get(
    "/api/resources/:id",
    asyncRoute(async (req, res) => {
      const user = await optionalCurrentUser(req);
      const snap = await db.collection("resources").doc(req.params.id).get();
      if (!snap.exists) return res.status(404).json({ message: "Resource not found" });
      const resource = normalizePublicResource(snap.id, snap.data() || {});
      if (!canViewResource(resource, user)) {
        return res.status(403).json({ message: "This resource is not publicly available yet." });
      }
      return resource;
    }, "/api/resources/:id"),
  );

  app.post(
    "/api/resources/:id/view",
    asyncRoute(async (req, res) => {
      const user = await optionalCurrentUser(req);
      const ref = db.collection("resources").doc(req.params.id);
      const snap = await ref.get();
      if (!snap.exists) return res.status(404).json({ message: "Resource not found" });
      const resource = normalizePublicResource(snap.id, snap.data() || {});
      if (!canViewResource(resource, user)) return res.status(403).json({ message: "Cannot view this resource" });
      await ref.update({ views: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() });
      return { ok: true };
    }, "/api/resources/:id/view"),
  );

  app.post(
    "/api/resources/:id/download",
    asyncRoute(async (req, res) => {
      const user = await optionalCurrentUser(req);
      const ref = db.collection("resources").doc(req.params.id);
      const snap = await ref.get();
      if (!snap.exists) return res.status(404).json({ message: "Resource not found" });
      const resource = normalizePublicResource(snap.id, snap.data() || {});
      if (!canViewResource(resource, user)) return res.status(403).json({ message: "Cannot download this resource" });
      await ref.update({ downloads: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() });
      return { ok: true, fileUrl: resource.fileUrl || resource.file?.url };
    }, "/api/resources/:id/download"),
  );

  app.post(
    "/api/resources/:id/report",
    asyncRoute(async (req) => {
      const user = await optionalCurrentUser(req);
      const reason = typeof req.body?.reason === "string" && req.body.reason.trim()
        ? req.body.reason.trim().slice(0, 1000)
        : "Resource reported from public detail page";
      const message = typeof req.body?.message === "string" ? req.body.message.trim().slice(0, 2000) : "";
      await db.collection("reports").doc().set({
        type: "resource",
        contentType: "resource",
        contentId: req.params.id,
        reason,
        message,
        reporterId: user?.uid || "anonymous",
        status: "pending",
        createdAt: FieldValue.serverTimestamp(),
      });
      return { ok: true };
    }, "/api/resources/:id/report"),
  );

  app.post(
    "/api/payments/webhook",
    asyncRoute(async (req) => {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret || !stripe) {
        throw Object.assign(new Error("Stripe webhook is not configured"), { status: 503 });
      }

      const signature = req.header("stripe-signature");
      if (!signature) throw Object.assign(new Error("Missing Stripe signature"), { status: 400 });
      const event = requireStripe().webhooks.constructEvent(req.rawBody as Buffer, signature, webhookSecret);

      if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object;
        if (paymentIntent.metadata.type === "wallet_top_up") {
          await storage.topUpWallet(
            paymentIntent.metadata.userId,
            Number(paymentIntent.metadata.amount),
            paymentIntent.id,
          );
        }
        if (paymentIntent.metadata.type === "note_purchase") {
          await storage.purchaseNote({
            buyerId: paymentIntent.metadata.buyerId,
            noteId: paymentIntent.metadata.noteId,
            paymentIntentId: paymentIntent.id,
          });
        }
      }
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        if (session.metadata?.type === "wallet_top_up") {
          await storage.topUpWallet(
            session.metadata.userId,
            Number(session.metadata.amount),
            session.id,
          );
        }
        if (session.metadata?.type === "note_purchase") {
          await storage.purchaseNote({
            buyerId: session.metadata.buyerId,
            noteId: session.metadata.noteId,
            paymentIntentId: session.id,
          });
        }
      }

      return { received: true };
    }),
  );

  app.post(
    "/api/users/me",
    requireAuth,
    asyncRoute(async (req) => {
      const user = currentUser(req);
      const profile = await storage.getUser(user.uid);
      return profile;
    }, "/api/user/profile"),
  );

  app.get(
    "/api/user/profile",
    requireAuth,
    asyncRoute(async (req) => {
      const user = currentUser(req);
      return getOrCreateUserProfile(user);
    }, "/api/user/profile"),
  );

  app.patch(
    "/api/user/profile",
    requireAuth,
    asyncRoute(async (req) => {
      const user = currentUser(req);
      const input = parseBody(userProfilePatchSchema, req);
      const existing = await getOrCreateUserProfile(user);
      await db.collection("users").doc(user.uid).set({
        uid: user.uid,
        email: existing.email || user.email || `${user.uid}@firebase.local`,
        name: input.name ?? existing.name,
        university: input.university ?? existing.university,
        department: input.department ?? existing.department,
        degree: input.degree ?? existing.degree,
        track: input.degree ?? existing.degree,
        grade: input.grade ?? existing.grade,
        bio: input.bio ?? existing.bio,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      const updated = await db.collection("users").doc(user.uid).get();
      return normalizeUserProfile(updated.id, updated.data() || {});
    }, "/api/user/profile"),
  );

  app.get(
    "/api/users/:id",
    requireAuth,
    asyncRoute(async (req, res) => {
      const authUser = currentUser(req);
      if (authUser.uid !== req.params.id && authUser.role !== "Admin" && authUser.role !== "Moderator") {
        return res.status(403).json({ message: "Cannot read another user's private profile" });
      }
      const user = await storage.getUser(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      return user;
    }),
  );

  app.patch(
    "/api/users/me/profile",
    requireAuth,
    asyncRoute(async (req) => {
      const user = currentUser(req);
      return storage.updateProfile(user.uid, parseBody(updateProfileSchema, req));
    }),
  );

  app.post(
    "/api/uploads",
    requireAuth,
    upload.single("file"),
    asyncRoute(async (req) => {
      const user = currentUser(req);
      if (!req.file) throw Object.assign(new Error("No file uploaded"), { status: 400 });
      const file = await saveUploadedFile(user.uid, req.file);
      await logEvent("file_uploaded", user.uid, { contentType: file.contentType, size: file.size });
      return file;
    }),
  );

  app.post(
    "/api/wallet/top-up",
    requireAuth,
    asyncRoute(async (req) => {
      const user = currentUser(req);
      const input = parseBody(walletTopUpSchema, req);
      const intent = await createWalletTopUpIntent(user.uid, input.amount);
      await logEvent("wallet_top_up_intent_created", user.uid, { amount: input.amount });
      return intent;
    }),
  );

  app.get(
    "/api/users/me/transactions",
    requireAuth,
    asyncRoute(async (req) => storage.listWalletTransactions(currentUser(req).uid)),
  );

  app.get(
    "/api/questions",
    asyncRoute(async (req) =>
      storage.listQuestions({
        subject: typeof req.query.subject === "string" ? req.query.subject : undefined,
        search: typeof req.query.search === "string" ? req.query.search : undefined,
        unanswered: req.query.unanswered === "true",
      }),
    ),
  );

  app.post(
    "/api/questions",
    requireAuth,
    asyncRoute(async (req) => {
      const user = currentUser(req);
      const input = parseBody(createQuestionSchema, req);
      const question = await storage.createQuestion({
        ...input,
        userId: user.uid,
        userName: user.name,
      });
      await logEvent("question_created", user.uid, { questionId: question.id, sellNotes: question.sellNotes });
      return question;
    }),
  );

  app.get(
    "/api/questions/:id",
    asyncRoute(async (req, res) => {
      const question = await storage.getQuestion(req.params.id);
      if (!question) return res.status(404).json({ message: "Question not found" });
      return question;
    }),
  );

  app.post(
    "/api/questions/:id/upvote",
    requireAuth,
    asyncRoute(async (req) => storage.upvoteQuestion(req.params.id, currentUser(req).uid)),
  );

  app.post(
    "/api/questions/:id/save",
    requireAuth,
    asyncRoute(async (req) => storage.saveQuestion(req.params.id, currentUser(req).uid)),
  );

  app.get(
    "/api/users/me/saved-questions",
    requireAuth,
    asyncRoute(async (req) => storage.listSavedQuestions(currentUser(req).uid)),
  );

  app.get(
    "/api/questions/:id/answers",
    asyncRoute(async (req) => storage.listAnswers(req.params.id)),
  );

  app.post(
    "/api/questions/:id/answers",
    requireAuth,
    asyncRoute(async (req) => {
      const user = currentUser(req);
      const input = parseBody(createAnswerSchema, req);
      return storage.createAnswer(req.params.id, { ...input, userId: user.uid, userName: user.name });
    }),
  );

  app.post(
    "/api/questions/:questionId/answers/:answerId/correct",
    requireAuth,
    asyncRoute(async (req) =>
      storage.markAnswerCorrect(req.params.questionId, req.params.answerId, currentUser(req).uid),
    ),
  );

  app.get(
    "/api/notes",
    asyncRoute(async (req) =>
      storage.listNotes({
        search: typeof req.query.search === "string" ? req.query.search : undefined,
        course: typeof req.query.course === "string" ? req.query.course : undefined,
      }),
    ),
  );

  app.post(
    "/api/notes/purchase",
    requireAuth,
    asyncRoute(async (req) => {
      const user = currentUser(req);
      const input = parseBody(purchaseSchema, req);
      const note = await storage.getQuestion(input.noteId);
      if (!note?.sellNotes || !note.notesPrice) {
        throw Object.assign(new Error("Paid notes not found"), { status: 404 });
      }
      const intent = await createNotePurchaseIntent(user.uid, input.noteId, note.notesPrice);
      await logEvent("note_purchase_intent_created", user.uid, { noteId: input.noteId, amount: note.notesPrice });
      return intent;
    }),
  );

  app.post(
    "/api/pending-courses",
    requireAuth,
    asyncRoute(async (req) => {
      const user = currentUser(req);
      const input = parseBody(pendingCourseSchema, req);
      return storage.createPendingCourse({ ...input, userId: user.uid });
    }),
  );

  app.get(
    "/api/admin/pending-courses",
    requireAuth,
    requireAdmin,
    asyncRoute(async () => storage.listPendingCourses()),
  );

  app.patch(
    "/api/admin/pending-courses/:id",
    requireAuth,
    requireAdmin,
    asyncRoute(async (req) => {
      const status = req.body.status === "approved" ? "approved" : "rejected";
      return storage.reviewPendingCourse(req.params.id, status);
    }),
  );

  app.post(
    "/api/reports",
    requireAuth,
    asyncRoute(async (req) => {
      const user = currentUser(req);
      const input = parseBody(reportSchema, req);
      return storage.createReport({ ...input, reporterId: user.uid });
    }),
  );

  app.get(
    "/api/admin/reports",
    requireAuth,
    requireAdmin,
    asyncRoute(async () => storage.listReports()),
  );

  app.patch(
    "/api/admin/reports/:id",
    requireAuth,
    requireAdmin,
    asyncRoute(async (req) => {
      const action = req.body.action === "banned" || req.body.action === "dismissed" ? req.body.action : "deleted";
      return storage.resolveReport(req.params.id, action);
    }),
  );

  app.get(
    "/api/admin/stats",
    requireAuth,
    requireAdmin,
    asyncRoute(async () => storage.getAdminStats()),
  );

  app.get(
    "/api/admin/resources",
    requireAuth,
    requireAdmin,
    asyncRoute(async (req) => storage.listResources({
      visibility: typeof req.query.visibility === "string" ? req.query.visibility : undefined,
    })),
  );

  app.post(
    "/api/admin/resources",
    requireAuth,
    requireAdmin,
    upload.single("file"),
    asyncRoute(async (req) => {
      const user = currentUser(req);
      if (!req.file) throw Object.assign(new Error("Resource file is required"), { status: 400 });

      const input = parseResourceUploadBody(req.body);
      const file = await saveUploadedFile(user.uid, req.file, "resources");
      const resource = await storage.createResource({
        ...input,
        file,
        uploadedBy: user.uid,
        uploadedByName: user.name,
      });
      trackEvent("admin_resource_uploaded", user.uid, {
        resourceId: resource.id,
        resourceType: resource.resourceType,
        visibility: resource.visibility,
        contentType: file.contentType,
        size: file.size,
      });
      return resource;
    }),
  );

  app.get(
    "/api/contributor/resources",
    requireAuth,
    asyncRoute(async (req) => storage.listResourcesByUploader(currentUser(req).uid), "/api/contributor/resources"),
  );

  app.get(
    "/api/contributor/stats",
    requireAuth,
    asyncRoute(async (req) => storage.getContributorStats(currentUser(req).uid), "/api/contributor/stats"),
  );

  app.post(
    "/api/contributor/resources",
    requireAuth,
    upload.single("file"),
    asyncRoute(async (req) => {
      const user = currentUser(req);
      if (!req.file) throw Object.assign(new Error("Resource file is required"), { status: 400 });
      const fileKind = validateContributorFile(req.file);
      const adminCurated = parseBooleanField(req.body.adminCurated);
      const showAdminNamePublicly = parseBooleanField(req.body.showAdminNamePublicly);
      const sourceLabel = typeof req.body.sourceLabel === "string" && req.body.sourceLabel.trim()
        ? req.body.sourceLabel.trim().slice(0, 120)
        : "PakStudy Hub Team";
      const sourceNote = typeof req.body.sourceNote === "string" ? req.body.sourceNote.trim().slice(0, 1000) : "";

      if (adminCurated && user.role !== "Admin") {
        throw Object.assign(new Error("Only Admin users can upload admin curated resources"), { status: 403 });
      }
      if (adminCurated && !sourceNote) {
        throw Object.assign(new Error("Permission/source note is required for admin curated resources"), { status: 400 });
      }

      const input = parseContributorUploadBody(req.body);
      const file = await saveUploadedFile(user.uid, req.file, "resources", [
        input.university,
        input.faculty,
        input.degree,
        input.semester,
        `${input.courseCode} ${input.courseTitle}`,
        input.resourceCategory,
      ]);
      const resource = await storage.createContributorResource({
        ...input,
        file,
        uploaderId: user.uid,
        uploaderEmail: user.email,
        uploaderName: user.name,
        fileCategory: fileKind.category,
        fileExtension: fileKind.extension,
        isAdminCurated: adminCurated,
        curatedBy: adminCurated ? user.uid : undefined,
        sourceLabel: adminCurated ? sourceLabel : undefined,
        sourceNote: adminCurated ? sourceNote : undefined,
        showAdminNamePublicly: adminCurated ? showAdminNamePublicly : undefined,
      });
      trackEvent("contributor_resource_submitted", user.uid, {
        resourceId: resource.id,
        resourceType: resource.resourceType,
        contentType: file.contentType,
        size: file.size,
        adminCurated,
      });
      return resource;
    }, "/api/contributor/resources"),
  );


  app.post(
    "/api/admin/resources/backfill-storage-paths",
    requireAuth,
    asyncRoute(async (req) => {
      const user = requireStrictAdmin(req);
      const snap = await db.collection("resources").limit(500).get();
      let updated = 0;
      let missing = 0;
      const batch = db.batch();

      snap.docs.forEach((doc) => {
        const data = doc.data();
        if (data.storagePath || data.storageObjectPath || data.filePath) return;
        const storagePath = storagePathForResource(data);
        if (!storagePath) {
          missing += 1;
          return;
        }
        updated += 1;
        batch.set(doc.ref, {
          storagePath,
          filePath: storagePath,
          storageObjectPath: storagePath,
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
      });

      if (updated > 0) await batch.commit();
      await writeResourceAuditLog({
        action: "resource_storage_path_backfill",
        performedBy: user.uid,
        performedByEmail: user.email,
        result: `updated:${updated};missing:${missing}`,
      });
      return { updated, missing };
    }, "/api/admin/resources/backfill-storage-paths"),
  );

  app.post(
    "/api/admin/resources/:id/hide",
    requireAuth,
    requireAdmin,
    asyncRoute(async (req) => {
      const user = currentUser(req);
      const ref = db.collection("resources").doc(req.params.id);
      const snap = await ref.get();
      if (!snap.exists) throw Object.assign(new Error("Resource not found"), { status: 404 });
      const data = snap.data() || {};
      const storagePath = storagePathForResource(data);

      await ref.set({
        status: "hidden",
        reviewStatus: "hidden",
        visibility: "private",
        hiddenAt: FieldValue.serverTimestamp(),
        hiddenBy: user.uid,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      await writeResourceAuditLog({
        action: "resource_hidden",
        resourceId: snap.id,
        resourceTitle: data.title,
        fileName: data.fileName || data.file?.originalName,
        storagePath,
        performedBy: user.uid,
        performedByEmail: user.email,
        result: "hidden",
      });

      const updated = await ref.get();
      return normalizePublicResource(updated.id, updated.data() || {});
    }, "/api/admin/resources/hide"),
  );

  app.delete(
    "/api/admin/resources/:id",
    requireAuth,
    asyncRoute(async (req) => {
      const user = requireStrictAdmin(req);
      const ref = db.collection("resources").doc(req.params.id);
      const snap = await ref.get();
      if (!snap.exists) throw Object.assign(new Error("Resource not found"), { status: 404 });

      const data = snap.data() || {};
      const storagePath = storagePathForResource(data);
      let result = "deleted";
      let errorMessage = "";

      if (storagePath) {
        try {
          await bucket.file(storagePath).delete({ ignoreNotFound: true } as any);
        } catch (error: any) {
          result = "metadata_deleted_storage_delete_failed";
          errorMessage = error?.message || "Storage file could not be deleted.";
          console.warn("Resource metadata deleted but storage file deletion failed", { resourceId: snap.id, storagePath, message: errorMessage });
        }
      } else {
        result = "metadata_deleted_storage_path_missing";
        errorMessage = "Storage file path missing; metadata deleted but file may remain.";
        console.warn(errorMessage, { resourceId: snap.id });
      }

      await ref.delete();
      await writeResourceAuditLog({
        action: "resource_deleted",
        resourceId: snap.id,
        resourceTitle: data.title,
        fileName: data.fileName || data.file?.originalName,
        storagePath,
        performedBy: user.uid,
        performedByEmail: user.email,
        result,
        errorMessage,
      });

      return { ok: true, resourceId: snap.id, result, warning: errorMessage || undefined };
    }, "/api/admin/resources/delete"),
  );
  app.get(
    "/api/admin/resources/pending",
    requireAuth,
    requireAdmin,
    asyncRoute(async () => storage.listPendingResources()),
  );

  app.patch(
    "/api/admin/resources/:id/review",
    requireAuth,
    requireAdmin,
    asyncRoute(async (req) => {
      const user = currentUser(req);
      const input = parseBody(resourceReviewSchema, req);
      const resource = await storage.reviewResource(req.params.id, {
        action: input.action,
        rejectionReason: input.rejectionReason,
        reviewedBy: user.uid,
      });
      await logEvent("admin_resource_reviewed", user.uid, {
        resourceId: resource.id,
        action: input.action,
      });
      return resource;
    }, "/api/admin/resources/review"),
  );

  app.get(
    "/api/leaderboard",
    asyncRoute(async () => storage.getLeaderboard()),
  );

  app.get(
    "/api/study-rooms",
    asyncRoute(async (req) => storage.listStudyRooms({
      university: typeof req.query.university === "string" ? req.query.university : undefined,
      search: typeof req.query.search === "string" ? req.query.search : undefined,
    })),
  );

  app.post(
    "/api/study-rooms",
    requireAuth,
    asyncRoute(async (req) => {
      const user = currentUser(req);
      return storage.createStudyRoom({ ...parseBody(studyRoomSchema, req), hostId: user.uid, hostName: user.name });
    }),
  );

  app.post(
    "/api/study-rooms/:id/join",
    requireAuth,
    asyncRoute(async (req) => storage.joinStudyRoom(req.params.id, currentUser(req).uid)),
  );

  app.get(
    "/api/flashcards",
    requireAuth,
    asyncRoute(async (req) => storage.listFlashcards(currentUser(req).uid)),
  );

  app.post(
    "/api/flashcards",
    requireAuth,
    asyncRoute(async (req) => storage.createFlashcard(currentUser(req).uid, parseBody(flashcardSchema, req))),
  );

  app.post(
    "/api/support/messages",
    requireAuth,
    asyncRoute(async (req) => {
      const input = parseBody(supportMessageSchema, req);
      return storage.createSupportMessage(currentUser(req).uid, input.message);
    }),
  );

  app.post(
    "/api/admin/support/:ticketId/reply",
    requireAuth,
    requireAdmin,
    asyncRoute(async (req) => {
      const input = parseBody(adminMessageSchema, req);
      return storage.replySupportTicket(req.params.ticketId, input.text);
    }),
  );

  app.get(
    "/api/messages",
    requireAuth,
    asyncRoute(async (req) => storage.listConversations(currentUser(req).uid)),
  );

  app.get(
    "/api/messages/:conversationId",
    requireAuth,
    asyncRoute(async (req) => storage.listMessages(req.params.conversationId, currentUser(req).uid)),
  );

  app.post(
    "/api/messages",
    requireAuth,
    asyncRoute(async (req) => {
      const user = currentUser(req);
      return storage.sendDirectMessage(user.uid, user.name, parseBody(directMessageSchema, req));
    }),
  );

  app.post(
    "/api/ai-tutor",
    requireAuth,
    asyncRoute(async (req) => {
      const user = currentUser(req);
      const input = parseBody(aiTutorMessageSchema, req);
      const apiKey = process.env.OPENAI_API_KEY;
      let answer =
        `Let's break this down${input.subject ? ` for ${input.subject}` : ""}: identify what is given, ` +
        "write the relevant formula or concept, solve one step at a time, then check units and assumptions.";

      if (apiKey) {
        const response = await fetch("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
            input: [
              {
                role: "system",
                content: "You are a helpful, safe tutor for Pakistani students. Explain step by step without doing academic dishonesty.",
              },
              { role: "user", content: input.question },
            ],
          }),
        });
        if (response.ok) {
          const payload = await response.json() as any;
          answer = payload.output_text || answer;
        }
      }

      await logEvent("ai_tutor_message", user.uid, { subject: input.subject ?? null });
      return { answer };
    }),
  );

  return httpServer;
}

