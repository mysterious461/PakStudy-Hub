import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("Student"),
  university: text("university"),
  grade: text("grade"),
  track: text("track"),
  bio: text("bio"),
  subjects: jsonb("subjects").$type<string[]>().notNull().default([]),
  reputation: integer("reputation").notNull().default(0),
  walletBalance: integer("wallet_balance").notNull().default(0),
  isBanned: boolean("is_banned").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  level: text("level"),
  degree: text("degree"),
  course: text("course").notNull(),
  subject: text("subject").notNull(),
  university: text("university"),
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  sellNotes: boolean("sell_notes").notNull().default(false),
  notesPrice: integer("notes_price"),
  notesFileUrl: text("notes_file_url"),
  attachmentUrls: jsonb("attachment_urls").$type<string[]>().notNull().default([]),
  upvotes: integer("upvotes").notNull().default(0),
  commentsCount: integer("comments_count").notNull().default(0),
  status: text("status").notNull().default("published"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const answers = pgTable("answers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questionId: text("question_id").notNull(),
  content: text("content").notNull(),
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
  isCorrect: boolean("is_correct").notNull().default(false),
  upvotes: integer("upvotes").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(80),
  role: z.string().default("Student"),
  university: z.string().nullable().optional(),
  grade: z.string().nullable().optional(),
  track: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  subjects: z.array(z.string()).default([]),
  reputation: z.number().int().default(0),
  walletBalance: z.number().int().default(0),
  isBanned: z.boolean().default(false),
});

export const upsertUserSchema = insertUserSchema.partial().extend({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(2).max(80),
});

export const createQuestionSchema = z.object({
  title: z.string().min(4).max(180),
  content: z.string().min(10).max(5000),
  level: z.string().optional().default(""),
  degree: z.string().optional().default(""),
  course: z.string().min(1),
  subject: z.string().optional(),
  university: z.string().nullable().optional(),
  userId: z.string().min(1).optional(),
  userName: z.string().min(1).max(80).optional(),
  isAnonymous: z.boolean().optional().default(false),
  sellNotes: z.boolean().optional().default(false),
  notesPrice: z.coerce.number().int().positive().optional(),
  notesFileUrl: z.string().url().optional(),
  attachmentUrls: z.array(z.string().url()).optional().default([]),
});

export const createAnswerSchema = z.object({
  content: z.string().min(2).max(3000),
  userId: z.string().min(1).optional(),
  userName: z.string().min(1).max(80).optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  grade: z.string().max(80).optional(),
  track: z.string().max(80).optional(),
  university: z.string().max(160).optional(),
  bio: z.string().max(280).optional(),
  subjects: z.array(z.string()).optional(),
});

export const pendingCourseSchema = z.object({
  courseNo: z.string().min(2).max(40),
  degreeName: z.string().min(2).max(120),
  university: z.string().min(2).max(160),
  semesterNo: z.string().min(1).max(40),
  userId: z.string().min(1).optional(),
});

export const reportSchema = z.object({
  type: z.enum(["Spam", "Inappropriate", "Plagiarism", "Harassment", "Other"]),
  contentType: z.enum(["question", "answer", "user", "note"]).default("question"),
  contentId: z.string().min(1),
  reportedUserId: z.string().optional(),
  reporterId: z.string().min(1).optional(),
  reason: z.string().min(4).max(500),
});

export const walletTopUpSchema = z.object({
  amount: z.coerce.number().int().positive().max(500_000),
});

export const purchaseSchema = z.object({
  noteId: z.string().min(1),
});

export const supportMessageSchema = z.object({
  message: z.string().min(2).max(2000),
});

export const aiTutorMessageSchema = z.object({
  question: z.string().min(2).max(2000),
  subject: z.string().optional(),
});

export const flashcardSchema = z.object({
  subject: z.string().min(1).max(120),
  topic: z.string().min(1).max(120),
  front: z.string().min(2).max(1000),
  back: z.string().min(2).max(2000),
  level: z.string().min(1).max(80).default("Intermediate"),
});

export const studyRoomSchema = z.object({
  title: z.string().min(3).max(160),
  university: z.string().min(2).max(160),
  subject: z.string().min(2).max(120),
  tags: z.array(z.string()).default([]),
});

export const directMessageSchema = z.object({
  recipientId: z.string().min(1),
  text: z.string().min(1).max(2000),
});

export const adminMessageSchema = z.object({
  text: z.string().min(1).max(2000),
});

export const resourceUploadSchema = z.object({
  university: z.string().min(2).max(160),
  department: z.string().min(2).max(160),
  degree: z.string().min(2).max(160),
  semester: z.string().min(1).max(60),
  course: z.string().min(2).max(160),
  resourceType: z.enum(["notes", "past_papers", "past_paper", "book", "slides", "assignment_solution", "assignment", "lab_manual", "formula_sheet", "solution", "image", "voice_note", "other"]),
  title: z.string().min(3).max(180),
  year: z.coerce.number().int().min(1990).max(2100),
  description: z.string().max(1200).optional().default(""),
  tags: z.array(z.string().min(1).max(40)).max(20).default([]),
  visibility: z.enum(["draft", "private", "public"]).default("draft"),
  uploaderNameSource: z.string().min(2).max(160),
  permissionStatus: z.enum(["owned", "licensed", "permission_granted", "pending", "unknown"]).default("pending"),
});

export const contributorResourceSchema = z.object({
  university: z.string().min(2).max(160),
  department: z.string().min(2).max(160),
  degree: z.string().min(2).max(160),
  semester: z.string().min(1).max(60),
  course: z.string().min(2).max(160),
  resourceType: z.enum(["notes", "past_papers", "slides", "lab_manual", "assignment_solution", "formula_sheet", "other"]),
  title: z.string().min(3).max(180),
  description: z.string().min(1).max(1200),
  tags: z.array(z.string().min(1).max(40)).max(20).default([]),
  hasPermission: z.coerce.boolean().refine((value) => value, "Permission confirmation is required"),
});

export const resourceReviewSchema = z.object({
  action: z.enum(["approved", "rejected", "changes_requested"]),
  rejectionReason: z.string().max(500).optional().default(""),
});

export type InsertUser = z.input<typeof insertUserSchema>;
export type UpsertUser = z.input<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type Answer = typeof answers.$inferSelect;
export type CreateQuestion = z.input<typeof createQuestionSchema>;
export type CreateAnswer = z.input<typeof createAnswerSchema>;
export type UpdateProfile = z.input<typeof updateProfileSchema>;
export type PendingCourseInput = z.input<typeof pendingCourseSchema>;
export type ReportInput = z.input<typeof reportSchema>;
export type WalletTopUp = z.input<typeof walletTopUpSchema>;
export type PurchaseInput = z.input<typeof purchaseSchema>;
export type SupportMessageInput = z.input<typeof supportMessageSchema>;
export type AiTutorMessageInput = z.input<typeof aiTutorMessageSchema>;
export type FlashcardInput = z.input<typeof flashcardSchema>;
export type StudyRoomInput = z.input<typeof studyRoomSchema>;
export type DirectMessageInput = z.input<typeof directMessageSchema>;
export type AdminMessageInput = z.input<typeof adminMessageSchema>;
export type AcademicResourceInput = z.input<typeof resourceUploadSchema>;
export type AcademicResourceMetadata = z.output<typeof resourceUploadSchema>;
export type ContributorResourceInput = z.input<typeof contributorResourceSchema>;
export type ContributorResourceMetadata = z.output<typeof contributorResourceSchema>;
export type ResourceReviewInput = z.input<typeof resourceReviewSchema>;

export type StoredFile = {
  path: string;
  url: string;
  contentType: string;
  size: number;
  originalName: string;
};

export type AcademicResource = AcademicResourceMetadata & {
  id: string;
  file: StoredFile;
  status: "pending" | "approved" | "rejected" | "changes_requested";
  reviewStatus?: "pending" | "approved" | "rejected" | "changes_requested";
  rejectionReason?: string;
  reviewedAt?: Date;
  reviewedBy?: string;
  uploadedBy: string;
  uploadedByName: string;
  uploaderId?: string;
  uploaderEmail?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  hasPermission?: boolean;
  createdAt: Date;
  updatedAt?: Date;
};

export type NoteListing = Question & {
  rating: number;
  purchases: number;
  sellerName: string;
};

export type WalletTransaction = {
  id: string;
  userId: string;
  type: "top_up" | "purchase" | "sale" | "platform_fee";
  amount: number;
  description: string;
  createdAt: Date;
};

export type PendingCourse = PendingCourseInput & {
  id: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
};

export type Report = ReportInput & {
  id: string;
  status: "pending" | "resolved" | "dismissed";
  action?: string;
  createdAt: Date;
};

export type SupportTicket = {
  id: string;
  userId: string;
  messages: Array<{ sender: "user" | "admin"; text: string; createdAt: Date }>;
  status: "open" | "closed";
  createdAt: Date;
};

export type StudyRoom = {
  id: string;
  title: string;
  university: string;
  subject: string;
  tags: string[];
  hostId: string;
  hostName: string;
  members: number;
  isLive: boolean;
  createdAt: Date;
};

export type Flashcard = FlashcardInput & {
  id: string;
  ownerId: string;
  createdAt: Date;
};

export type DirectConversation = {
  id: string;
  memberIds: string[];
  lastMessage: string;
  updatedAt: Date;
  unreadCount?: number;
};

export type DirectMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  text: string;
  read: boolean;
  createdAt: Date;
};

export type PaymentIntentResponse = {
  paymentIntentId: string;
  clientSecret: string | null;
  checkoutUrl?: string | null;
  amount: number;
  currency: string;
};
